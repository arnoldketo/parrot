"use client";

import { useState, useEffect } from "react";
import CauseEffectChain from "@/components/CauseEffectChain";

interface ChainNode {
  title: string;
  detail: string;
  value: string;
}

interface ExplainerData {
  explainer: {
    headline: string;
    summary: string;
    chain: ChainNode[];
    bottomLine: string;
    context: string;
  };
  data: {
    fuel: {
      brentCrudeUSD: number;
      ukPetrolPence: number;
      ukDieselPence: number;
      lastUpdated: string;
    };
    costs: { annualCost: number; monthlyCost: number };
    annualIncrease: number;
    monthlyIncrease: number;
  };
  profile: {
    postcode: string;
    fuelType: string;
    annualMileage: number;
  };
  source: "live" | "cached" | "fallback";
}

export default function Dashboard() {
  const [data, setData] = useState<ExplainerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchExplainer() {
      const profileId = localStorage.getItem("parrot_profile_id");

      if (!profileId) {
        setError("No profile found. Please complete onboarding first.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/explainer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId }),
        });

        if (!res.ok) throw new Error("Failed to generate explainer");

        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError(
          "Failed to load your personalised briefing. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchExplainer();
  }, []);

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-6">
          {/* Animated ripple loader */}
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
            <div
              className="absolute inset-2 rounded-full bg-amber-500/20"
              style={{ animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite 0.3s" }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-4 w-4 rounded-full bg-amber-500" />
            </div>
          </div>
          <div className="text-center">
            <p className="font-medium text-zinc-300">
              Tracing the impact chain...
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              Connecting global events to your wallet
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
            <span className="text-xl">⚠</span>
          </div>
          <p className="text-lg text-red-400">{error}</p>
          <a
            href="/onboarding"
            className="mt-6 inline-block rounded-lg bg-amber-500 px-6 py-3 font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            Set up your profile
          </a>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { explainer, data: impactData, profile } = data;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ---- Header ---- */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 px-6 py-4 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-lg font-bold tracking-tight">
            Parrot<span className="text-amber-500">.</span>
          </span>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-600">
            <span className="rounded bg-zinc-900 px-2 py-0.5">
              {profile.postcode}
            </span>
            <span className="rounded bg-zinc-900 px-2 py-0.5 capitalize">
              {profile.fuelType}
            </span>
            <span className="rounded bg-zinc-900 px-2 py-0.5">
              {profile.annualMileage.toLocaleString()} mi
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* ---- Live data ticker ---- */}
        <div className="mb-10 flex flex-wrap gap-3">
          {[
            {
              label: "Brent Crude",
              value: `$${impactData.fuel.brentCrudeUSD}`,
            },
            {
              label: "UK Petrol",
              value: `${impactData.fuel.ukPetrolPence}p`,
            },
            {
              label: "UK Diesel",
              value: `${impactData.fuel.ukDieselPence}p`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm"
            >
              <span className="text-zinc-500">{item.label}</span>
              <span className="font-mono font-semibold text-zinc-200">
                {item.value}
              </span>
            </div>
          ))}
          <div
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs ${
              data.source === "live"
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500/70"
                : "border-zinc-700 bg-zinc-800 text-zinc-500"
            }`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                data.source === "live"
                  ? "animate-pulse bg-emerald-500"
                  : "bg-zinc-500"
              }`}
            />
            {data.source === "live" ? "Live data" : "Sample data"}
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-500/70">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            Live
          </div>
        </div>

        {/* ---- Headline ---- */}
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {explainer.headline}
        </h1>

        {/* ---- Summary ---- */}
        <p className="mt-4 text-lg leading-relaxed text-zinc-400">
          {explainer.summary}
        </p>

        {/* ---- Impact highlight cards ---- */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-red-500/15 bg-gradient-to-br from-red-500/5 to-transparent p-6">
            <p className="text-sm font-mono text-zinc-500 uppercase tracking-wider">
              Your annual increase
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-red-400">
              +£{impactData.annualIncrease}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              +£{impactData.monthlyIncrease}/month
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
            <p className="text-sm font-mono text-zinc-500 uppercase tracking-wider">
              Total annual fuel cost
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-zinc-100">
              £{impactData.costs.annualCost}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              £{impactData.costs.monthlyCost}/month
            </p>
          </div>
        </div>

        {/* ---- The chain — signature element ---- */}
        <CauseEffectChain
          chain={explainer.chain}
          bottomLine={explainer.bottomLine}
          context={explainer.context}
        />

        {/* ---- Profile link ---- */}
        <div className="mt-16 border-t border-zinc-800/60 pt-8 text-center">
          <p className="text-sm text-zinc-600">
            Personalised to your profile.{" "}
            <a
              href="/onboarding"
              className="text-amber-500 underline decoration-amber-500/30 underline-offset-2 transition hover:text-amber-400 hover:decoration-amber-400/50"
            >
              Update your details
            </a>{" "}
            to recalculate.
          </p>
        </div>
      </div>
    </main>
  );
}