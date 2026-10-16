// Public: published testimonials for the website.
import { admin } from "./db.ts";
import { corsHeaders } from "./http.ts";

export async function handleTestimonials(req: Request): Promise<Response> {
  const { data } = await admin.from("testimonials")
    .select("id,quote,author_name,author_role,organization")
    .eq("published", true).order("sort_order").order("created_at");
  return new Response(JSON.stringify({ ok: true, testimonials: data ?? [] }), {
    headers: { ...corsHeaders(req), "Content-Type": "application/json", "Cache-Control": "public, max-age=300" },
  });
}
