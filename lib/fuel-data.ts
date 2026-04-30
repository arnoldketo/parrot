// =============================================================================
// Fuel & Oil Price Data Layer
//
// Sources:
//   - Brent crude: OilPriceAPI.com (demo endpoint, no key required)
//   - UK pump prices: DESNZ weekly national averages (open data, no auth)
//   - Future: GOV.UK Fuel Finder API for postcode-level prices
//
// All fetches are cached server-side to respect rate limits.
// =============================================================================

export interface FuelPriceData {
  brentCrudeUSD: number;
  brentCrudeChange30d: number;
  ukPetrolPence: number;
  ukDieselPence: number;
  petrolChange30d: number;
  dieselChange30d: number;
  lastUpdated: string;
  source: "live" | "cached" | "fallback";
}

// --- In-memory cache ---
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache: Record<string, CacheEntry<unknown>> = {};

function getCached<T>(key: string, maxAgeMs: number): T | null {
  const entry = cache[key] as CacheEntry<T> | undefined;
  if (entry && Date.now() - entry.timestamp < maxAgeMs) {
    return entry.data;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache[key] = { data, timestamp: Date.now() };
}

// --- Brent Crude Oil Price ---
// OilPriceAPI demo: 20 req/hour, no key needed
// Returns latest Brent crude price in USD/barrel

interface OilPriceResponse {
  status: string;
  data: {
    price: number;
    formatted: string;
    currency: string;
    code: string;
    timestamp: string;
  };
}

async function fetchBrentCrude(): Promise<{
  price: number;
  timestamp: string;
} | null> {
  // Check cache first (1 hour TTL)
  const cached = getCached<{ price: number; timestamp: string }>(
    "brent_crude",
    60 * 60 * 1000
  );
  if (cached) return cached;

  try {
    const res = await fetch(
      "https://api.oilpriceapi.com/v1/prices/latest?by_code=BRENT_CRUDE_USD",
      {
        headers: {
          Authorization: `Token ${process.env.OIL_PRICE_API_KEY || ""}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Next.js ISR: revalidate hourly
      }
    );

    if (!res.ok) {
      // Fall back to demo endpoint (no key needed)
      const demoRes = await fetch(
        "https://api.oilpriceapi.com/v1/demo/prices",
        {
          headers: { "Content-Type": "application/json" },
          next: { revalidate: 3600 },
        }
      );

      if (!demoRes.ok) return null;
      const demoData = await demoRes.json();

      // Demo returns an array of prices — find Brent
      const brent = demoData?.data?.prices?.find(
        (p: { code: string }) =>
          p.code === "BRENT_CRUDE_USD" || p.code === "brent_crude_usd"
      );

      if (brent) {
        const result = { price: brent.price, timestamp: brent.timestamp };
        setCache("brent_crude", result);
        return result;
      }
      return null;
    }

    const data: OilPriceResponse = await res.json();
    const result = { price: data.data.price, timestamp: data.data.timestamp };
    setCache("brent_crude", result);
    return result;
  } catch (err) {
    console.error("Failed to fetch Brent crude price:", err);
    return null;
  }
}

// --- UK Pump Prices (DESNZ Weekly Averages) ---
// Source: GOV.UK weekly road fuel prices CSV
// Updated every Monday, covers ~90% of UK retail volume
// Open Government Licence — no auth required

async function fetchDESNZWeeklyPrices(): Promise<{
  petrol: number;
  diesel: number;
} | null> {
  // Check cache first (6 hour TTL — data only changes weekly)
  const cached = getCached<{ petrol: number; diesel: number }>(
    "desnz_prices",
    6 * 60 * 60 * 1000
  );
  if (cached) return cached;

  try {
    // The DESNZ CSV is linked from the GOV.UK stats page.
    // We fetch the publication page to find the latest CSV link.
    const pageRes = await fetch(
      "https://www.gov.uk/government/statistics/weekly-road-fuel-prices",
      {
        headers: {
          Accept: "text/html",
          "User-Agent": "Parrot-News-App/1.0",
        },
        next: { revalidate: 21600 }, // 6 hours
      }
    );

    if (!pageRes.ok) return null;

    const html = await pageRes.text();

    // Find the CSV download link — GOV.UK uses asset links
    // Pattern: /csv-preview/{id}/weekly_road_fuel_prices_{date}.csv
    // Or direct: assets.publishing.service.gov.uk/...
    const csvMatch = html.match(
      /href="([^"]*weekly_road_fuel_prices[^"]*\.csv[^"]*)"/i
    );

    if (!csvMatch) {
      // Try ODS file as fallback
      const odsMatch = html.match(
        /href="(https:\/\/assets\.publishing\.service\.gov\.uk[^"]*weekly[^"]*\.ods[^"]*)"/i
      );
      if (!odsMatch) return null;
    }

    // If we found a CSV link, fetch and parse it
    if (csvMatch) {
      let csvUrl = csvMatch[1];
      if (csvUrl.startsWith("/")) {
        csvUrl = `https://www.gov.uk${csvUrl}`;
      }

      const csvRes = await fetch(csvUrl, {
        headers: { "User-Agent": "Parrot-News-App/1.0" },
      });

      if (!csvRes.ok) return null;

      const csvText = await csvRes.text();
      const prices = parseDESNZCsv(csvText);
      if (prices) {
        setCache("desnz_prices", prices);
      }
      return prices;
    }

    return null;
  } catch (err) {
    console.error("Failed to fetch DESNZ prices:", err);
    return null;
  }
}

function parseDESNZCsv(
  csv: string
): { petrol: number; diesel: number } | null {
  try {
    const lines = csv.trim().split("\n");
    // The DESNZ CSV has columns like:
    // Date, ULSP (pence/litre), ULSD (pence/litre), ...
    // We want the last row (most recent week)

    // Find header row
    const headerIdx = lines.findIndex(
      (line) =>
        line.toLowerCase().includes("ulsp") ||
        line.toLowerCase().includes("unleaded")
    );

    if (headerIdx === -1) return null;

    const headers = lines[headerIdx].split(",").map((h) => h.trim().toLowerCase());

    // Find column indices for petrol (ULSP) and diesel (ULSD)
    const petrolCol = headers.findIndex(
      (h) => h.includes("ulsp") || h.includes("petrol") || h.includes("unleaded")
    );
    const dieselCol = headers.findIndex(
      (h) => h.includes("ulsd") || h.includes("diesel")
    );

    if (petrolCol === -1 || dieselCol === -1) return null;

    // Get the last data row
    const lastRow = lines[lines.length - 1].split(",");
    const petrol = parseFloat(lastRow[petrolCol]);
    const diesel = parseFloat(lastRow[dieselCol]);

    if (isNaN(petrol) || isNaN(diesel)) return null;

    // Get the row from ~4 weeks ago for change calculation
    // (We'll use this in the main function)
    return { petrol, diesel };
  } catch {
    return null;
  }
}

// --- Fallback data ---
// Used when APIs are unreachable. Based on real April 2026 figures.
const FALLBACK_DATA: FuelPriceData = {
  brentCrudeUSD: 110.5,
  brentCrudeChange30d: 18.0,
  ukPetrolPence: 182.5,
  ukDieselPence: 192.1,
  petrolChange30d: 14.2,
  dieselChange30d: 16.8,
  lastUpdated: new Date().toISOString(),
  source: "fallback",
};

// --- Main export ---

export async function getFuelPrices(): Promise<FuelPriceData> {
  // Fetch both sources in parallel
  const [brentResult, desnzResult] = await Promise.all([
    fetchBrentCrude(),
    fetchDESNZWeeklyPrices(),
  ]);

  // Start with fallback, overlay live data where available
  const data: FuelPriceData = { ...FALLBACK_DATA };

  if (brentResult) {
    data.brentCrudeUSD = Math.round(brentResult.price * 100) / 100;
    // Approximate 30-day change (we'd need historical data for exact)
    // For MVP, estimate based on the crisis baseline of ~$90
    data.brentCrudeChange30d =
      Math.round((brentResult.price - 92) * 100) / 100;
    data.source = "live";
  }

  if (desnzResult) {
    data.ukPetrolPence = Math.round(desnzResult.petrol * 10) / 10;
    data.ukDieselPence = Math.round(desnzResult.diesel * 10) / 10;
    // Approximate 30-day change based on pre-crisis baseline
    data.petrolChange30d =
      Math.round((desnzResult.petrol - 168) * 10) / 10;
    data.dieselChange30d =
      Math.round((desnzResult.diesel - 175) * 10) / 10;
    data.source = "live";
    data.lastUpdated = new Date().toISOString();
  }

  return data;
}

export function calculateAnnualFuelCost(
  annualMileage: number,
  fuelType: string,
  petrolPricePence: number,
  dieselPricePence: number
): { litresPerYear: number; annualCost: number; monthlyCost: number } {
  const litresPerMile: Record<string, number> = {
    petrol: 0.0745, // ~38 mpg
    diesel: 0.0636, // ~44 mpg
    hybrid: 0.05,   // ~56 mpg
    electric: 0,
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