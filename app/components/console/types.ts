export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type Environment = 'sandbox';
export type View = 'workbench' | 'history' | 'callbacks' | 'variables' | 'status';

export type Country = {
  id: string;
  code: string;
  slug: string;
  name: string;
  currency: string;
  flagEmoji: string;
  isActive: boolean;
  displayOrder: number;
};

export type Endpoint = {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  method: Method;
  path: string;
  defaultQuery?: Record<string, string>;
  defaultHeaders?: Record<string, string>;
  defaultBody?: string;
  requiresSignature: boolean;
  signatureStrategy?: string;
  isMoneyMovement?: boolean;
};

export type ParamRow = {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
  description?: string;
};

export type HeaderRow = {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
  description?: string;
  isSystem?: boolean;
};

export type SavedRequestItem = {
  id: string;
  name: string;
  environment: string;
  endpointId?: string | null;
  method: Method;
  relativeUrl: string;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  requestBody: string;
  createdAt: string;
  updatedAt: string;
};

export type HistoryItem = {
  id: string;
  requestName: string;
  environment: string;
  endpointId?: string | null;
  method: Method;
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
  errorType?: string | null;
  errorMessage?: string | null;
  createdAt: string;
};

export type WebhookEventItem = {
  id: string;
  eventId: string;
  countryId?: string | null;
  environment: string;
  signature: string;
  signatureVerified: boolean;
  verificationMessage: string;
  eventTimestamp: string;
  requestHeaders: Record<string, string>;
  payload: Record<string, unknown>;
  rawBody: string;
  sourceIp?: string | null;
  duplicate: boolean;
  receivedAt: string;
};

export type VariableItem = {
  id: string;
  countryId?: string | null;
  environment: string;
  key: string;
  value: string;
  isSecret: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type ExecutionResult = {
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
    encrypted: boolean;
    decrypted: boolean;
    executedAt: string;
    executedBy?: string;
  };
  error?: {
    type: string;
    code?: string;
    message: string;
  };
};

export type SafeConfig = Record<
  string,
  Record<
    string,
    {
      configured: boolean;
      baseUrlConfigured: boolean;
      apiKeyConfigured: boolean;
      apiSecretConfigured: boolean;
      hostname?: string;
      encryptionMode: string;
    }
  >
>;
