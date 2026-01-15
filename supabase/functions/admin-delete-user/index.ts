import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

type DeleteUserPayload = {
  userId: string;
  expectedRole?: "member" | "staff" | "trainer";
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
  const anonKey =
    Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json(500, { error: "Server misconfigured" });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json(401, { error: "Missing Authorization header" });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) return json(401, { error: "Unauthorized" });

  const { data: isAdmin, error: roleErr } = await userClient.rpc("has_role", {
    _role: "admin",
    _user_id: userData.user.id,
  });

  if (roleErr) return json(403, { error: roleErr.message });
  if (!isAdmin) return json(403, { error: "Admin access required" });

  let payload: DeleteUserPayload;
  try {
    payload = (await req.json()) as DeleteUserPayload;
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  if (!payload?.userId) return json(400, { error: "Missing userId" });

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Optional safety check to keep staff/students separated
  if (payload.expectedRole) {
    const { data: roles, error: rolesErr } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", payload.userId)
      .eq("role", payload.expectedRole)
      .limit(1);

    if (rolesErr) return json(400, { error: rolesErr.message });
    if (!roles || roles.length === 0) {
      return json(400, {
        error: `User is not a ${payload.expectedRole}; deletion blocked`,
      });
    }
  }

  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(payload.userId);
  if (deleteErr) return json(400, { error: deleteErr.message });

  return json(200, { success: true });
});
