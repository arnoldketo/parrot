"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const FUEL_TYPES = [
  { value: "petrol", label: "Petrol", icon: "⛽" },
  { value: "diesel", label: "Diesel", icon: "⛽" },
  { value: "electric", label: "Electric", icon: "🔋" },
  { value: "hybrid", label: "Hybrid", icon: "🔄" },
  { value: "none", label: "I don't drive", icon: "🚶" },
];

const MILEAGE_PRESETS = [
  { value: 4000, label: "Low", description: "~4,000 miles/year", detail: "Occasional use" },
  { value: 8000, label: "Average", description: "~8,000 miles/year", detail: "Typical UK driver" },
  { value: 12000, label: "High", description: "~12,000 miles/year", detail: "Daily commuter" },
  { value: 20000, label: "Very high", description: "~20,000 miles/year", detail: "Long commute or work driver" },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [postcode, setPostcode] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [mileage, setMileage] = useState<number | null>(null);

  const totalSteps = 3;

  async function handleSubmit() {
    setIsSubmitting(true);
    setError("");

    try {
      const { data, error: dbError } = await supabase
        .from("profiles")
        .insert({
          postcode: postcode.toUpperCase().trim(),
          car_fuel_type: fuelType,
          annual_mileage: mileage,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Store profile ID in localStorage so we can retrieve it later
      localStorage.setItem("parrot_profile_id", data.id);

      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError("Something went wrong saving your profile. Please try again.");
      setIsSubmitting(false);
    }
  }

  function validatePostcode(pc: string): boolean {
    // Basic UK postcode regex — allows partial (outward code only) or full
    const pattern = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d?[A-Z]{0,2}$/i;
    return pattern.test(pc.trim());
  }

  function canAdvance(): boolean {
    if (step === 1) return validatePostcode(postcode);
    if (step === 2) return fuelType !== "";
    if (step === 3) return mileage !== null;
    return false;
  }

  function handleNext() {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  }

  // Skip mileage step if user doesn't drive
  function handleFuelSelect(value: string) {
    setFuelType(value);
    if (value === "none") {
      setMileage(0);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-10 h-1 bg-zinc-800">
        <div
          className="h-full bg-amber-500 transition-all duration-500"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Back button */}
      <div className="px-6 pt-8">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            ← Back
          </button>
        ) : (
          <a
            href="/"
            className="text-sm text-zinc-500 transition hover:text-zinc-300"
          >
            ← Home
          </a>
        )}
      </div>

      {/* Step content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <div className="w-full max-w-md">
          <div className="mb-2 text-sm font-mono text-amber-500">
            {step} of {totalSteps}
          </div>

          {/* Step 1: Postcode */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Where do you live?
              </h1>
              <p className="mt-2 text-zinc-400">
                Your postcode helps us find local fuel prices and calculate
                region-specific costs.
              </p>
              <input
                type="text"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && canAdvance() && handleNext()}
                placeholder="e.g. SW1A 1AA"
                autoFocus
                className="mt-8 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-lg tracking-wide text-zinc-100 placeholder-zinc-600 outline-none transition focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <p className="mt-3 text-xs text-zinc-600">
                We only use the outward code (first half) — your exact address is
                never stored.
              </p>
            </div>
          )}

          {/* Step 2: Fuel type */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                What do you drive?
              </h1>
              <p className="mt-2 text-zinc-400">
                This determines how oil price changes affect your fuel costs.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                {FUEL_TYPES.map((ft) => (
                  <button
                    key={ft.value}
                    onClick={() => handleFuelSelect(ft.value)}
                    className={`flex items-center rounded-lg border px-4 py-3 text-left transition ${
                      fuelType === ft.value
                        ? "border-amber-500 bg-amber-500/10 text-amber-300"
                        : "border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    <span className="mr-3 text-xl">{ft.icon}</span>
                    <span className="font-medium">{ft.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Mileage */}
          {step === 3 && fuelType !== "none" && (
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                How much do you drive?
              </h1>
              <p className="mt-2 text-zinc-400">
                This lets us calculate your actual annual fuel spend, not just the
                per-litre change.
              </p>
              <div className="mt-8 flex flex-col gap-3">
                {MILEAGE_PRESETS.map((mp) => (
                  <button
                    key={mp.value}
                    onClick={() => setMileage(mp.value)}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 transition ${
                      mileage === mp.value
                        ? "border-amber-500 bg-amber-500/10"
                        : "border-zinc-700 bg-zinc-900 hover:border-zinc-500"
                    }`}
                  >
                    <div>
                      <span className={`font-medium ${
                        mileage === mp.value ? "text-amber-300" : "text-zinc-300"
                      }`}>
                        {mp.label}
                      </span>
                      <span className="ml-2 text-sm text-zinc-500">
                        {mp.detail}
                      </span>
                    </div>
                    <span className={`text-sm font-mono ${
                      mileage === mp.value ? "text-amber-400" : "text-zinc-500"
                    }`}>
                      {mp.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 for non-drivers — skip to submit */}
          {step === 3 && fuelType === "none" && (
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                You&apos;re still affected
              </h1>
              <p className="mt-2 text-zinc-400">
                Even without a car, oil prices drive up food, delivery, and public
                transport costs. We&apos;ll show you those impacts instead.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Next / Submit button */}
          <button
            onClick={handleNext}
            disabled={!canAdvance() || isSubmitting}
            className="mt-8 w-full rounded-lg bg-amber-500 py-3 text-base font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSubmitting
              ? "Saving..."
              : step === totalSteps
              ? "Show me my impact →"
              : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}