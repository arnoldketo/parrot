"use client";

import { useState, useEffect } from "react";

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
}

export default function Dashboard() {
  const [data, setData] = useState<ExplainerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedNode, setExpandedNode] = useState<number | null>(null);

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

        if (!res.ok) {
          throw new Error("Failed to generate explainer");
        }

        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Failed to load your personalised briefing. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    fetchExplainer();
  }, []);

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-amber-500" />
          <p className="text-zinc-400">
            Analysing how global events affect your costs...
          </p>
          <p className="text-sm text-zinc-600">
            This takes a few seconds the first time
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-zinc-100">
        <div className="max-w-md text-center">
          <p className="text-lg text-red-400">{error}</p>
          <a
            href="/onboarding"
            className="mt-6 inline-block rounded-lg bg-amber-500 px-6 py-3 font-semibold text-zinc-950"
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
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <span className="text-lg font-bold">
            Parrot<span className="text-amber-500">.</span>
          </span>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span>{profile.postcode}</span>
            <span>·</span>
            <span className="capitalize">{profile.fuelType}</span>
            <span>·</span>
            <span>{profile.annualMileage.toLocaleString()} mi/yr</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Live data ticker */}
        <div className="mb-8 flex flex-wrap gap-4 text-sm">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2">
            <span className="text-zinc-500">Brent Crude </span>
            <span className="font-mono font-semibold text-zinc-200">
              ${impactData.fuel.brentCrudeUSD}
            </span>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2">
            <span className="text-zinc-500">UK Petrol </span>
            <span className="font-mono font-semibold text-zinc-200">
              {impactData.fuel.ukPetrolPence}p
            </span>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2">
            <span className="text-zinc-500">UK Diesel </span>
            <span className="font-mono font-semibold text-zinc-200">
              {impactData.fuel.ukDieselPence}p
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          {explainer.headline}
        </h1>

        {/* Summary */}
        <p className="mt-4 text-lg leading-relaxed text-zinc-400">
          {explainer.summary}
        </p>

        {/* Impact highlight */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
            <p className="text-sm text-zinc-500">Your annual increase</p>
            <p className="mt-1 text-3xl font-bold text-red-400">
              +£{impactData.annualIncrease}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              £{impactData.monthlyIncrease}/month extra
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-sm text-zinc-500">Your total annual fuel cost</p>
            <p className="mt-1 text-3xl font-bold text-zinc-100">
              £{impactData.costs.annualCost}
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              £{impactData.costs.monthlyCost}/month
            </p>
          </div>
        </div>

        {/* Cause and effect chain */}
        <section className="mt-12">
          <h2 className="mb-6 text-sm font-mono uppercase tracking-wider text-amber-500">
            Cause & Effect Chain
          </h2>

          <div className="flex flex-col gap-1">
            {explainer.chain.map((node, i) => (
              <div key={i}>
                {/* Connector line */}
                {i > 0 && (
                  <div className="ml-6 flex h-6 items-center">
                    <div className="h-full w-px bg-zinc-700" />
                  </div>
                )}

                {/* Node */}
                <button
                  onClick={() =>
                    setExpandedNode(expandedNode === i ? null : i)
                  }
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    expandedNode === i
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-400">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">{node.title}</h3>
                        <span className="ml-4 shrink-0 font-mono text-sm text-amber-400">
                          {node.value}
                        </span>
                      </div>
                      {expandedNode === i && (
                        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                          {node.detail}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom line */}
        <div className="mt-10 rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
          <p className="text-sm font-mono uppercase tracking-wider text-amber-500">
            The Bottom Line
          </p>
          <p className="mt-2 text-lg font-semibold">{explainer.bottomLine}</p>
          <p className="mt-2 text-sm text-zinc-400">{explainer.context}</p>
        </div>

        {/* Profile link */}
        <div className="mt-12 border-t border-zinc-800 pt-8 text-center">
          <p className="text-sm text-zinc-600">
            These numbers are personalised to your profile.{" "}
            <a
              href="/onboarding"
              className="text-amber-500 underline transition hover:text-amber-400"
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