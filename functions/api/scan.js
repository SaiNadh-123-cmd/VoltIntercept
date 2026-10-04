// This file automatically becomes an API endpoint at: your-site.pages.dev/api/scan
export async function onRequestPost(context) {
  try {
    const { base64Image } = await context.request.json();

    const prompt = `Analyze this image for hazardous lithium-ion, lipo, or alkaline batteries. There may be multiple batteries in the image.
Respond STRICTLY with raw JSON matching this structure (no markdown):
{
  "detected": true,
  "batteryCount": 2,
  "totalFinancialDamage": 240000,
  "totalWeightKg": 0.10,
  "batteries": [
    {
      "batteryName": "18650 Cylindrical Cell",
      "capacity": "3000 mAh",
      "matchId": "18650-cell",
      "dangerLevel": "High",
      "financialDamage": 120000,
      "weightKg": 0.05
    }
  ]
}
If no battery is present, return: {"detected": false, "batteryCount": 0, "totalFinancialDamage": 0, "totalWeightKg": 0, "batteries": []}`;

    // Using the stable 1.5-flash endpoint
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${context.env.GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: "image/jpeg", data: base64Image } }
          ]
        }]
      })
    });

    const data = await geminiResponse.json();

    if (data.error) {
      return new Response(JSON.stringify({ error: data.error.message }), { status: 500 });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return new Response(JSON.stringify({ error: "Gemini returned empty response." }), { status: 500 });
    }

    const rawText = data.candidates[0].content.parts[0].text;

    return new Response(rawText, {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
