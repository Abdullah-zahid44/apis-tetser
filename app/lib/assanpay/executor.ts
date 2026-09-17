import crypto from 'node:crypto';
import { getAssanPayCredentials } from './credentials';
import { generateRequestSignature } from './signing';
import { validateAssanPayUrl } from '../security/ssrf';
import { sanitizeForAudit } from '../security/audit-sanitizer';
import { getDb } from '../db';
import { requestHistory } from '../db/schema';
import type { AuthenticatedUser } from '../auth/session';

export type ExecuteRequestInput = {
  country: string;
  environment?: string;
  method: string;
  relativePath: string;
  queryParams?: Record<string, string>;
  headers?: Record<string, string>;
  body?: string;
  requestName?: string;
  endpointId?: string;
  requiresSignature?: boolean;
  timeoutMs?: number;
  user?: AuthenticatedUser | null;
};

export type ExecuteResponseContract = {
  ok: boolean;
  upstream: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: unknown;
    rawBody: string;
  };
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: unknown;
  };
  meta: {
    country: string;
    environment: string;
    durationMs: number;
    responseSize: number;
    requestId: string;
    signed: boolean;
    encrypted: false;
    decrypted: false;
    executedAt: string;
    executedBy?: string;
  };
  error?: {
    type: string;
    code?: string;
    message: string;
  };
};

/**
 * Robust execution pipeline for AssanPay requests.
 */
