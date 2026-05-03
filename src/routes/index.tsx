import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ShieldAlert, Flame, Stethoscope, LifeBuoy, Mic, Send, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { QUICK_CATEGORIES, type Category } from "@/lib/triage";
import { useVoiceInput } from "@/lib/voice";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

const SPECIFIC = [
  { id: "police", label: "POLICE", Icon: ShieldAlert, color: "text-primary", border: "border-l-primary" },
  { id: "fire", label: "FIRE", Icon: Flame, color: "text-warning", border: "border-l-warning" },
  { id: "medical", label: "MEDICAL", Icon: Stethoscope, color: "text-coral", border: "border-l-coral" },
  { id: "rescue", label: "RESCUE", Icon: LifeBuoy, color: "text-success", border: "border-l-success" },
];

function IndexPage() {
  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

function Dashboard() {
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const { listening, start, supported } = useVoiceInput((t) => setText((p) => (p ? p + " " : "") + t));

  const submit = (input: string, category?: Category) => {
    const params = new URLSearchParams();
    if (input) params.set("q", input);
    if (category) params.set("c", category);
    navigate({ to: "/guidance", search: Object.fromEntries(params) as never });
  };

  const callEmergency = () => {
    if (typeof window !== "undefined") window.location.href = "tel:911";
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border-l-4 border-primary bg-card p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">System Readiness</h2>
            <p className="text-sm text-muted-foreground">All local emergency networks online. Location active.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" /> OPTIMAL
          </span>
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 py-4">
        <button
          onClick={callEmergency}
          className="animate-pulse-emergency relative w-full max-w-2xl rounded-full bg-critical px-10 py-10 text-critical-foreground shadow-2xl transition active:scale-[0.98]"
        >
          <div className="text-sm font-bold tracking-[0.3em] opacity-90">SOS</div>
          <div className="text-3xl font-black tracking-wider sm:text-5xl">CALL EMERGENCY</div>
        </button>
        <p className="text-sm text-muted-foreground">Tap immediately for life-threatening situations.</p>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Quick Protocols</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => submit(c.label, c.id)}
              className="flex flex-col items-center gap-2 rounded-xl border-l-4 border-coral bg-card p-4 text-center transition hover:bg-accent active:scale-95"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-coral/15 text-coral">
                <Stethoscope className="h-6 w-6" />
              </span>
              <span className="text-sm font-semibold">{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">Specific Assistance</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SPECIFIC.map(({ id, label, Icon, color, border }) => (
            <button
              key={id}
              onClick={() => submit(label)}
              className={`flex flex-col items-center gap-3 rounded-xl border-l-4 ${border} bg-card p-5 transition hover:bg-accent active:scale-95`}
            >
              <span className={`grid h-12 w-12 place-items-center rounded-full bg-accent ${color}`}>
                <Icon className="h-6 w-6" />
              </span>
              <span className="text-sm font-bold tracking-wider">{label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <label className="mb-3 block text-xs font-bold tracking-[0.2em] text-muted-foreground">DESCRIBE SITUATION</label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && text.trim() && submit(text)}
            placeholder="Type details or use voice input…"
            className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {supported && (
            <button
              onClick={start}
              aria-label="Voice input"
              className={`grid h-9 w-9 place-items-center rounded-full transition ${
                listening ? "animate-pulse bg-critical text-critical-foreground" : "bg-primary/20 text-primary hover:bg-primary/30"
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => text.trim() && submit(text)}
            aria-label="Send"
            className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            disabled={!text.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Try: "<button onClick={() => submit("Person not breathing")} className="underline">person not breathing</button>" •
          " <button onClick={() => submit("Severe bleeding from arm")} className="underline">severe bleeding</button>"
        </p>
      </section>
    </div>
  );
}

// re-export for convenience
export { useMemo };
