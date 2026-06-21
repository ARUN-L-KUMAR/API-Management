import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  primaryKey,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// --- Users & Organizations ---
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(), // 'owner', 'admin', 'member'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Structural Metadata ---
export const folders = pgTable('folders', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tags = pgTable('tags', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).default('#6366f1').notNull(), // Hex color
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- API Keys Registry ---
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  providerCode: varchar('provider_code', { length: 50 }).notNull(), // 'openai', 'gemini', etc.
  keyName: varchar('key_name', { length: 255 }).notNull(),
  encryptedApiKey: text('encrypted_api_key').notNull(),
  description: text('description'),
  folderId: uuid('folder_id').references(() => folders.id, { onDelete: 'set null' }),
  isMonitoringEnabled: boolean('is_monitoring_enabled').default(false).notNull(),
  monitoringFrequency: integer('monitoring_frequency').default(60).notNull(), // minutes
  status: varchar('status', { length: 50 }).default('Unknown').notNull(), // 'Working', 'Invalid', etc.
  lastValidatedAt: timestamp('last_validated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// --- Many-to-Many Bridge Table (API Keys <-> Tags) ---
export const apiKeyTags = pgTable(
  'api_key_tags',
  {
    apiKeyId: uuid('api_key_id')
      .references(() => apiKeys.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.apiKeyId, table.tagId] }),
  })
);

// --- Models Dictionary & Mapping ---
export const models = pgTable('models', {
  id: uuid('id').defaultRandom().primaryKey(),
  providerCode: varchar('provider_code', { length: 50 }).notNull(),
  modelName: varchar('model_name', { length: 255 }).notNull(), // Raw name like 'gpt-4o'
  displayName: varchar('display_name', { length: 255 }).notNull(),
  description: text('description'),
  capabilities: jsonb('capabilities').$type<{ text: boolean; vision: boolean; audio: boolean }>().notNull(),
  status: varchar('status', { length: 50 }).default('Active').notNull(), // 'Active', 'Deprecated', 'Unknown'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  providerModelIdx: uniqueIndex('provider_model_idx').on(table.providerCode, table.modelName),
}));

export const keyModels = pgTable('key_models', {
  id: uuid('id').defaultRandom().primaryKey(),
  apiKeyId: uuid('api_key_id')
    .references(() => apiKeys.id, { onDelete: 'cascade' })
    .notNull(),
  modelId: uuid('model_id')
    .references(() => models.id, { onDelete: 'cascade' })
    .notNull(),
  verificationStatus: varchar('verification_status', { length: 50 }).default('Unknown').notNull(), // 'Working', 'Failed', etc.
  lastVerifiedAt: timestamp('last_verified_at'),
  errorMessage: text('error_message'),
  latencyMs: integer('latency_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  keyModelUniqueIdx: uniqueIndex('key_model_unique_idx').on(table.apiKeyId, table.modelId),
}));

// --- Audits & System Logging ---
export const monitorLogs = pgTable('monitor_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  apiKeyId: uuid('api_key_id')
    .references(() => apiKeys.id, { onDelete: 'cascade' })
    .notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'Validation', 'Verification', 'CronJob'
  status: varchar('status', { length: 50 }).notNull(), // 'Success', 'Failed'
  message: text('message').notNull(),
  errorDetails: jsonb('error_details'),
  durationMs: integer('duration_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const monitoringSettings = pgTable('monitoring_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  notifyOnFailure: boolean('notify_on_failure').default(true).notNull(),
  alertEmail: varchar('alert_email', { length: 255 }),
  webhookUrl: text('webhook_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const playgroundSessions = pgTable('playground_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .references(() => organizations.id, { onDelete: 'cascade' })
    .notNull(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  apiKeyId: uuid('api_key_id')
    .references(() => apiKeys.id, { onDelete: 'cascade' })
    .notNull(),
  modelId: uuid('model_id')
    .references(() => models.id, { onDelete: 'cascade' })
    .notNull(),
  prompt: text('prompt').notNull(),
  response: text('response'),
  latencyMs: integer('latency_ms'),
  tokensUsed: integer('tokens_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
