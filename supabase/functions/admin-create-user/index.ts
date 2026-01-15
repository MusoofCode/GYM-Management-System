import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

type CreateUserPayload = {
  userType: "member" | "staff" | "trainer";
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  dateOfBirth?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  photoBase64?: string | null; // base64 without data: prefix
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
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY");
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

  let payload: CreateUserPayload;
  try {
    payload = (await req.json()) as CreateUserPayload;
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  if (!payload?.email || !payload?.password || !payload?.fullName || !payload?.userType) {
    return json(400, { error: "Missing required fields" });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // 1) Create auth user without changing the caller session
  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true,
    user_metadata: { full_name: payload.fullName },
  });

  if (createErr || !created.user) {
    return json(400, { error: createErr?.message || "Failed to create user" });
  }

  const userId = created.user.id;

  // 2) Upload photo (optional)
  let avatarUrl: string | null = null;
  if (payload.photoBase64) {
    try {
      const bytes = Uint8Array.from(atob(payload.photoBase64), (c) => c.charCodeAt(0));
      const path = `${userId}-${Date.now()}.jpg`;

      const { error: uploadErr } = await adminClient.storage
        .from("student-photos")
        .upload(path, bytes, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (!uploadErr) {
        const { data: pub } = adminClient.storage.from("student-photos").getPublicUrl(path);
        avatarUrl = pub.publicUrl;
      }
    } catch {
      // ignore photo errors
    }
  }

  // 3) Create profile
  const { error: profileErr } = await adminClient.from("profiles").insert({
    user_id: userId,
    email: payload.email,
    full_name: payload.fullName,
    phone: payload.phone ?? null,
    date_of_birth: payload.dateOfBirth ?? null,
    address: payload.address ?? null,
    emergency_contact: payload.emergencyContact ?? null,
    emergency_phone: payload.emergencyPhone ?? null,
    avatar_url: avatarUrl,
    status: "active",
  });

  if (profileErr) {
    // rollback auth user if profile creation fails
    await adminClient.auth.admin.deleteUser(userId);
    return json(400, { error: profileErr.message });
  }

  // 4) Assign role
  const role: "member" | "staff" | "trainer" = payload.userType;
  const { error: roleInsertErr } = await adminClient.from("user_roles").insert({
    user_id: userId,
    role,
  });

  if (roleInsertErr) {
    await adminClient.auth.admin.deleteUser(userId);
    return json(400, { error: roleInsertErr.message });
  }

  return json(200, { user_id: userId, avatar_url: avatarUrl, role });
});
