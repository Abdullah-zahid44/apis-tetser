import { z } from 'zod';
import { requireAuth } from '@/lib/auth/session';
import { executeAssanPayRequest } from '@/lib/assanpay/executor';
import {
  resolveVariablesInString,
  resolveVariablesInParams,
  resolveVariablesInHeaders,
  mergeVariables,
} from '@/lib/variables/resolver';

export const runtime = 'nodejs';

const ExecuteSchema = z.object({
  country: z.string().min(2).max(20),
  environment: z.enum(['sandbox']).default('sandbox'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  relativePath: z.string().min(1).max(1000),
  queryParams: z.record(z.string(), z.string()).optional(),
  headers: z.record(z.string(), z.string()).optional(),
  body: z.string().optional(),
  requestName: z.string().max(200).optional(),
  endpointId: z.string().optional(),
  requiresSignature: z.boolean().optional(),
  variables: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  // 1. Verify user session
  const user = await requireAuth();
  if (!user) {
    return Response.json(
      { error: 'Unauthorized. Access restricted to verified @assanpay.com accounts.' },
      { status: 401 }
    );
  }

  // 2. Validate input schema
  let rawJson: unknown;
  try {
    rawJson = await request.json();
  } catch {
    return Response.json({ error: 'Malformed JSON payload in request body.' }, { status: 400 });
  }

  const parsed = ExecuteSchema.safeParse(rawJson);
  if (!parsed.success) {
    return Response.json(
      {
        error: 'Validation failed.',
        details: parsed.error.format(),
      },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // 3. Postman-style variable resolution
  const mergedVars = mergeVariables(data.variables || {});
  const resolvedRelativePath = resolveVariablesInString(data.relativePath, mergedVars);
  const resolvedQueryParams = data.queryParams
    ? resolveVariablesInParams(data.queryParams, mergedVars)
    : undefined;
  const resolvedHeaders = data.headers
    ? resolveVariablesInHeaders(data.headers, mergedVars)
    : undefined;
  const resolvedBody = data.body
    ? resolveVariablesInString(data.body, mergedVars)
    : undefined;

  // 4. Execute via secure backend pipeline
  const result = await executeAssanPayRequest({
    country: data.country,
    environment: data.environment,
    method: data.method,
    relativePath: resolvedRelativePath,
    queryParams: resolvedQueryParams,
    headers: resolvedHeaders,
    body: resolvedBody,
    requestName: data.requestName,
    endpointId: data.endpointId,
    requiresSignature: data.requiresSignature,
    user,
  });

  return Response.json(result, {
    status: 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}
