import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Bell, AlertTriangle, ShieldCheck, MapPin } from "lucide-react";

export const Route = createFileRoute("/alerts")({
  component: () => <AppShell><Alerts /></AppShell>,
});

const ALERTS = [
  { level: "high", title: "Severe weather warning", body: "Thunderstorms expected in your area. Stay indoors.", time: "12 min ago", Icon: AlertTriangle, color: "text-coral", border: "border-l-coral" },
  { level: "info", title: "Local AED available", body: "Public AED registered 0.3 mi away — Central Park West.", time: "1 hr ago", Icon: MapPin, color: "text-primary", border: "border-l-primary" },
  { level: "ok", title: "System check passed", body: "Offline templates synced. Voice & vibration ready.", time: "Today", Icon: ShieldCheck, color: "text-success", border: "border-l-success" },
];

function Alerts() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold"><Bell className="h-7 w-7 text-primary" /> Alerts</h1>
        <p className="mt-1 text-sm text-muted-foreground">Local incidents, system updates, and helpful nearby resources.</p>
      </div>
      <div className="grid gap-3">
        {ALERTS.map((a, i) => (
          <div key={i} className={`flex items-start gap-4 rounded-2xl border-l-4 ${a.border} bg-card p-5`}>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent ${a.color}`}>
              <a.Icon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-bold">{a.title}</h3>
                <span className="text-xs text-muted-foreground">{a.time}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