export async function executeAssanPayRequest(
  input: ExecuteRequestInput
): Promise<ExecuteResponseContract> {
  const startedAt = Date.now();
  const country = input.country.toLowerCase();
  const environment = (input.environment || 'sandbox').toLowerCase();
  const method = input.method.toUpperCase();
  const timeoutMs = input.timeoutMs || 30_000;
  const requestId = crypto.randomUUID();
  const executedAt = new Date().toISOString();

  // 1. Resolve server-side credentials
  const creds = getAssanPayCredentials(country, environment);
  if (!creds.baseUrl || !creds.apiKey || !creds.apiSecret) {
    const errObj = {
      type: 'CONFIG_MISSING',
      code: 'CREDENTIALS_NOT_CONFIGURED',
      message: `${country.toUpperCase()} (${environment.toUpperCase()}) credentials are not configured on the server. Set the appropriate ASSANPAY_${country.toUpperCase()}_* environment variables.`,
    };
    return buildErrorResponse(input, 503, 'Configuration Required', errObj, startedAt, requestId, executedAt);
  }

  // 2. Validate URL & Protect Against SSRF
  let fullPath = input.relativePath.trim();
  if (!fullPath.startsWith('/')) fullPath = '/' + fullPath;

  // Merge and deduplicate query parameters cleanly
  const [pathPart, existingQuery] = fullPath.split('?');
  const sp = new URLSearchParams(existingQuery || '');
  if (input.queryParams && Object.keys(input.queryParams).length > 0) {
    for (const [k, v] of Object.entries(input.queryParams)) {
      if (k.trim()) {
        sp.set(k.trim(), v);
      }
    }
  }
  const queryString = sp.toString();
  fullPath = queryString ? `${pathPart}?${queryString}` : pathPart;

  const ssrfCheck = validateAssanPayUrl(fullPath, creds.baseUrl);
  if (!ssrfCheck.valid || !ssrfCheck.finalUrl) {
    const errObj = {
      type: 'SSRF_BLOCKED',
      code: 'INVALID_HOST_OR_PATH',
      message: ssrfCheck.error || 'Request destination failed security validation.',
    };
    return buildErrorResponse(input, 400, 'Security Validation Failed', errObj, startedAt, requestId, executedAt);
  }

  const targetUrl = ssrfCheck.finalUrl;
  const pathWithQuery = `${targetUrl.pathname}${targetUrl.search}`;

  // 3. Prepare body (serialized ONCE)
  let rawBody = '';
  let parsedJsonBody: unknown = null;
  if (method !== 'GET' && method !== 'HEAD') {
    rawBody = (input.body || '').trim();
    if (rawBody) {
      try {
        parsedJsonBody = JSON.parse(rawBody);
        // Serialize once to guarantee single string representation
        rawBody = JSON.stringify(parsedJsonBody);
      } catch {
        const errObj = {
          type: 'VALIDATION_ERROR',
          code: 'MALFORMED_JSON',
          message: 'Request body must be valid JSON.',
        };
        return buildErrorResponse(input, 400, 'Bad Request', errObj, startedAt, requestId, executedAt);
      }
    }
  }

  // 4. Generate headers and HMAC-SHA256 signature
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = requestId;
  const outboundHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-API-KEY': creds.apiKey,
    ...(input.headers || {}),
  };

  // Skip signature if explicitly requested or if it is a status-inquiry endpoint per manual
  const shouldSkipSignature =
    input.requiresSignature === false || targetUrl.pathname.includes('/status-inquiry');

  let signed = false;
  if (!shouldSkipSignature) {
    const signingRes = generateRequestSignature({
      method,
      pathWithQuery,
      timestamp,
      nonce,
      rawBody,
      apiSecret: creds.apiSecret,
    });
    outboundHeaders['X-TIMESTAMP'] = timestamp;
    outboundHeaders['X-NONCE'] = nonce;
    outboundHeaders['X-SIGNATURE'] = signingRes.signature;
    signed = true;
  }

  // Sanitized headers for the inspect response
  const sanitizedRequestHeaders: Record<string, string> = { ...outboundHeaders };
  if (sanitizedRequestHeaders['X-API-KEY']) {
    sanitizedRequestHeaders['X-API-KEY'] = `${creds.apiKey.slice(0, 4)}...${creds.apiKey.slice(-4)}`;
  }
  if (sanitizedRequestHeaders['X-SIGNATURE']) {
    sanitizedRequestHeaders['X-SIGNATURE'] = `${outboundHeaders['X-SIGNATURE'].slice(0, 8)}...[SIGNED]`;
  }

  // 5. Execute HTTP Request
  let upstreamResponse: Response;
  let rawResponseText = '';
  let durationMs = 0;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    upstreamResponse = await fetch(targetUrl.toString(), {
      method,
      headers: outboundHeaders,
      body: method === 'GET' || method === 'HEAD' ? undefined : rawBody,
      signal: controller.signal,
    });

    clearTimeout(timer);
    durationMs = Date.now() - startedAt;
    rawResponseText = await upstreamResponse.text();
  } catch (err: unknown) {
    durationMs = Date.now() - startedAt;
    const isTimeout =
      (err instanceof Error && err.name === 'AbortError') ||
      (err instanceof Error && err.message.toLowerCase().includes('timeout'));

    const errType = isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR';
    const errMessage = isTimeout
      ? 'Request outcome is unknown. The request may have reached AssanPay. Check transaction status before retrying.'
      : err instanceof Error
        ? err.message
        : 'Network connection failed.';

    const errObj = {
      type: errType,
      code: isTimeout ? 'GATEWAY_TIMEOUT' : 'NETWORK_FAILURE',
      message: errMessage,
    };

    // Record failure in history
    void logHistorySafe({
      input,
      user: input.user,
      method,
      url: targetUrl.toString(),
      requestHeaders: sanitizedRequestHeaders,
      requestBody: rawBody,
      responseStatus: isTimeout ? 504 : 502,
      responseStatusText: isTimeout ? 'Gateway Timeout' : 'Bad Gateway',
      responseHeaders: {},
      responseBody: JSON.stringify({ error: errMessage }),
      durationMs,
      payloadSize: 0,
      requestId,
      signingStatus: signed ? 'signed' : 'skipped',
      errorType: errType,
      errorMessage: errMessage,
    });

    return {
      ok: false,
      upstream: {
        status: isTimeout ? 504 : 502,
        statusText: isTimeout ? 'Gateway Timeout' : 'Bad Gateway',
        headers: {},
        body: { error: errMessage },
        rawBody: JSON.stringify({ error: errMessage }),
      },
      request: {
        method,
        url: targetUrl.toString(),
        headers: sanitizedRequestHeaders,
        body: parsedJsonBody || rawBody,
      },
      meta: {
        country,
        environment,
        durationMs,
        responseSize: 0,
        requestId,
        signed,
        encrypted: false,
        decrypted: false,
        executedAt,
        executedBy: input.user?.email || 'Anonymous',
      },
      error: errObj,
    };
  }

  // 6. Capture response data
  const responseHeadersRecord: Record<string, string> = {};
  upstreamResponse.headers.forEach((v, k) => {
    responseHeadersRecord[k] = v;
  });

  let parsedResponseBody: unknown = rawResponseText;
  try {
    parsedResponseBody = JSON.parse(rawResponseText);
  } catch {
    // Keep as raw text
  }

  const responseSize = new TextEncoder().encode(rawResponseText).byteLength;
  const isSuccess = upstreamResponse.status >= 200 && upstreamResponse.status < 300;

  // 7. Write to Audit History (failure-safe)
  void logHistorySafe({
    input,
    user: input.user,
    method,
    url: targetUrl.toString(),
    requestHeaders: sanitizedRequestHeaders,
    requestBody: rawBody,
    responseStatus: upstreamResponse.status,
    responseStatusText: upstreamResponse.statusText,
    responseHeaders: responseHeadersRecord,
    responseBody: rawResponseText,
    durationMs,
    payloadSize: responseSize,
    requestId,
    signingStatus: signed ? 'signed' : 'skipped',
    errorType: isSuccess ? null : 'UPSTREAM_HTTP_ERROR',
    errorMessage: isSuccess ? null : `HTTP ${upstreamResponse.status} ${upstreamResponse.statusText}`,
  });

  return {
    ok: isSuccess,
    upstream: {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeadersRecord,
      body: parsedResponseBody,
      rawBody: rawResponseText,
    },
    request: {
      method,
      url: targetUrl.toString(),
      headers: sanitizedRequestHeaders,
      body: parsedJsonBody || rawBody,
    },
    meta: {
      country,
      environment,
      durationMs,
      responseSize,
      requestId,
      signed,
      encrypted: false,
      decrypted: false,
      executedAt,
      executedBy: input.user?.email || 'Anonymous',
    },
    error: isSuccess
      ? undefined
      : {
          type: 'UPSTREAM_HTTP_ERROR',
          code: String(upstreamResponse.status),
          message:
            typeof parsedResponseBody === 'object' &&
            parsedResponseBody !== null &&
            'message' in parsedResponseBody
              ? String((parsedResponseBody as { message: unknown }).message)
              : `Upstream error HTTP ${upstreamResponse.status}`,
        },
  };
}

