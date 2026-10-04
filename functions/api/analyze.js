const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Using 'onRequest' instead of 'onRequestPost' catches ALL methods.
// This makes a 405 Method Not Allowed error impossible.
export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base64Image } = await context.request.json();

    const prompt = `Analyze this image for hazardous lithium-ion, lipo, or alkaline batteries. There may be multiple batteries in the image.
Respond STRICTLY with raw JSON matching this structure (no markdown):
{"detected": true, "batteryCount": 1, "totalFinancialDamage": 120000, "totalWeightKg": 0.05, "batteries": [{"batteryName": "18650 Cylindrical Cell", "capacity": "3000 mAh", "matchId": "18650-cell", "dangerLevel": "High", "financialDamage": 120000, "weightKg": 0.05}]}
If no battery is present, return: {"detected": false, "batteryCount": 0, "totalFinancialDamage": 0, "totalWeightKg": 0, "batteries": []}`;

    // Using Gemini 3.8 Flash
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${context.env.GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: base64Image } }] }]
      })
    });

    const data = await geminiResponse.json();

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), { status: 500, headers: corsHeaders });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return new Response(JSON.stringify({ error: "Empty response" }), { status: 500, headers: corsHeaders });
    }

    const rawText = data.candidates[0].content.parts[0].text;

    return new Response(rawText, { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
}
