import type { Config, Context } from "@netlify/functions";
import { login, signup, logout, getUser } from "@netlify/identity";

export default async (req: Request, context: Context) => {
  if (req.method === "GET") {
    const user = await getUser();
    if (!user) return Response.json({ user: null });
    return Response.json({ user: { id: user.id, email: user.email, name: (user as any).user_metadata?.full_name || "" } });
  }

  if (req.method === "POST") {
    const body = await req.json();
    const action = body.action;

    if (action === "login") {
      try {
        const user = await login(body.email, body.password);
        return Response.json({ user: { id: user.id, email: user.email } });
      } catch (e: any) {
        return Response.json({ error: e.message || "Login failed", status: e.status }, { status: e.status || 400 });
      }
    }

    if (action === "signup") {
      try {
        const user = await signup(body.email, body.password, { full_name: body.name || "" });
        return Response.json({
          user: { id: user.id, email: user.email },
          emailVerified: user.emailVerified
        });
      } catch (e: any) {
        return Response.json({ error: e.message || "Signup failed", status: e.status }, { status: e.status || 400 });
      }
    }

    if (action === "logout") {
      try {
        await logout();
        return Response.json({ ok: true });
      } catch (e: any) {
        return Response.json({ ok: true });
      }
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/auth",
};