/**
 * Builds a standardized error response when pre-flight checks fail.
 */
function buildErrorResponse(
  input: ExecuteRequestInput,
  status: number,
  statusText: string,
  error: { type: string; code?: string; message: string },
  startedAt: number,
  requestId: string,
  executedAt: string
): ExecuteResponseContract {
  const durationMs = Date.now() - startedAt;
  return {
    ok: false,
    upstream: {
      status,
      statusText,
      headers: {},
      body: { error: error.message },
      rawBody: JSON.stringify({ error: error.message }),
    },
    request: {
      method: input.method.toUpperCase(),
      url: input.relativePath,
      headers: input.headers || {},
      body: input.body || '',
    },
    meta: {
      country: input.country,
      environment: input.environment || 'sandbox',
      durationMs,
      responseSize: 0,
      requestId,
      signed: false,
      encrypted: false,
      decrypted: false,
      executedAt,
      executedBy: input.user?.email || 'Anonymous',
    },
    error,
  };
}

/**
 * Failure-safe audit logger to PostgreSQL.
 */
async function logHistorySafe(params: {
  input: ExecuteRequestInput;
  user?: AuthenticatedUser | null;
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestBody: string;
  responseStatus: number;
  responseStatusText: string;
  responseHeaders: Record<string, string>;
  responseBody: string;
  durationMs: number;
  payloadSize: number;
  requestId: string;
  signingStatus: string;
  errorType: string | null;
  errorMessage: string | null;
}) {
  try {
    const db = getDb();
    const sanitizedReqHeaders = sanitizeForAudit(params.requestHeaders);
    const sanitizedReqBody = sanitizeForAudit(params.requestBody);

    await db.insert(requestHistory).values({
      userId: params.user?.id || null,
      environment: params.input.environment || 'sandbox',
      endpointId: params.input.endpointId || null,
      requestName: params.input.requestName || 'Custom Request',
      method: params.method,
      url: params.url,
      requestHeaders: sanitizedReqHeaders,
      requestBody: typeof sanitizedReqBody === 'string' ? sanitizedReqBody : JSON.stringify(sanitizedReqBody),
      responseStatus: params.responseStatus,
      responseStatusText: params.responseStatusText || '',
      responseHeaders: params.responseHeaders,
      responseBody: params.responseBody,
      durationMs: params.durationMs,
      payloadSize: params.payloadSize,
      requestId: params.requestId,
      signingStatus: params.signingStatus,
      errorType: params.errorType,
      errorMessage: params.errorMessage,
    });
  } catch (err) {
    // History insertion failure must never fail the request execution response!
    console.warn('[AUDIT] Failed to save request history:', err);
  }
}
