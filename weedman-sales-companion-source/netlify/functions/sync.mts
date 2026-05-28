import type { Config, Context } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { db } from "../../db/index.js";
import { calls, users } from "../../db/schema.js";
import { eq } from "drizzle-orm";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const identity = await getUser();
  if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await db.select().from(users).where(eq(users.identityId, identity.id));
  let user;
  if (existing.length > 0) {
    user = existing[0];
  } else {
    const [newUser] = await db.insert(users).values({
      identityId: identity.id,
      email: identity.email || "",
      name: (identity as any).user_metadata?.full_name || identity.email || "",
    }).returning();
    user = newUser;
  }

  const body = await req.json();
  const importedCalls = body.calls || [];
  let imported = 0;

  for (const c of importedCalls) {
    await db.insert(calls).values({
      userId: user.id,
      firstName: c.firstName || (c.name || "").split(" ")[0] || "",
      lastName: c.lastName || (c.name || "").split(" ").slice(1).join(" ") || "",
      outcome: c.outcome || "unknown",
      stage: c.stage || "unknown",
      objection: c.obj || c.objection || "none",
      notes: c.notes || "",
      closed: c.closed || c.outcome === "closed",
      calledAt: c.time ? new Date(c.time) : new Date(),
    });
    imported++;
  }

  return Response.json({ ok: true, imported });
};

export const config: Config = {
  path: "/api/sync",
};
