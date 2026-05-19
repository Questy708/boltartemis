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

      if (!body.firstName || !body.lastName || !body.email) {
        return new Response(JSON.stringify({ error: "First name, last name, and email are required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const accomplishmentsJson = body.accomplishments ? JSON.stringify(body.accomplishments) : null;

      const { data, error } = await supabase.from("applications").insert({
        first_name: body.firstName, last_name: body.lastName, email: body.email,
        phone: body.phone || null, birthdate: body.birthdate || null, gender: body.gender || null,
        pronoun: body.pronoun || null, citizenship: body.citizenship || null, dual_citizenship: body.dualCitizenship || null,
        address: body.address || null, city: body.city || null, state: body.state || null,
        postal_code: body.postalCode || null, country: body.country || null, how_heard: body.howHeard || null,
        application_cycle: body.applicationCycle || null, concentration: body.concentration || null,
        currently_enrolled: body.currentlyEnrolled || null, school_name: body.schoolName || null,
        school_country: body.schoolCountry || null, school_city: body.schoolCity || null,
        enrollment_start: body.enrollmentStart || null, enrollment_end: body.enrollmentEnd || null,
        grading_scale: body.gradingScale || null, gpa: body.gpa || null, max_gpa: body.maxGpa || null,
        sat_math: body.satMath || null, sat_reading: body.satReading || null, act_score: body.actScore || null,
        is_test_optional: body.isTestOptional || false, accomplishments: accomplishmentsJson,
        personal_statement: body.personalStatement || null, mission_statement: body.missionStatement || null,
        applying_for_aid: body.applyingForAid || null, household_income: body.householdIncome || null,
        dependents: body.dependents || null,
      }).select().single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, applicationId: data.id, message: "Application submitted successfully." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (req.method === "GET") {
      const { data, error } = await supabase.from("applications").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      const formatted = data.map((app: Record<string, unknown>) => ({ ...app, accomplishments: app.accomplishments ? JSON.parse(app.accomplishments as string) : null }));
      return new Response(JSON.stringify({ applications: formatted }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Applications function error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
