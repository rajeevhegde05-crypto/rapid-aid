import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { analyze, URGENCY_STYLE, type Category, type Protocol, QUICK_CATEGORIES } from "@/lib/triage";
import { speak, vibrate } from "@/lib/voice";
import {
  Phone, AlertTriangle, ArrowRight, ArrowLeft, Volume2, VolumeX, HeartPulse, Timer as TimerIcon,
  Ban, ShieldCheck, MessageCircle,
} from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { CprMode } from "@/components/CprMode";

const search = z.object({
  q: z.string().optional(),
  c: z.enum(["cpr", "choking", "bleeding", "burns", "fracture", "unconscious", "allergic", "stroke", "general"]).optional(),
});

export const Route = createFileRoute("/guidance")({
  validateSearch: (s) => search.parse(s),
  component: () => <AppShell><GuidanceScreen /></AppShell>,
});

function GuidanceScreen() {
  const { q, c } = Route.useSearch();
  const navigate = useNavigate();
  const protocol: Protocol = useMemo(() => analyze(q ?? "", c as Category | undefined), [q, c]);
  const [stepIdx, setStepIdx] = useState(0);
  const [voiceOn, setVoiceOn] = useState(false);
  const [cprActive, setCprActive] = useState(false);
  const u = URGENCY_STYLE[protocol.urgency];

  useEffect(() => { setStepIdx(0); }, [protocol.category]);

  useEffect(() => {
    if (protocol.urgency === "critical") vibrate([200, 100, 200, 100, 400]);
  }, [protocol.urgency]);

  useEffect(() => {
    if (!voiceOn) return;
    const s = protocol.steps[stepIdx];
    if (s) speak(`${s.title}. ${s.detail}`);
  }, [voiceOn, stepIdx, protocol.steps]);

  const callEmergency = () => { if (typeof window !== "undefined") window.location.href = "tel:911"; };

  if (cprActive) return <CprMode onExit={() => setCprActive(false)} />;

  const step = protocol.steps[stepIdx];
  const progress = ((stepIdx + 1) / protocol.steps.length) * 100;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-5">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => navigate({ to: "/" })}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold tracking-wider ${u.className}`}>
            <AlertTriangle className="h-3.5 w-3.5" /> {u.label} • RISK {protocol.riskScore}/10
          </span>
        </div>

        <div className="rounded-2xl border-l-4 border-primary bg-card p-5">
          <div className="text-xs font-bold tracking-[0.2em] text-muted-foreground">PROTOCOL</div>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{protocol.title}</h1>
          <p className="mt-2 text-base text-muted-foreground">{protocol.summary}</p>
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span>Step {stepIdx + 1} of {protocol.steps.length}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {step && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-coral text-coral-foreground font-bold">
                {stepIdx + 1}
              </span>
              <div className="flex-1">
                <h2 className="text-xl font-bold sm:text-2xl">{step.title}</h2>
                <p className="mt-2 text-base leading-relaxed text-foreground/90 sm:text-lg">{step.detail}</p>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                disabled={stepIdx === 0}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setVoiceOn((v) => !v)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold"
              >
                {voiceOn ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4" />}
                {voiceOn ? "Voice ON" : "Voice OFF"}
              </button>
              <button
                onClick={() => setStepIdx((i) => Math.min(protocol.steps.length - 1, i + 1))}
                disabled={stepIdx >= protocol.steps.length - 1}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40"
              >
                Next step <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {protocol.timers?.map((t) => (
          <CountdownTimer key={t.label} label={t.label} duration={t.duration} />
        ))}

        {protocol.cprMode && (
          <button
            onClick={() => setCprActive(true)}
            className="flex items-center justify-center gap-3 rounded-2xl border-l-4 border-critical bg-card p-5 text-left transition hover:bg-accent"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-critical/15 text-critical">
              <HeartPulse className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <div className="font-bold">Enter CPR Live Mode</div>
              <div className="text-sm text-muted-foreground">Animated rhythm + audio cues at 110 BPM</div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </button>
        )}

        <div className="rounded-2xl border-l-4 border-critical bg-critical/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-critical">
            <Ban className="h-5 w-5" />
            <span className="text-sm font-bold tracking-wider">DO NOT</span>
          </div>
          <ul className="grid gap-2">
            {protocol.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-critical" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
        <button
          onClick={callEmergency}
          className="animate-pulse-emergency flex w-full items-center justify-center gap-3 rounded-2xl bg-critical px-6 py-5 text-lg font-black tracking-wider text-critical-foreground shadow-xl"
        >
          <Phone className="h-5 w-5" /> CALL 911
        </button>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-success">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-xs font-bold tracking-wider">REASSURANCE</span>
          </div>
          <p className="text-sm text-foreground/90">
            You're doing the right thing. Stay calm — your actions matter. Help is coming.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs font-bold tracking-wider">SWITCH PROTOCOL</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_CATEGORIES.map((qc) => (
              <button
                key={qc.id}
                onClick={() => navigate({ to: "/guidance", search: { c: qc.id } })}
                className={`rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-accent ${
                  qc.id === protocol.category ? "bg-primary/15 text-primary border-primary/40" : ""
                }`}
              >
                {qc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <TimerIcon className="h-4 w-4" />
            <span className="text-xs font-bold tracking-wider">DISCLAIMER</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            This guidance is for informational purposes and is not a substitute for professional medical care.
          </p>
        </div>
      </aside>
    </div>
  );
}
