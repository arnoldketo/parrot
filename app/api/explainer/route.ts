import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getFuelPrices, calculateAnnualFuelCost } from "@/lib/fuel-data";

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

    // 2. Fetch fuel price data
    const fuelData = await getFuelPrices();

    // 3. Calculate base costs
    const costs = calculateAnnualFuelCost(
      profile.annual_mileage,
      profile.car_fuel_type,
      fuelData.ukPetrolPence,
      fuelData.ukDieselPence
    );

    // Calculate what costs WERE before the price rise
    const previousPetrol = fuelData.ukPetrolPence - fuelData.petrolChange30d;
    const previousDiesel = fuelData.ukDieselPence - fuelData.dieselChange30d;
    const previousCosts = calculateAnnualFuelCost(
      profile.annual_mileage,
      profile.car_fuel_type,
      previousPetrol,
      previousDiesel
    );

    const annualIncrease = costs.annualCost - previousCosts.annualCost;
    const monthlyIncrease = costs.monthlyCost - previousCosts.monthlyCost;

    // 4. Generate personalised explainer with Claude
    const prompt = `You are Parrot, a news impact analyst. Generate a personalised explainer about how the current oil crisis affects this specific user's fuel costs.

USER PROFILE:
- Location: ${profile.postcode}
- Fuel type: ${profile.car_fuel_type}
- Annual mileage: ${profile.annual_mileage.toLocaleString()} miles/year

CURRENT DATA:
- Brent crude: $${fuelData.brentCrudeUSD}/barrel (up $${fuelData.brentCrudeChange30d} in 30 days)
- UK ${profile.car_fuel_type} price: ${profile.car_fuel_type === "diesel" ? fuelData.ukDieselPence : fuelData.ukPetrolPence}p/litre (up ${profile.car_fuel_type === "diesel" ? fuelData.dieselChange30d : fuelData.petrolChange30d}p in 30 days)
- Their annual fuel cost at current prices: £${costs.annualCost}
- Their annual fuel cost before the rise: £${previousCosts.annualCost}
- Annual increase: £${annualIncrease}
- Monthly increase: £${monthlyIncrease}

Respond with ONLY valid JSON in this exact structure (no markdown, no code fences):
{
  "headline": "A punchy, personalised headline about their specific cost increase",
  "summary": "2-3 sentence personalised summary using their actual numbers",
  "chain": [
    {
      "title": "Short title for this link in the chain",
      "detail": "One sentence explaining this step",
      "value": "The key number or fact for this step"
    }
  ],
  "bottomLine": "One sentence: the single most important takeaway with their £ figure",
  "context": "One sentence putting this in perspective (e.g., equivalent to X cups of coffee per week, or X% of average grocery spend)"
}

The chain should have exactly 5 nodes showing the cause-and-effect from geopolitical event → oil markets → UK wholesale → pump prices → this user's wallet. Use real specifics, not generalities. Be direct, not hedging. This is journalism, not financial advice.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    // Parse Claude's response
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

    // 5. Return the complete response
    return NextResponse.json({
      explainer,
      data: {
        fuel: fuelData,
        costs,
        previousCosts,
        annualIncrease,
        monthlyIncrease,
      },
      profile: {
        postcode: profile.postcode,
        fuelType: profile.car_fuel_type,
        annualMileage: profile.annual_mileage,
      },
    });
  } catch (err) {
    console.error("Explainer API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}