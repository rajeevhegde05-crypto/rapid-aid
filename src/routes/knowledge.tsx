import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { QUICK_CATEGORIES } from "@/lib/triage";
import { Search, Droplet, Brain, FlaskConical, HeartPulse, Wind, WifiOff } from "lucide-react";

export const Route = createFileRoute("/knowledge")({
  component: () => <AppShell><Knowledge /></AppShell>,
});

const CATS = [
  { id: "bleeding", title: "Severe Trauma", desc: "Hemorrhage control, tourniquet application, and shock management protocols.", count: 12, Icon: Droplet, color: "text-coral", border: "border-l-coral" },
  { id: "stroke", title: "Neurological", desc: "Stroke identification (FAST), seizure management, and altered mental status.", count: 8, Icon: Brain, color: "text-warning", border: "border-l-warning" },
  { id: "general", title: "Toxicology", desc: "Poisoning, overdose response, and hazardous material exposure guidelines.", count: 15, Icon: FlaskConical, color: "text-primary", border: "border-l-primary" },
  { id: "cpr", title: "Cardiac Events", desc: "CPR algorithms, AED deployment, and suspected myocardial infarction.", count: 6, Icon: HeartPulse, color: "text-critical", border: "border-l-critical" },
  { id: "allergic", title: "Respiratory Distress", desc: "Airway management, asthma exacerbation, and anaphylaxis response.", count: 9, Icon: Wind, color: "text-primary", border: "border-l-primary" },
  { id: "burns", title: "Thermal & Burns", desc: "Burn classification, cooling protocols, and chemical burn response.", count: 7, Icon: HeartPulse, color: "text-warning", border: "border-l-warning" },
] as const;

function Knowledge() {
  const [q, setQ] = useState("");
  const filtered = CATS.filter((c) =>
    !q || c.title.toLowerCase().includes(q.toLowerCase()) || c.desc.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Offline Knowledge Base</h1>
          <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-warning">
            <WifiOff className="h-4 w-4" /> OFFLINE READY • LOCAL TEMPLATES LOADED
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-card p-1 text-xs font-bold">
          {["EN", "ES", "FR"].map((l, i) => (
            <button key={l} className={`rounded-md px-3 py-1.5 ${i === 0 ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search conditions, protocols, or symptoms…"
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Link
            key={c.title}
            to="/guidance"
            search={{ c: c.id as never }}
            className={`group rounded-2xl border-l-4 ${c.border} bg-card p-5 transition hover:bg-accent`}
          >
            <span className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-full bg-accent ${c.color}`}>
              <c.Icon className="h-5 w-5" />
            </span>
            <h3 className="text-xl font-bold">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.desc}</p>
            <div className="mt-4 text-xs font-bold tracking-wider text-primary">{c.count} PROTOCOLS →</div>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Frequently Accessed</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to="/guidance"
              search={{ c: c.id }}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
