import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, Timer as TimerIcon } from "lucide-react";
import { vibrate } from "@/lib/voice";

export function CountdownTimer({ label, duration }: { label: string; duration: number }) {
  const [remaining, setRemaining] = useState(duration);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(ref.current!);
          setRunning(false);
          vibrate([300, 150, 300]);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (ref.current) window.clearInterval(ref.current); };
  }, [running]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = (1 - remaining / duration) * 100;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <TimerIcon className="h-4 w-4" />
          <span className="text-xs font-bold tracking-wider">{label.toUpperCase()}</span>
        </div>
        <span className="font-mono text-3xl font-bold tabular-nums">{mm}:{ss}</span>
      </div>
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
        >
          {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
        </button>
        <button
          onClick={() => { setRunning(false); setRemaining(duration); }}
          className="flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-accent"
          aria-label="Reset"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
