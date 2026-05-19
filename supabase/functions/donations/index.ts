import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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
      const { donorEmail, donorName, donorAnonymous, amount, currency, paymentMethod, transactionRef, stripeSessionId, perkId, isRecurring, recurringFreq, message } = body;

      if (!donorEmail || !amount || !transactionRef) {
        return new Response(JSON.stringify({ error: "Donor email, amount, and transaction reference are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data, error } = await supabase.from("donations").insert({
        donor_email: donorEmail, donor_name: donorName || null, donor_anonymous: donorAnonymous || false,
        amount, currency: currency || "USD", payment_method: paymentMethod || "card",
        payment_status: "pending", transaction_ref: transactionRef,
        stripe_session_id: stripeSessionId || null, perk_id: perkId || null,
        is_recurring: isRecurring || false, recurring_freq: recurringFreq || null,
        message: message || null,
      }).select().single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, id: data.id, message: "Donation recorded successfully." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "GET") {
      const { data, error } = await supabase.from("donations").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return new Response(JSON.stringify({ donations: data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Donations function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
