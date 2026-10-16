import { createClient } from "./deps.ts";

// Service-role client: bypasses RLS. Only used server-side inside edge functions.
export const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

export async function getSetting(key: string): Promise<string | null> {
  const { data } = await admin.from("app_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}

export async function setSetting(key: string, value: string) {
  await admin.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() });
}

export type BusinessProfile = {
  business_name: string;
  mailing_address: string | null;
  calendly_url: string;
  notify_email: string;
  substack_url: string;
  newsletter_auto_send: boolean;
  newsletter_start_at: string;
};

export async function getProfile(): Promise<BusinessProfile> {
  const { data } = await admin.from("business_profile").select("*").eq("id", true).single();
  return data as BusinessProfile;
}

export async function logActivity(contactId: string, type: string, body: string) {
  await admin.from("activities").insert({ contact_id: contactId, type, body });
}

/** Resolves the caller's JWT and confirms they're on the admin list. */
export async function requireAdmin(req: Request): Promise<string | null> {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user?.email) return null;
  const { data: row } = await admin.from("admins").select("email").eq("email", data.user.email).maybeSingle();
  return row ? data.user.email : null;
}
