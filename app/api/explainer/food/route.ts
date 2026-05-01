import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getFuelPrices } from "@/lib/fuel-data";
import { calculateFoodImpact } from "@/lib/food-data";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { error: "Profile ID is required" },
        { status: 400 }
      );
    }

    // 1. Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // 2. Get fuel prices (food transport costs depend on diesel)
    const fuelData = await getFuelPrices();

    // 3. Calculate food impact
    const foodImpact = calculateFoodImpact(
      fuelData.ukDieselPence,
      fuelData.dieselChange30d
    );

    // 4. Generate personalised explainer with Claude
    const prompt = `You are Parrot, a news impact analyst. Generate a personalised explainer about how the current oil crisis affects this user's weekly food shop through transport, fertiliser, and packaging cost increases.

USER PROFILE:
- Location: ${profile.postcode}
- Annual mileage: ${profile.annual_mileage.toLocaleString()} miles/year
- Fuel type: ${profile.car_fuel_type}

CURRENT DATA:
- UK diesel price: ${fuelData.ukDieselPence}p/litre (up ${fuelData.dieselChange30d}p in 30 days)
- Brent crude: $${fuelData.brentCrudeUSD}/barrel
- Average UK weekly grocery spend: £${foodImpact.weeklyShopBaseline}
- Transport/logistics share of food cost: ${foodImpact.transportCostShare}%
- Estimated weekly grocery increase from diesel rise: £${foodImpact.estimatedWeeklyIncrease}
- Estimated annual grocery increase: £${foodImpact.estimatedAnnualIncrease}
- Current UK food inflation: ${foodImpact.foodInflationPercent}%

Respond with ONLY valid JSON in this exact structure (no markdown, no code fences):
{
  "headline": "A punchy headline about how the oil crisis is making their food shop more expensive",
  "summary": "2-3 sentence summary explaining the connection between oil prices and grocery costs, using their actual numbers",
  "chain": [
    {
      "title": "Short title for this link in the chain",
      "detail": "One sentence explaining this step",
      "value": "The key number or fact"
    }
  ],
  "bottomLine": "One sentence: the single most important takeaway with their £ figure",
  "context": "One sentence putting this in perspective (e.g., equivalent to X items per week, or X% of a typical shop)"
}

The chain should have exactly 5 nodes showing the cause-and-effect from oil crisis → diesel costs → food transport → supply chain → their weekly shop. The chain should cover: 1) the oil/geopolitical trigger, 2) diesel/transport fuel impact, 3) logistics and haulage cost rise, 4) supermarket shelf price increases, 5) their personal weekly/annual food cost increase. Use real specifics. Be direct. This is journalism, not financial advice.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    let explainer;
    try {
      explainer = JSON.parse(responseText);
    } catch {
      console.error("Failed to parse Claude response:", responseText);
      return NextResponse.json(
        { error: "Failed to generate explainer" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      explainer,
      data: {
        food: foodImpact,
        fuel: {
          brentCrudeUSD: fuelData.brentCrudeUSD,
          ukDieselPence: fuelData.ukDieselPence,
          dieselChange30d: fuelData.dieselChange30d,
        },
      },
      profile: {
        postcode: profile.postcode,
        fuelType: profile.car_fuel_type,
        annualMileage: profile.annual_mileage,
      },
      source: fuelData.source,
    });
  } catch (err) {
    console.error("Food explainer API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}