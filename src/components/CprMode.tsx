import { useEffect, useRef, useState } from "react";
import { Heart, Volume2, VolumeX, Phone, X } from "lucide-react";
import { vibrate } from "@/lib/voice";

const BPM = 110;
const INTERVAL_MS = 60000 / BPM; // ~545ms

export function CprMode({ onExit }: { onExit: () => void }) {
  const [running, setRunning] = useState(true);
  const [audio, setAudio] = useState(true);
  const [count, setCount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const tickRef = useRef<number | null>(null);
  const secRef = useRef<number | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!running) return;
    tickRef.current = window.setInterval(() => {
      setCount((c) => c + 1);
      vibrate(40);
      if (audio) {
        try {
          if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          const ctx = ctxRef.current;
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.frequency.value = 880;
          o.connect(g); g.connect(ctx.destination);
          g.gain.setValueAtTime(0.18, ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
          o.start(); o.stop(ctx.currentTime + 0.08);
        } catch { /* ignore */ }
      }
    }, INTERVAL_MS);
    secRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
      if (secRef.current) window.clearInterval(secRef.current);
    };
  }, [running, audio]);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");
  const callEmergency = () => { if (typeof window !== "undefined") window.location.href = "tel:911"; };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      <div className="flex items-center justify-between border-b border-border px-4 py-4 sm:px-6">
        <div>
          <div className="text-xs font-bold tracking-[0.3em] text-critical">ACTIVE CPR</div>
          <div className="text-sm text-muted-foreground">Follow the rhythm. Do not stop.</div>
        </div>
        <button onClick={onExit} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-accent">
          <span className="inline-flex items-center gap-2"><X className="h-4 w-4" /> Exit CPR</span>
        </button>
      </div>

      <div className="grid flex-1 place-items-center px-4">
        <div className="grid w-full max-w-3xl gap-6">
          <div className="grid gap-3 rounded-3xl border-l-4 border-critical bg-card p-8 text-center">
            <div className="grid place-items-center">
              <Heart
                className="text-critical animate-cpr-pump"
                style={{ width: 160, height: 160, animationDuration: `${INTERVAL_MS * 2}ms` }}
                fill="currentColor"
              />
            </div>
            <div className="text-5xl font-black tabular-nums">{BPM} <span className="text-2xl font-bold text-muted-foreground">BPM</span></div>
            <div className="text-base text-muted-foreground">Push hard and fast</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border-l-4 border-coral bg-card p-5 text-center">
              <div className="text-xs font-bold tracking-wider text-muted-foreground">ELAPSED</div>
              <div className="mt-1 font-mono text-4xl font-bold tabular-nums">{mm}:{ss}</div>
            </div>
            <div className="rounded-2xl border-l-4 border-coral bg-card p-5 text-center">
              <div className="text-xs font-bold tracking-wider text-muted-foreground">COMPRESSIONS</div>
              <div className="mt-1 font-mono text-4xl font-bold tabular-nums">~{count}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setRunning((r) => !r)}
              className="rounded-lg bg-primary px-6 py-3 font-bold text-primary-foreground hover:bg-primary/90"
            >
              {running ? "Pause" : "Resume"}
            </button>
            <button
              onClick={() => setAudio((a) => !a)}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 font-semibold hover:bg-accent"
            >
              {audio ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              {audio ? "Audio cues ON" : "Audio cues OFF"}
            </button>
            <button
              onClick={callEmergency}
              className="inline-flex items-center gap-2 rounded-lg bg-critical px-6 py-3 font-bold text-critical-foreground hover:opacity-95"
            >
              <Phone className="h-4 w-4" /> Call 911
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Compress chest at least 2 inches deep. Allow full recoil between compressions. Continue until help arrives.
          </p>
        </div>
      </div>
    </div>
  );
}
