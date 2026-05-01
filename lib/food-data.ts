// =============================================================================
// Food & Grocery Impact Data
//
// Sources:
//   - ONS CPI food inflation (monthly, open data)
//   - Kantar grocery market data (referenced for context)
//   - Calculated transport cost pass-through from fuel prices
//
// The key insight: ~8-12% of UK food costs are transport/logistics.
// When diesel rises, supermarkets pass it through within 2-6 weeks.
// =============================================================================

export interface FoodImpactData {
    weeklyShopBaseline: number; // average UK weekly shop in £
    transportCostShare: number; // % of food cost that is logistics
    dieselPricePence: number;
    dieselChange30d: number;
    foodInflationPercent: number; // current ONS food CPI
    estimatedWeeklyIncrease: number; // £ per week extra
    estimatedMonthlyIncrease: number;
    estimatedAnnualIncrease: number;
    lastUpdated: string;
    source: "live" | "calculated" | "fallback";
  }
  
  // UK average weekly grocery spend by household size
  // Source: ONS Family Spending Survey 2024/25
  const WEEKLY_SHOP_BY_HOUSEHOLD: Record<string, number> = {
    single: 45,
    couple: 72,
    family_small: 95, // 2 adults + 1-2 children
    family_large: 125, // 2 adults + 3+ children
    default: 82, // UK average
  };
  
  export function getWeeklyShopBaseline(householdType?: string): number {
    return WEEKLY_SHOP_BY_HOUSEHOLD[householdType || "default"] || 82;
  }
  
  export function calculateFoodImpact(
    dieselPricePence: number,
    dieselChange30d: number,
    householdType?: string
  ): FoodImpactData {
    const weeklyShop = getWeeklyShopBaseline(householdType);
  
    // Transport/logistics is ~10% of UK food retail cost (WRAP, IGD research)
    const transportCostShare = 0.10;
  
    // Diesel price change feeds through to food transport costs
    // Not 1:1 — hedging, contracts, and absorption mean roughly 40-60%
    // of diesel cost increases pass through to shelf prices
    const passThrough = 0.5;
  
    // Calculate: what % did diesel rise?
    const previousDiesel = dieselPricePence - dieselChange30d;
    const dieselChangePercent =
      previousDiesel > 0 ? dieselChange30d / previousDiesel : 0;
  
    // Food price increase from diesel alone
    const foodPriceIncreasePercent =
      dieselChangePercent * transportCostShare * passThrough;
  
    // Also factor in broader food inflation (fertiliser is oil-derived,
    // packaging uses petrochemicals, etc.)
    // Rough model: for every 10% oil rise, food inflation adds ~0.3%
    // on top of transport pass-through
    const oilDerivedInflation = dieselChangePercent * 0.03;
    const totalFoodInflation = foodPriceIncreasePercent + oilDerivedInflation;
  
    const weeklyIncrease = weeklyShop * totalFoodInflation;
    const monthlyIncrease = weeklyIncrease * 4.33;
    const annualIncrease = weeklyIncrease * 52;
  
    // Current UK food CPI (approximate — would be live from ONS in Phase 2)
    const foodInflationPercent = 5.2;
  
    return {
      weeklyShopBaseline: weeklyShop,
      transportCostShare: transportCostShare * 100,
      dieselPricePence,
      dieselChange30d,
      foodInflationPercent,
      estimatedWeeklyIncrease: Math.round(weeklyIncrease * 100) / 100,
      estimatedMonthlyIncrease: Math.round(monthlyIncrease * 100) / 100,
      estimatedAnnualIncrease: Math.round(annualIncrease * 100) / 100,
      lastUpdated: new Date().toISOString(),
      source: "calculated",
    };
  }