// This file automatically becomes an API endpoint at: your-site.pages.dev/api/scan
export async function onRequestPost(context) {
  try {
    const requestBody = await context.request.json();
    const batteryCount = Number(requestBody.batteryCount ?? 0);

    const prompt = `Our edge vision model just detected ${batteryCount} hazardous batteries on the conveyor belt. Generate a strict JSON industrial hazard report matching this exact structure: { "detected": true, "batteryCount": ${batteryCount}, "totalFinancialDamage": ${batteryCount * 120000}, "totalWeightKg": ${batteryCount * 0.05}, "batteries": [ { "batteryName": "18650 Cylindrical Cell", "capacity": "3000 mAh", "matchId": "18650-cell", "dangerLevel": "High", "financialDamage": 120000, "weightKg": 0.05 } ] }`;

    // Get the hidden key you saved in the Cloudflare dashboard
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${context.env.GEMINI_API_KEY}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt }
          ]
        }]
      })
    });

    const data = await geminiResponse.json();

    // 1. Check if Google returned an API error (e.g. bad key, quota exceeded)
    if (data.error) {
      throw new Error(`Google API Rejected: ${data.error.message}`);
    }

    // 2. Check if the response was blocked by safety settings or is empty
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Google returned an empty response. It may have been blocked by safety filters.");
    }

    // 3. Safely extract the text
    const rawText = data.candidates[0].content.parts[0].text;

    return new Response(rawText, {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
