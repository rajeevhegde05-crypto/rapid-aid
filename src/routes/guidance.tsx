import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { z } from "zod";
import { AppShell } from "@/components/AppShell";
import { analyze, URGENCY_STYLE, type Category, type Protocol, QUICK_CATEGORIES } from "@/lib/triage";
import { speak, vibrate } from "@/lib/voice";
import {
  Phone, AlertTriangle, ArrowRight, ArrowLeft, Volume2, VolumeX, HeartPulse,
  Timer as TimerIcon, Ban, ShieldCheck, MessageCircle, ChevronDown, ChevronUp,
  Eye, EyeOff, StickyNote, RotateCcw, Zap, Activity, Gauge, Clock,
} from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { CprMode } from "@/components/CprMode";
import { AIChatPanel } from "@/components/AIChatPanel";
import { AITriageInsight } from "@/components/AITriageInsight";
import { useI18n } from "@/lib/i18n";

const search = z.object({
  q: z.string().optional(),
  c: z.enum(["cpr", "choking", "bleeding", "burns", "fracture", "unconscious", "allergic", "stroke", "general"]).optional(),
});

export const Route = createFileRoute("/guidance")({
  validateSearch: (s) => search.parse(s),
  component: () => <AppShell><GuidanceScreen /></AppShell>,
});

const CATEGORY_KEYS: Record<string, string> = {
  cpr: "cat.cpr", choking: "cat.choking", bleeding: "cat.bleeding",
  burns: "cat.burns", fracture: "cat.fracture", allergic: "cat.allergic",
};

const REASSURANCE_MESSAGES = [
  "You're doing the right thing. Stay calm — your actions matter.",
  "You're making progress. Every step helps. Keep going.",
  "You're almost there. Stay focused — help is on the way.",
  "Excellent work. You've completed the critical steps. Stay with them.",
];

type BleedingLevel = "none" | "minor" | "severe";

