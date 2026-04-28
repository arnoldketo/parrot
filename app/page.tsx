export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center">
        <div className="mb-6 inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm text-amber-400">
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          Live: Tracking 3 macro events affecting UK households
        </div>

        <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          The news doesn&apos;t tell you{" "}
          <span className="text-amber-400">what it costs you</span>
        </h1>

        <p className="mt-6 max-w-xl text-lg text-zinc-400">
          Parrot translates complex global events into pounds and pence.
          See exactly how the oil crisis, trade wars, and policy changes
          hit your fuel, food, energy, and pension — personalised to your life.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="/onboarding"
            className="rounded-lg bg-amber-500 px-8 py-3 text-base font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            See your personal impact →
          </a>
          <a
            href="#how-it-works"
            className="rounded-lg border border-zinc-700 px-8 py-3 text-base font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
          >
            How it works
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-12 text-center text-2xl font-bold sm:text-3xl">
          From headline to your wallet in 30 seconds
        </h2>

        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "We monitor macro events",
              description:
                "Oil shocks, trade policy, rate decisions, climate disruptions — tracked in real time from trusted sources.",
            },
            {
              step: "02",
              title: "You tell us about your life",
              description:
                "Postcode, car type, commute, diet, housing, investments. Two minutes of setup, months of insight.",
            },
            {
              step: "03",
              title: "See your personal impact",
              description:
                "Interactive cause-and-effect chains show exactly how each event flows through to YOUR costs, in pounds and pence.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"
            >
              <span className="text-sm font-mono text-amber-500">
                {item.step}
              </span>
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Example impact teaser */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
          <div className="mb-4 text-sm font-mono text-amber-500">
            LIVE EXAMPLE
          </div>
          <h3 className="text-xl font-bold sm:text-2xl">
            Strait of Hormuz disruption
          </h3>
          <p className="mt-2 text-zinc-400">
            Here&apos;s how one event cascades through to your daily costs:
          </p>

          {/* Simplified cause-and-effect preview */}
          <div className="mt-8 flex flex-col gap-3">
            {[
              { label: "Oil supply disrupted", impact: "Brent crude → $112/bbl" },
              { label: "UK wholesale fuel rises", impact: "+14p/litre in 3 weeks" },
              { label: "Your annual fuel cost", impact: "+£340/year" },
              { label: "Your weekly food shop", impact: "+£8.20/week from transport costs" },
            ].map((node, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-400">
                  {i + 1}
                </div>
                <div className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3">
                  <span className="text-sm text-zinc-300">{node.label}</span>
                  <span className="ml-2 text-sm font-semibold text-amber-400">
                    {node.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-zinc-500">
            This is a simplified preview. Your personalised chain has real-time
            data and interactive nodes.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8 text-center text-sm text-zinc-500">
        Parrot — Making the news make sense for your life.
      </footer>
    </main>
  );
}