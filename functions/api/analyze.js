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

    const prompt = `Analyze this image for hazardous lithium-ion, lipo, or alkaline batteries. 
Count the exact number of batteries visible. For EACH battery detected, estimate its specific type (e.g., CR2032 Coin Cell, 18650 Cell, Smartphone LiPo, Drone Pack), its typical capacity (mAh), and its weight (kg).
Assign a realistic 'financialDamage' fire-risk value based on its size if crushed in a recycling facility (e.g., Coin cell = 5000, 18650 cell = 120000, Large LiPo = 500000+).
Calculate the exact 'totalFinancialDamage' (sum of all financialDamage) and 'totalWeightKg' (sum of all weightKg).

Respond STRICTLY with raw JSON (no markdown block, just the object) matching this structure:
{
  "detected": true/false,
  "batteryCount": <actual count>,
  "totalFinancialDamage": <calculated sum>,
  "totalWeightKg": <calculated sum>,
  "batteries": [
    {
      "batteryName": "<estimated type>",
      "capacity": "<estimated mAh>",
      "matchId": "bt-<random numbers>",
      "dangerLevel": "<Low|Medium|High|Critical>",
      "financialDamage": <dynamic number>,
      "weightKg": <dynamic number>
    }
  ]
}
If no battery is present, return: {"detected": false, "batteryCount": 0, "totalFinancialDamage": 0, "totalWeightKg": 0, "batteries": []}`;

    // Using Gemini 3.8 Flash
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${context.env.GEMINI_API_KEY}`;

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
