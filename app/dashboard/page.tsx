"use client";

import { useState, useEffect } from "react";
import CauseEffectChain from "@/components/CauseEffectChain";

// --- Types ---

interface ChainNode {
  title: string;
  detail: string;
  value: string;
}

interface Explainer {
  headline: string;
  summary: string;
  chain: ChainNode[];
  bottomLine: string;
  context: string;
}

interface TopicCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  endpoint: string;
}

const TOPICS: TopicCard[] = [
  {
    id: "fuel",
    title: "Your Fuel Costs",
    subtitle: "How the oil crisis hits your tank",
    icon: "⛽",
    endpoint: "/api/explainer",
  },
  {
    id: "food",
    title: "Your Food Shop",
    subtitle: "How oil prices drive up your groceries",
    icon: "🛒",
    endpoint: "/api/explainer/food",
  },
];

// --- Component ---

export default function Dashboard() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [explainer, setExplainer] = useState<Explainer | null>(null);
  const [topicData, setTopicData] = useState<Record<string, unknown> | null>(null);
  const [profileInfo, setProfileInfo] = useState<{
    postcode: string;
    fuelType: string;
    annualMileage: number;
  } | null>(null);
  const [source, setSource] = useState<"live" | "cached" | "fallback">(
    "fallback"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check profile exists on mount
  useEffect(() => {
    const profileId = localStorage.getItem("parrot_profile_id");
    if (!profileId) {
      setError("No profile found. Please complete onboarding first.");
    }
  }, []);

  async function loadTopic(topic: TopicCard) {
    const profileId = localStorage.getItem("parrot_profile_id");
    if (!profileId) return;

    setSelectedTopic(topic.id);
    setLoading(true);
    setError("");
    setExplainer(null);

    try {
      const res = await fetch(topic.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId }),
      });

      if (!res.ok) throw new Error("Failed to generate explainer");

      const result = await res.json();
      setExplainer(result.explainer);
      setTopicData(result.data);
      setProfileInfo(result.profile);
      setSource(result.source || "fallback");
    } catch (err) {
      console.error(err);
      setError("Failed to load this explainer. Please try again.");
      setSelectedTopic(null);
    } finally {
      setLoading(false);
    }
  }

  // --- Error state (no profile) ---
  if (error && !selectedTopic) {
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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ---- Header ---- */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <button
            onClick={() => {
              setSelectedTopic(null);
              setExplainer(null);
              setError("");
            }}
            className="text-lg font-bold tracking-tight hover:opacity-80 transition"
          >
            Parrot<span className="text-amber-500">.</span>
          </button>

          {profileInfo && (
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-600">
              <span className="rounded bg-zinc-900 px-2 py-0.5">
                {profileInfo.postcode}
              </span>
              <span className="rounded bg-zinc-900 px-2 py-0.5 capitalize">
                {profileInfo.fuelType}
              </span>
              <span className="rounded bg-zinc-900 px-2 py-0.5">
                {profileInfo.annualMileage.toLocaleString()} mi
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* ============================================= */}
        {/* TOPIC SELECTION VIEW                          */}
        {/* ============================================= */}
        {!selectedTopic && (
          <div>
            <div className="mb-2 text-sm font-mono uppercase tracking-wider text-amber-500">
              Your Briefing
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How today&apos;s events affect{" "}
              <span className="text-amber-400">your money</span>
            </h1>
            <p className="mt-3 text-zinc-400">
              Tap a topic to see your personalised cause-and-effect chain.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {TOPICS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => loadTopic(topic)}
                  className="group flex flex-col items-start rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-left transition hover:border-amber-500/30 hover:bg-zinc-900"
                >
                  <span className="text-3xl">{topic.icon}</span>
                  <h2 className="mt-4 text-lg font-semibold group-hover:text-amber-400 transition">
                    {topic.title}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {topic.subtitle}
                  </p>
                  <span className="mt-4 text-sm font-medium text-amber-500 opacity-0 transition group-hover:opacity-100">
                    See your impact →
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-12 rounded-xl border border-zinc-800/60 bg-zinc-900/30 p-6 text-center">
              <p className="text-sm text-zinc-600">
                More topics coming soon: energy bills, mortgage rates, pension
                impact, public transport fares.
              </p>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* LOADING STATE                                 */}
        {/* ============================================= */}
        {loading && (
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 animate-ping rounded-full bg-amber-500/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-amber-500" />
              </div>
            </div>
            <div className="mt-6 text-center">
              <p className="font-medium text-zinc-300">
                Tracing the impact chain...
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Connecting global events to your wallet
              </p>
            </div>
          </div>
        )}

        {/* ============================================= */}
        {/* EXPLAINER VIEW                                */}
        {/* ============================================= */}
        {selectedTopic && explainer && !loading && (
          <div>
            {/* Back button */}
            <button
              onClick={() => {
                setSelectedTopic(null);
                setExplainer(null);
              }}
              className="mb-8 text-sm text-zinc-500 transition hover:text-zinc-300"
            >
              ← All topics
            </button>

            {/* Data source badge */}
            <div className="mb-6 flex items-center gap-3">
              <div
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs ${
                  source === "live"
                    ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500/70"
                    : "border-zinc-700 bg-zinc-800 text-zinc-500"
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    source === "live"
                      ? "animate-pulse bg-emerald-500"
                      : "bg-zinc-500"
                  }`}
                />
                {source === "live" ? "Live data" : "Sample data"}
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {explainer.headline}
            </h1>

            {/* Summary */}
            <p className="mt-4 text-lg leading-relaxed text-zinc-400">
              {explainer.summary}
            </p>

            {/* The chain */}
            <CauseEffectChain
              chain={explainer.chain}
              bottomLine={explainer.bottomLine}
              context={explainer.context}
            />

            {/* Footer */}
            <div className="mt-16 border-t border-zinc-800/60 pt-8 text-center">
              <p className="text-sm text-zinc-600">
                Personalised to your profile.{" "}
                <a
                  href="/onboarding"
                  className="text-amber-500 underline decoration-amber-500/30 underline-offset-2 transition hover:text-amber-400"
                >
                  Update your details
                </a>{" "}
                to recalculate.
              </p>
            </div>
          </div>
        )}

        {/* Inline error */}
        {error && selectedTopic && (
          <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/5 p-6 text-center">
            <p className="text-red-400">{error}</p>
            <button
              onClick={() => {
                setSelectedTopic(null);
                setError("");
              }}
              className="mt-4 text-sm text-amber-500 underline"
            >
              Back to topics
            </button>
          </div>
        )}
      </div>
    </main>
  );
}