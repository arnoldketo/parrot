export interface FuelPriceData {
    brentCrudeUSD: number;
    brentCrudeChange30d: number;
    ukPetrolPence: number;
    ukDieselPence: number;
    petrolChange30d: number;
    dieselChange30d: number;
    lastUpdated: string;
  }
  
  export async function getFuelPrices(): Promise<FuelPriceData> {
    // TODO: Replace with live API calls in Phase 2
    // - Oil price: Trading Economics or EIA API
    // - UK fuel: GOV.UK Fuel Finder API (mandatory since Feb 2026)
    //
    // For MVP, we use realistic figures based on the Hormuz crisis period.
    // This lets us build and demo the full UX without API rate limits
    // blocking development.
  
    return {
      brentCrudeUSD: 112.4,
      brentCrudeChange30d: 18.7,
      ukPetrolPence: 182.5,
      ukDieselPence: 191.3,
      petrolChange30d: 14.2,
      dieselChange30d: 16.8,
      lastUpdated: new Date().toISOString(),
    };
  }
  
  export function calculateAnnualFuelCost(
    annualMileage: number,
    fuelType: string,
    petrolPricePence: number,
    dieselPricePence: number
  ): { litresPerYear: number; annualCost: number; monthlyCost: number } {
    // Average fuel consumption (litres per mile)
    const litresPerMile: Record<string, number> = {
      petrol: 0.0745, // ~38 mpg average UK petrol car
      diesel: 0.0636, // ~44 mpg average UK diesel car
      hybrid: 0.0500, // ~56 mpg average hybrid
      electric: 0, // handled separately
      none: 0,
    };
  
    const consumption = litresPerMile[fuelType] || litresPerMile.petrol;
    const litresPerYear = annualMileage * consumption;
  
    const pencePerLitre =
      fuelType === "diesel" ? dieselPricePence : petrolPricePence;
    const annualCost = (litresPerYear * pencePerLitre) / 100;
    const monthlyCost = annualCost / 12;
  
    return {
      litresPerYear: Math.round(litresPerYear),
      annualCost: Math.round(annualCost),
      monthlyCost: Math.round(monthlyCost),
    };
  }