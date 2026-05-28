import type { Config, Context } from "@netlify/functions";
import { getUser } from "@netlify/identity";
import { db } from "../../db/index.js";
import { serviceAvailability } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";

export default async (req: Request, context: Context) => {
  if (req.method === "GET") {
    const services = await db.select().from(serviceAvailability);
    return Response.json(services);
  }

  if (req.method === "POST") {
    const identity = await getUser();
    if (!identity) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const existing = await db.select().from(serviceAvailability)
      .where(and(
        eq(serviceAvailability.serviceId, body.serviceId),
        eq(serviceAvailability.season, body.season || "2026")
      ));

    if (existing.length > 0) {
      await db.update(serviceAvailability)
        .set({
          available: body.available !== undefined ? body.available : existing[0].available,
          maxSlots: body.maxSlots !== undefined ? body.maxSlots : existing[0].maxSlots,
          usedSlots: body.usedSlots !== undefined ? body.usedSlots : existing[0].usedSlots,
          updatedAt: new Date(),
        })
        .where(eq(serviceAvailability.id, existing[0].id));
      return Response.json({ ok: true, updated: true });
    }

    const [record] = await db.insert(serviceAvailability).values({
      serviceId: body.serviceId,
      serviceName: body.serviceName || body.serviceId,
      season: body.season || "2026",
      available: body.available !== undefined ? body.available : true,
      maxSlots: body.maxSlots || null,
      usedSlots: body.usedSlots || 0,
    }).returning();

    return Response.json(record, { status: 201 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/services",
};
