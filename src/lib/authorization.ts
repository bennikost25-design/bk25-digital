import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import {
  customerProfile,
  customerProject,
  projectFormAccess,
} from "@/db/schema";
import { createAuth, type SessionUser } from "@/lib/auth";
import { getRequestContext, type RequestContext } from "@/lib/cloudflare";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AuthError";
  }
}

export type AuthedContext = RequestContext & {
  user: SessionUser;
  sessionId: string;
};

async function getSessionUser(ctx: RequestContext): Promise<{
  user: SessionUser;
  sessionId: string;
} | null> {
  const auth = createAuth(ctx.db, ctx.env);
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user) return null;
  const role = session.user.role === "admin" ? "admin" : "customer";
  if (session.user.banned) {
    throw new AuthError("Dieses Konto ist gesperrt.", 403);
  }
  return {
    sessionId: session.session.id,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role,
      banned: session.user.banned,
    },
  };
}

export async function requireSession(): Promise<AuthedContext> {
  const ctx = await getRequestContext();
  const session = await getSessionUser(ctx);
  if (!session) {
    throw new AuthError("Bitte anmelden.", 401);
  }
  return { ...ctx, ...session };
}

export async function requireAdmin(): Promise<AuthedContext> {
  const ctx = await requireSession();
  assertAdminRole(ctx);
  return ctx;
}

export function assertAdminRole(ctx: AuthedContext) {
  if (ctx.user.role !== "admin") {
    throw new AuthError("Keine Berechtigung.", 403);
  }
}

export function assertCustomerRole(ctx: AuthedContext) {
  if (ctx.user.role !== "customer") {
    throw new AuthError("Keine Berechtigung.", 403);
  }
}

export async function requireCustomer(): Promise<AuthedContext> {
  const ctx = await requireSession();
  assertCustomerRole(ctx);
  return ctx;
}

export async function requireCustomerProjectAccess(
  ctx: AuthedContext,
  projectId: string,
) {
  if (ctx.user.role === "admin") {
    const project = await ctx.db.query.customerProject.findFirst({
      where: eq(customerProject.id, projectId),
    });
    if (!project) throw new AuthError("Auftrag nicht gefunden.", 404);
    return project;
  }

  const profile = await ctx.db.query.customerProfile.findFirst({
    where: eq(customerProfile.userId, ctx.user.id),
  });
  if (!profile) throw new AuthError("Keine Berechtigung.", 403);

  const project = await ctx.db.query.customerProject.findFirst({
    where: and(
      eq(customerProject.id, projectId),
      eq(customerProject.customerProfileId, profile.id),
    ),
  });
  if (!project) throw new AuthError("Keine Berechtigung.", 403);
  return project;
}

export async function requireFormAccess(
  ctx: AuthedContext,
  projectId: string,
  formKey: string,
) {
  const project = await requireCustomerProjectAccess(ctx, projectId);
  const access = await ctx.db.query.projectFormAccess.findFirst({
    where: and(
      eq(projectFormAccess.projectId, projectId),
      eq(projectFormAccess.formKey, formKey),
    ),
  });
  if (!access) throw new AuthError("Keine Berechtigung für dieses Formular.", 403);
  return { project, access };
}

export async function getOptionalSession(): Promise<AuthedContext | null> {
  const ctx = await getRequestContext();
  try {
    const session = await getSessionUser(ctx);
    if (!session) return null;
    return { ...ctx, ...session };
  } catch (error) {
    if (error instanceof AuthError) return null;
    throw error;
  }
}

export function jsonError(error: unknown): Response {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  return Response.json(
    { error: "Die Anfrage konnte nicht verarbeitet werden." },
    { status: 500 },
  );
}