function GuidanceScreen() {
  const { q, c } = Route.useSearch();
  const navigate = useNavigate();
  const protocol: Protocol = useMemo(() => analyze(q ?? "", c as Category | undefined), [q, c]);
  const [stepIdx, setStepIdx] = useState(0);
  const [voiceOn, setVoiceOn] = useState(false);
  const [cprActive, setCprActive] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [expandedRisk, setExpandedRisk] = useState(false);
  const [stepTimerActive, setStepTimerActive] = useState(false);
  const [stepTimerRemaining, setStepTimerRemaining] = useState(0);
  // Victim status
  const [breathing, setBreathing] = useState<boolean | null>(null);
  const [conscious, setConscious] = useState<boolean | null>(null);
  const [bleedingLevel, setBleedingLevel] = useState<BleedingLevel>("none");
  const { t } = useI18n();
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

  // Step timer
  useEffect(() => {
    if (!stepTimerActive || stepTimerRemaining <= 0) return;
    const id = setInterval(() => {
      setStepTimerRemaining((r) => { if (r <= 1) { setStepTimerActive(false); return 0; } return r - 1; });
    }, 1000);
    return () => clearInterval(id);
  }, [stepTimerActive, stepTimerRemaining]);

  const startStepTimer = () => {
    const s = protocol.steps[stepIdx];
    if (s) { setStepTimerRemaining(s.estimatedSeconds); setStepTimerActive(true); }
  };

  const callEmergency = () => { if (typeof window !== "undefined") window.location.href = "tel:112"; };
  const speakStep = (idx: number) => { const s = protocol.steps[idx]; if (s) speak(`${s.title}. ${s.detail}`); };
  const addNote = () => { if (noteInput.trim()) { setNotes((n) => [...n, noteInput.trim()]); setNoteInput(""); } };

  // Dynamic risk based on condition buttons
  const dynamicRisk = useMemo(() => {
    let r = protocol.riskScore;
    if (breathing === false) r = Math.min(10, r + 2);
    if (conscious === false) r = Math.min(10, r + 1);
    if (bleedingLevel === "severe") r = Math.min(10, r + 2);
    return r;
  }, [protocol.riskScore, breathing, conscious, bleedingLevel]);

  if (cprActive) return <CprMode onExit={() => setCprActive(false)} />;

  const step = protocol.steps[stepIdx];
  const nextStep = protocol.steps[stepIdx + 1];
  const progress = ((stepIdx + 1) / protocol.steps.length) * 100;
  const completedCritical = protocol.steps.filter((s, i) => i <= stepIdx && s.isCritical).length;
  const totalCritical = protocol.steps.filter((s) => s.isCritical).length;
  const reassuranceIdx = Math.min(Math.floor((stepIdx / protocol.steps.length) * REASSURANCE_MESSAGES.length), REASSURANCE_MESSAGES.length - 1);
  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-4">
        {/* Back + Risk Badge */}
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => navigate({ to: "/" })} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t("guide.back")}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setFocusMode(!focusMode)} className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition ${focusMode ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:bg-accent"}`}>
              {focusMode ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {focusMode ? "Focus" : "Full"}
            </button>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold tracking-wider ${u.className}`}>
              <AlertTriangle className="h-3.5 w-3.5" /> {u.label} • {t("guide.risk")} {dynamicRisk}/10
            </span>
          </div>
        </div>

        {/* Victim Status Bar */}
        {!focusMode && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-bold text-muted-foreground mr-1">STATUS:</span>
            <StatusPill label="Breathing" value={breathing === null ? "?" : breathing ? "Yes" : "No"} color={breathing === false ? "critical" : breathing ? "success" : "muted"} />
            <StatusPill label="Conscious" value={conscious === null ? "?" : conscious ? "Yes" : "No"} color={conscious === false ? "critical" : conscious ? "success" : "muted"} />
            <StatusPill label="Bleeding" value={bleedingLevel} color={bleedingLevel === "severe" ? "critical" : bleedingLevel === "minor" ? "warning" : "success"} />
          </div>
        )}

        {/* Protocol Header + Confidence */}
        <div className="rounded-2xl border-l-4 border-primary bg-card p-5">
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold tracking-[0.2em] text-muted-foreground">{t("guide.protocol")}</div>
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              <Gauge className="h-3 w-3" /> {protocol.confidence}% confidence
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{protocol.title}</h1>
          <p className="mt-2 text-base text-muted-foreground">{protocol.summary}</p>
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{t("guide.step")} {stepIdx + 1} {t("guide.of")} {protocol.steps.length}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {totalCritical > 0 && (
            <div className="mt-2 text-xs font-semibold text-coral">
              ⚡ {completedCritical}/{totalCritical} critical actions completed ({Math.round((completedCritical / totalCritical) * 100)}%)
            </div>
          )}
        </div>

        {q && !focusMode && <AITriageInsight situationText={q} />}

        {/* Quick Condition Buttons */}
        {!focusMode && (
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Not breathing", action: () => { setBreathing(false); }, color: "border-critical/40 text-critical hover:bg-critical/10" },
              { label: "Started breathing", action: () => { setBreathing(true); }, color: "border-success/40 text-success hover:bg-success/10" },
              { label: "Still unconscious", action: () => { setConscious(false); }, color: "border-warning/40 text-warning hover:bg-warning/10" },
              { label: "Conscious now", action: () => { setConscious(true); }, color: "border-success/40 text-success hover:bg-success/10" },
              { label: "Bleeding increased", action: () => { setBleedingLevel("severe"); }, color: "border-critical/40 text-critical hover:bg-critical/10" },
              { label: "Bleeding controlled", action: () => { setBleedingLevel("minor"); }, color: "border-success/40 text-success hover:bg-success/10" },
            ].map((btn) => (
              <button key={btn.label} onClick={btn.action} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${btn.color}`}>
                {btn.label}
              </button>
            ))}
          </div>
        )}

        {/* Step Card */}
        {step && (
          <div className={`rounded-2xl border bg-card p-6 shadow-lg ${step.isCritical ? "border-critical/50 ring-1 ring-critical/20" : "border-border"}`}>
            {step.isCritical && (
              <div className="mb-3 flex items-center gap-2 rounded-lg bg-critical/10 px-3 py-1.5 text-xs font-bold text-critical animate-pulse">
                <Zap className="h-3.5 w-3.5" /> CRITICAL STEP — Do not skip
              </div>
            )}
            <div className="flex items-start gap-4">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-2xl ${step.isCritical ? "bg-critical/15" : "bg-coral/15"}`}>
                {step.icon || (stepIdx + 1)}
              </span>
              <div className="flex-1">
                <h2 className="text-xl font-bold sm:text-2xl">{step.title}</h2>
                <p className="mt-2 text-base leading-relaxed text-foreground/90 sm:text-lg">{step.detail}</p>
                {/* Why this step matters */}
                <div className="mt-3 rounded-lg bg-primary/5 p-3">
                  <div className="text-xs font-bold text-primary mb-1">💡 Why this step matters</div>
                  <p className="text-sm text-muted-foreground">{step.why}</p>
                </div>
                {/* Risk dropdown */}
                <button onClick={() => setExpandedRisk(!expandedRisk)} className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-coral hover:text-coral/80 transition">
                  {expandedRisk ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  What could go wrong if skipped
                </button>
                {expandedRisk && (
                  <div className="mt-2 rounded-lg bg-critical/5 border border-critical/20 p-3">
                    <p className="text-sm text-foreground/80">{step.riskIfSkipped}</p>
                  </div>
                )}
              </div>
            </div>
            {/* Step Timer */}
            <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" /> Est: ~{step.estimatedSeconds < 60 ? `${step.estimatedSeconds}s` : `${Math.ceil(step.estimatedSeconds / 60)} min`}
              </div>
              {stepTimerActive ? (
                <span className="flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-bold text-warning animate-pulse">
                  <TimerIcon className="h-3.5 w-3.5" /> {fmtTime(stepTimerRemaining)}
                </span>
              ) : (
                <button onClick={startStepTimer} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent">
                  <TimerIcon className="h-3.5 w-3.5" /> Start timer
                </button>
              )}
              <button onClick={() => speakStep(stepIdx)} className="ml-auto grid h-8 w-8 place-items-center rounded-full border border-border hover:bg-accent" title="Read step aloud">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              </button>
              <button onClick={() => speakStep(stepIdx)} className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:bg-accent">
                <RotateCcw className="h-3.5 w-3.5" /> Repeat
              </button>
            </div>
            {/* Nav buttons */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <button onClick={() => { setStepIdx((i) => Math.max(0, i - 1)); setExpandedRisk(false); setStepTimerActive(false); }} disabled={stepIdx === 0} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-40">
                {t("guide.previous")}
              </button>
              <button onClick={() => setVoiceOn((v) => !v)} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold">
                {voiceOn ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4" />}
                {voiceOn ? t("guide.voiceOn") : t("guide.voiceOff")}
              </button>
              <button onClick={() => { setStepIdx((i) => Math.min(protocol.steps.length - 1, i + 1)); setExpandedRisk(false); setStepTimerActive(false); }} disabled={stepIdx >= protocol.steps.length - 1} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-40">
                {t("guide.nextStep")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            {/* Next action preview */}
            {nextStep && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-accent/50 px-4 py-2 text-xs text-muted-foreground">
                <ArrowRight className="h-3 w-3" /> <span className="font-semibold">Next:</span> {nextStep.title}
              </div>
            )}
          </div>
        )}

        {protocol.timers?.map((tm) => (<CountdownTimer key={tm.label} label={tm.label} duration={tm.duration} />))}

        {protocol.cprMode && (
          <button onClick={() => setCprActive(true)} className="flex items-center justify-center gap-3 rounded-2xl border-l-4 border-critical bg-card p-5 text-left transition hover:bg-accent">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-critical/15 text-critical"><HeartPulse className="h-6 w-6" /></span>
            <div className="flex-1">
              <div className="font-bold">{t("guide.enterCpr")}</div>
              <div className="text-sm text-muted-foreground">{t("guide.cprDesc")}</div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </button>
        )}

        {/* DO NOT section */}
        <div className="rounded-2xl border-l-4 border-critical bg-critical/5 p-5">
          <div className="mb-3 flex items-center gap-2 text-critical"><Ban className="h-5 w-5" /><span className="text-sm font-bold tracking-wider">{t("guide.doNot")}</span></div>
          <ul className="grid gap-2">
            {protocol.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/90"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-critical" />{w}</li>
            ))}
          </ul>
        </div>

        {/* Quick Notes */}
        {!focusMode && (
          <div className="rounded-2xl border border-border bg-card p-5">
            <button onClick={() => setShowNotes(!showNotes)} className="flex w-full items-center gap-2 text-sm font-bold">
              <StickyNote className="h-4 w-4 text-warning" /> Quick Notes ({notes.length})
              {showNotes ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />}
            </button>
            {showNotes && (
              <div className="mt-3 grid gap-2">
                <div className="flex gap-2">
                  <input value={noteInput} onChange={(e) => setNoteInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Add a quick note..." className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none" />
                  <button onClick={addNote} disabled={!noteInput.trim()} className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-40">Add</button>
                </div>
                {notes.map((n, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm">
                    <span className="text-xs text-muted-foreground">{i + 1}.</span> {n}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!focusMode && <AIChatPanel protocolTitle={protocol.title} protocolSummary={protocol.summary} />}
      </div>

      {/* Sidebar */}
      <aside className="grid h-fit gap-4 lg:sticky lg:top-24">
        <button onClick={callEmergency} className="animate-pulse-emergency flex w-full items-center justify-center gap-3 rounded-2xl bg-critical px-6 py-5 text-lg font-black tracking-wider text-critical-foreground shadow-xl">
          <Phone className="h-5 w-5" /> {t("guide.call112")}
        </button>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-success"><ShieldCheck className="h-4 w-4" /><span className="text-xs font-bold tracking-wider">{t("guide.reassurance")}</span></div>
          <p className="text-sm text-foreground/90">{REASSURANCE_MESSAGES[reassuranceIdx]}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center gap-2 text-muted-foreground"><MessageCircle className="h-4 w-4" /><span className="text-xs font-bold tracking-wider">{t("guide.switchProtocol")}</span></div>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_CATEGORIES.map((qc) => (
              <button key={qc.id} onClick={() => navigate({ to: "/guidance", search: { c: qc.id } })} className={`rounded-lg border border-border px-3 py-2 text-xs font-semibold transition hover:bg-accent ${qc.id === protocol.category ? "bg-primary/15 text-primary border-primary/40" : ""}`}>
                {CATEGORY_KEYS[qc.id] ? t(CATEGORY_KEYS[qc.id]) : qc.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground"><TimerIcon className="h-4 w-4" /><span className="text-xs font-bold tracking-wider">{t("guide.disclaimer")}</span></div>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("guide.disclaimerText")}</p>
        </div>
      </aside>
    </div>
  );
}

// ─── Status Pill Component ──────────────────────────────────────────
function StatusPill({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    critical: "bg-critical/15 text-critical border-critical/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    success: "bg-success/15 text-success border-success/30",
    muted: "bg-accent text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${colors[color] || colors.muted}`}>
      {label}: <strong>{value}</strong>
    </span>
  );
}
