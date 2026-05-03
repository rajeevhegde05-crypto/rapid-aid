import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Bell, AlertTriangle, ShieldCheck, MapPin, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { isFirebaseConfigured, subscribeToAlerts, type AlertData } from "@/lib/firebase";

export const Route = createFileRoute("/alerts")({
  component: () => <AppShell><Alerts /></AppShell>,
});

// Default alerts when Firebase is not configured
const DEFAULT_ALERTS = [
  { id: "1", level: "high" as const, titleKey: "alert.weatherTitle", bodyKey: "alert.weatherBody", time: "12 min ago" },
  { id: "2", level: "info" as const, titleKey: "alert.aedTitle", bodyKey: "alert.aedBody", time: "1 hr ago" },
  { id: "3", level: "ok" as const, titleKey: "alert.systemTitle", bodyKey: "alert.systemBody", time: "Today" },
];

const LEVEL_CONFIG: Record<string, { Icon: any; color: string; border: string }> = {
  high: { Icon: AlertTriangle, color: "text-coral", border: "border-l-coral" },
  info: { Icon: MapPin, color: "text-primary", border: "border-l-primary" },
  ok: { Icon: ShieldCheck, color: "text-success", border: "border-l-success" },
};

function Alerts() {
  const { t } = useI18n();
  const [firebaseAlerts, setFirebaseAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] = useState(false);
  const fbConfigured = isFirebaseConfigured();

  useEffect(() => {
    if (!fbConfigured) {
      setLoading(false);
      return;
    }
    const unsub = subscribeToAlerts(
      (alerts) => {
        setFirebaseAlerts(alerts);
        setFirestoreError(false);
        setLoading(false);
      },
      (err) => {
        console.error("Alerts subscription error:", err);
        setFirestoreError(true);
        setLoading(false);
      }
    );
    return unsub;
  }, [fbConfigured]);

  // Format timestamp
  const formatTime = (ts: any) => {
    if (!ts?.toDate) return "";
    const d = ts.toDate();
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hr ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-3xl font-bold"><Bell className="h-7 w-7 text-primary" /> {t("alert.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("alert.desc")}</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {!loading && (
        <div className="grid gap-3">
          {/* Show Firebase alerts if configured and working, otherwise show defaults */}
          {fbConfigured && !firestoreError ? (
            firebaseAlerts.length > 0 ? (
              firebaseAlerts.map((a) => {
                const cfg = LEVEL_CONFIG[a.level] || LEVEL_CONFIG.info;
                return (
                  <div key={a.id} className={`flex items-start gap-4 rounded-2xl border-l-4 ${cfg.border} bg-card p-5`}>
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent ${cfg.color}`}>
                      <cfg.Icon className="h-5 w-5" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-base font-bold">{a.title}</h3>
                        <span className="text-xs text-muted-foreground">{formatTime(a.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                {t("alert.noAlerts")}
              </div>
            )
          ) : (
            DEFAULT_ALERTS.map((a) => {
              const cfg = LEVEL_CONFIG[a.level] || LEVEL_CONFIG.info;
              return (
                <div key={a.id} className={`flex items-start gap-4 rounded-2xl border-l-4 ${cfg.border} bg-card p-5`}>
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent ${cfg.color}`}>
                    <cfg.Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-base font-bold">{t(a.titleKey)}</h3>
                      <span className="text-xs text-muted-foreground">{a.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{t(a.bodyKey)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
