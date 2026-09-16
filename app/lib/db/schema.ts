import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// Internal AssanPay users
export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    image: text('image'),
    role: text('role').notNull().default('support'), // 'admin' | 'support'
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('users_email_idx').on(table.email),
  ]
);

// Countries / Markets (PK, BD, and future markets)
export const countries = pgTable(
  'countries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(), // PK, BD
    slug: text('slug').notNull().unique(), // pkr, bdt
    name: text('name').notNull(), // Pakistan, Bangladesh
    currency: text('currency').notNull(), // PKR, BDT
    flagEmoji: text('flag_emoji').notNull(), // 🇵🇰, 🇧🇩
    isActive: boolean('is_active').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('countries_slug_idx').on(table.slug),
    uniqueIndex('countries_code_idx').on(table.code),
  ]
);

// Preconfigured Endpoints per country
export const apiEndpoints = pgTable(
  'api_endpoints',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    countryId: uuid('country_id').notNull().references(() => countries.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    category: text('category').notNull(), // Payin, Payout, Checkout, Status, Balance, Verification, Other
    description: text('description').notNull().default(''),
    method: text('method').notNull(), // GET, POST, PUT, DELETE
    path: text('path').notNull(),
    defaultQuery: jsonb('default_query').$type<Record<string, string>>().default({}),
    defaultHeaders: jsonb('default_headers').$type<Record<string, string>>().default({}),
    defaultBody: text('default_body').notNull().default(''),
    requiresSignature: boolean('requires_signature').notNull().default(true),
    signatureStrategy: text('signature_strategy').notNull().default('assanpay-v1'),
    isMoneyMovement: boolean('is_money_movement').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    displayOrder: integer('display_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('endpoints_country_idx').on(table.countryId),
    index('endpoints_category_idx').on(table.category),
  ]
);

// Saved custom requests per user
export const savedRequests = pgTable(
  'saved_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    countryId: uuid('country_id').references(() => countries.id, { onDelete: 'set null' }),
    environment: text('environment').notNull().default('sandbox'), // sandbox, production
    endpointId: uuid('endpoint_id').references(() => apiEndpoints.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    method: text('method').notNull(),
    relativeUrl: text('relative_url').notNull(),
    queryParams: jsonb('query_params').$type<Record<string, string>>().default({}),
    headers: jsonb('headers').$type<Record<string, string>>().default({}),
    requestBody: text('request_body').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('saved_requests_user_idx').on(table.userId),
    index('saved_requests_country_idx').on(table.countryId),
  ]
);

// Audit execution history
export const requestHistory = pgTable(
  'request_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    countryId: uuid('country_id').references(() => countries.id, { onDelete: 'set null' }),
    environment: text('environment').notNull().default('sandbox'),
    endpointId: uuid('endpoint_id').references(() => apiEndpoints.id, { onDelete: 'set null' }),
    requestName: text('request_name').notNull(),
    method: text('method').notNull(),
    url: text('url').notNull(),
    requestHeaders: jsonb('request_headers').$type<Record<string, string>>().default({}),
    requestBody: text('request_body').notNull().default(''),
    responseStatus: integer('response_status').notNull(),
    responseStatusText: text('response_status_text').notNull().default(''),
    responseHeaders: jsonb('response_headers').$type<Record<string, string>>().default({}),
    responseBody: text('response_body').notNull().default(''),
    durationMs: integer('duration_ms').notNull().default(0),
    payloadSize: integer('payload_size').notNull().default(0),
    requestId: text('request_id').notNull().default(''),
    signingStatus: text('signing_status').notNull().default('signed'), // signed, skipped, failed
    errorType: text('error_type'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('request_history_user_idx').on(table.userId),
    index('request_history_country_idx').on(table.countryId),
    index('request_history_created_idx').on(table.createdAt),
  ]
);

// Received callbacks / webhooks
export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: text('event_id').notNull().unique(), // deduplication constraint
    countryId: uuid('country_id').references(() => countries.id, { onDelete: 'set null' }),
    environment: text('environment').notNull().default('production'),
    signature: text('signature').notNull().default(''),
    signatureVerified: boolean('signature_verified').notNull().default(false),
    verificationMessage: text('verification_message').notNull().default(''),
    eventTimestamp: text('event_timestamp').notNull().default(''),
    requestHeaders: jsonb('request_headers').$type<Record<string, string>>().default({}),
    payload: jsonb('payload').default({}),
    rawBody: text('raw_body').notNull().default(''),
    sourceIp: text('source_ip'),
    duplicate: boolean('duplicate').notNull().default(false),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('webhook_events_event_id_idx').on(table.eventId),
    index('webhook_events_country_idx').on(table.countryId),
    index('webhook_events_created_idx').on(table.createdAt),
  ]
);

// Postman-style Environment Variables
export const environmentVariables = pgTable(
  'environment_variables',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    countryId: uuid('country_id').references(() => countries.id, { onDelete: 'cascade' }), // null = global
    environment: text('environment').notNull().default('all'), // all, sandbox, production
    key: text('key').notNull(),
    encryptedValue: text('encrypted_value').notNull().default(''),
    isSecret: boolean('is_secret').notNull().default(false),
    description: text('description').notNull().default(''),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('env_vars_key_idx').on(table.key),
    index('env_vars_country_idx').on(table.countryId),
  ]
);
