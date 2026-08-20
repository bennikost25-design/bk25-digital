import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .default(false)
      .notNull(),
    image: text("image"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    role: text("role").default("customer").notNull(),
    banned: integer("banned", { mode: "boolean" }).default(false),
    banReason: text("ban_reason"),
    banExpires: integer("ban_expires", { mode: "timestamp_ms" }),
  },
  (table) => [check("user_role_check", sql`${table.role} IN ('admin', 'customer')`)],
);

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    issuer: text("issuer").notNull().default("local:credential"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const customerProfile = sqliteTable("customer_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  createdByAdminId: text("created_by_admin_id")
    .notNull()
    .references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const customerProject = sqliteTable(
  "customer_project",
  {
    id: text("id").primaryKey(),
    customerProfileId: text("customer_profile_id")
      .notNull()
      .references(() => customerProfile.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    packageId: text("package_id"),
    status: text("status").default("active").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("customer_project_profile_idx").on(table.customerProfileId),
    check(
      "customer_project_package_check",
      sql`${table.packageId} IN ('basis', 'komplett') OR ${table.packageId} IS NULL`,
    ),
    check("customer_project_status_check", sql`${table.status} IN ('active', 'archived')`),
  ],
);

export const projectFormAccess = sqliteTable(
  "project_form_access",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => customerProject.id, { onDelete: "cascade" }),
    formKey: text("form_key").notNull(),
    grantedByAdminId: text("granted_by_admin_id")
      .notNull()
      .references(() => user.id),
    grantedAt: integer("granted_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("project_form_access_unique").on(table.projectId, table.formKey),
    index("project_form_access_form_idx").on(table.formKey),
  ],
);

export const invitation = sqliteTable(
  "invitation",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    createdByAdminId: text("created_by_admin_id")
      .notNull()
      .references(() => user.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    consumeId: text("consume_id"),
  },
  (table) => [
    index("invitation_user_idx").on(table.userId),
    uniqueIndex("invitation_consume_id_idx").on(table.consumeId),
  ],
);

export const contactRequest = sqliteTable(
  "contact_request",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    organization: text("organization").notNull(),
    packageInterest: text("package_interest"),
    message: text("message").notNull(),
    consentAt: integer("consent_at", { mode: "timestamp_ms" }).notNull(),
    privacyNoticeVersion: text("privacy_notice_version").notNull(),
    status: text("status").default("new").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("contact_request_status_idx").on(table.status, table.createdAt),
    check(
      "contact_request_status_check",
      sql`${table.status} IN ('new', 'in_progress', 'done')`,
    ),
  ],
);

export const formDraft = sqliteTable(
  "form_draft",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id")
      .notNull()
      .references(() => customerProject.id, { onDelete: "cascade" }),
    formKey: text("form_key").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    payloadJson: text("payload_json").notNull(),
    stepIndex: integer("step_index").default(0).notNull(),
    revision: integer("revision").default(1).notNull(),
    status: text("status").default("draft").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("form_draft_unique").on(table.userId, table.projectId, table.formKey),
    index("form_draft_project_idx").on(table.projectId, table.formKey),
    check("form_draft_status_check", sql`${table.status} IN ('draft', 'submitted')`),
  ],
);

export const formSubmission = sqliteTable(
  "form_submission",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id),
    projectId: text("project_id")
      .notNull()
      .references(() => customerProject.id),
    formKey: text("form_key").notNull(),
    schemaVersion: integer("schema_version").notNull(),
    payloadJson: text("payload_json").notNull(),
    version: integer("version").notNull(),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    referenceNumber: text("reference_number").notNull().unique(),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("form_submission_lookup_idx").on(
      table.projectId,
      table.formKey,
      table.version,
    ),
    index("form_submission_user_idx").on(table.userId, table.submittedAt),
    uniqueIndex("form_submission_version_unique").on(
      table.userId,
      table.projectId,
      table.formKey,
      table.version,
    ),
    uniqueIndex("form_submission_idempotency_scope_idx").on(
      table.userId,
      table.projectId,
      table.formKey,
      table.idempotencyKey,
    ),
  ],
);

export const auditEvent = sqliteTable(
  "audit_event",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    actorUserId: text("actor_user_id").references(() => user.id),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    result: text("result").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("audit_event_created_idx").on(table.createdAt),
    index("audit_event_resource_idx").on(table.resourceType, table.resourceId),
  ],
);

export const emailOutbox = sqliteTable(
  "email_outbox",
  {
    id: text("id").primaryKey(),
    type: text("type").notNull(),
    toEmail: text("to_email").notNull(),
    toName: text("to_name"),
    templateKey: text("template_key").notNull(),
    payloadJson: text("payload_json").notNull(),
    status: text("status").default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    lastError: text("last_error"),
    providerMessageId: text("provider_message_id"),
    relatedResourceType: text("related_resource_type"),
    relatedResourceId: text("related_resource_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    sentAt: integer("sent_at", { mode: "timestamp_ms" }),
    nextAttemptAt: integer("next_attempt_at", { mode: "timestamp_ms" }),
    cancelledAt: integer("cancelled_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("email_outbox_status_idx").on(table.status, table.nextAttemptAt),
    check(
      "email_outbox_status_check",
      sql`${table.status} IN ('pending', 'processing', 'sent', 'failed')`,
    ),
  ],
);

export const rateLimitBucket = sqliteTable(
  "rate_limit_bucket",
  {
    id: text("id").primaryKey(),
    count: integer("count").default(0).notNull(),
    expiresAt: integer("expires_at").notNull(),
  },
  (table) => [index("rate_limit_bucket_expires_idx").on(table.expiresAt)],
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  customerProfile: one(customerProfile),
}));

export const customerProfileRelations = relations(customerProfile, ({ one, many }) => ({
  user: one(user, { fields: [customerProfile.userId], references: [user.id] }),
  projects: many(customerProject),
}));

export const customerProjectRelations = relations(customerProject, ({ one, many }) => ({
  profile: one(customerProfile, {
    fields: [customerProject.customerProfileId],
    references: [customerProfile.id],
  }),
  access: many(projectFormAccess),
}));

export const projectFormAccessRelations = relations(projectFormAccess, ({ one }) => ({
  project: one(customerProject, {
    fields: [projectFormAccess.projectId],
    references: [customerProject.id],
  }),
}));

export const schema = {
  user,
  session,
  account,
  verification,
  customerProfile,
  customerProject,
  projectFormAccess,
  invitation,
  contactRequest,
  formDraft,
  formSubmission,
  auditEvent,
  emailOutbox,
  rateLimitBucket,
  userRelations,
  customerProfileRelations,
  customerProjectRelations,
  projectFormAccessRelations,
};

export { sql };
