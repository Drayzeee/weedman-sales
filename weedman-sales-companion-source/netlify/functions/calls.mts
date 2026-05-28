import type { Config, Context } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { db } from "../../db/index.js";
import { calls, users } from "../../db/schema.js";
import { eq, desc, and } from "drizzle-orm";

async function getOrCreateUser() {
  const identity = await getUser();
  if (!identity) return null;

  const existing = await db.select().from(users).where(eq(users.identityId, identity.id));
  if (existing.length > 0) return existing[0];

  const [newUser] = await db.insert(users).values({
    identityId: identity.id,
    email: identity.email || "",
    name: (identity as any).user_metadata?.full_name || identity.email || "",
  }).returning();
  return newUser;
}

export default async (req: Request, context: Context) => {
  const user = await getOrCreateUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (req.method === "GET") {
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "500");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    const userCalls = await db.select().from(calls)
      .where(eq(calls.userId, user.id))
      .orderBy(desc(calls.calledAt))
      .limit(limit)
      .offset(offset);

    const totalCalls = userCalls.length + offset;
    const totalCloses = userCalls.filter(c => c.closed).length;

    return Response.json({
      calls: userCalls,
      totalCalls,
      totalCloses,
      user: { id: user.id, email: user.email, name: user.name }
    });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const [call] = await db.insert(calls).values({
      userId: user.id,
      firstName: body.firstName || "",
      lastName: body.lastName || "",
      outcome: body.outcome || "unknown",
      stage: body.stage || "unknown",
      objection: body.objection || "none",
      notes: body.notes || "",
      closed: body.outcome === "closed",
      calledAt: body.calledAt ? new Date(body.calledAt) : new Date(),
    }).returning();

    return Response.json(call, { status: 201 });
  }

  if (req.method === "DELETE") {
    const url = new URL(req.url);
    const callId = url.searchParams.get("id");
    const range = url.searchParams.get("range");

    if (callId) {
      await db.delete(calls).where(and(eq(calls.id, parseInt(callId)), eq(calls.userId, user.id)));
      return Response.json({ ok: true });
    }

    if (range === "hour") {
      const cutoff = new Date(Date.now() - 3600000);
      const toDelete = await db.select().from(calls)
        .where(and(eq(calls.userId, user.id)));
      const filtered = toDelete.filter(c => c.calledAt && c.calledAt >= cutoff);
      for (const c of filtered) {
        await db.delete(calls).where(eq(calls.id, c.id));
      }
      return Response.json({ ok: true, deleted: filtered.length });
    }

    if (range === "day") {
      const cutoff = new Date(Date.now() - 86400000);
      const toDelete = await db.select().from(calls)
        .where(eq(calls.userId, user.id));
      const filtered = toDelete.filter(c => c.calledAt && c.calledAt >= cutoff);
      for (const c of filtered) {
        await db.delete(calls).where(eq(calls.id, c.id));
      }
      return Response.json({ ok: true, deleted: filtered.length });
    }

    if (range === "all") {
      await db.delete(calls).where(eq(calls.userId, user.id));
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Specify id or range" }, { status: 400 });
  }

  if (req.method === "PATCH") {
    const body = await req.json();
    if (!body.id) return Response.json({ error: "Missing id" }, { status: 400 });
    const updates: Record<string, any> = {};
    if (body.outcome !== undefined) updates.outcome = body.outcome;
    if (body.closed !== undefined) updates.closed = body.closed;
    if (body.notes !== undefined) updates.notes = body.notes;

    await db.update(calls).set(updates).where(and(eq(calls.id, body.id), eq(calls.userId, user.id)));
    return Response.json({ ok: true });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/calls",
};
