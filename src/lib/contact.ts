import { contactRequest, emailOutbox } from "@/db/schema";
import { writeAudit } from "@/lib/audit";
import type { AppDb } from "@/lib/cloudflare";
import type { AppEnv } from "@/lib/env";
import { createId, nowMs } from "@/lib/ids";
import { buildOutboxRow, enqueueOutbox } from "@/lib/mail/outbox";
import type { ContactInput } from "@/lib/contact-schema";

export async function storeContactRequest(options: {
  db: AppDb;
  env: AppEnv;
  queue?: Queue;
  input: ContactInput;
  privacyNoticeVersion: string;
}) {
  const id = createId();
  const now = new Date(nowMs());
  const visitorOutbox = buildOutboxRow({
    type: "contact-confirm",
    toEmail: options.input.email,
    toName: options.input.name,
    templateKey: "contact-confirm",
    payload: { name: options.input.name },
    relatedResourceType: "contact_request",
    relatedResourceId: id,
  });
  const adminOutbox = buildOutboxRow({
    type: "contact-admin",
    toEmail: options.env.ADMIN_NOTIFICATION_EMAIL,
    toName: "BK25 Digital",
    templateKey: "contact-admin",
    payload: {},
    relatedResourceType: "contact_request",
    relatedResourceId: id,
  });

  const contactValues = {
    id,
    name: options.input.name,
    email: options.input.email,
    organization: options.input.organization,
    packageInterest: options.input.package || null,
    message: options.input.message,
    consentAt: now,
    privacyNoticeVersion: options.privacyNoticeVersion,
    status: "new" as const,
    createdAt: now,
    updatedAt: now,
  };

  if (typeof options.db.batch === "function") {
    await options.db.batch([
      options.db.insert(contactRequest).values(contactValues),
      options.db.insert(emailOutbox).values(visitorOutbox),
      options.db.insert(emailOutbox).values(adminOutbox),
    ]);
  } else {
    await options.db.insert(contactRequest).values(contactValues);
    await options.db.insert(emailOutbox).values(visitorOutbox);
    await options.db.insert(emailOutbox).values(adminOutbox);
  }

  await writeAudit(options.db, {
    type: "contact.created",
    resourceType: "contact_request",
    resourceId: id,
    result: "ok",
  });

  await enqueueOutbox(options.db, options.queue, visitorOutbox.id);
  await enqueueOutbox(options.db, options.queue, adminOutbox.id);

  return { id };
}
