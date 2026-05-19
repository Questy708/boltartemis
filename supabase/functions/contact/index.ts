import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === "POST") {
      const body = await req.json();
      const { name, email, subject, area, message } = body;

      if (!name || !email || !message) {
        return new Response(
          JSON.stringify({ error: "Name, email, and message are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data, error } = await supabase
        .from("contact_messages")
        .insert({ name, email, subject: subject || null, area: area || null, message })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, id: data.id, message: "Thank you for your enquiry. We will get back to you shortly." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "GET") {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return new Response(JSON.stringify({ messages: data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "PATCH") {
      const body = await req.json();
      const { id, read } = body;
      if (!id) {
        return new Response(JSON.stringify({ error: "Message ID is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data, error } = await supabase.from("contact_messages").update({ read: read !== undefined ? read : true }).eq("id", id).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, message: data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Contact function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
