import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { QUICK_CATEGORIES } from "@/lib/triage";
import {
  Search, Droplet, Brain, FlaskConical, HeartPulse, Wind, WifiOff,
  Wifi, AlertTriangle, Phone, BookOpen, Shield
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/knowledge")({
  component: () => <AppShell><Knowledge /></AppShell>,
});

function Knowledge() {
  const [q, setQ] = useState("");
  const { t } = useI18n();

  const CATS = [
    { id: "bleeding", titleKey: "know.severeTrauma", descKey: "know.severeTraumaDesc", count: 12, Icon: Droplet, color: "text-coral", border: "border-l-coral" },
    { id: "stroke", titleKey: "know.neurological", descKey: "know.neurologicalDesc", count: 8, Icon: Brain, color: "text-warning", border: "border-l-warning" },
    { id: "general", titleKey: "know.toxicology", descKey: "know.toxicologyDesc", count: 15, Icon: FlaskConical, color: "text-primary", border: "border-l-primary" },
    { id: "cpr", titleKey: "know.cardiacEvents", descKey: "know.cardiacEventsDesc", count: 6, Icon: HeartPulse, color: "text-critical", border: "border-l-critical" },
    { id: "allergic", titleKey: "know.respiratory", descKey: "know.respiratoryDesc", count: 9, Icon: Wind, color: "text-primary", border: "border-l-primary" },
    { id: "burns", titleKey: "know.thermal", descKey: "know.thermalDesc", count: 7, Icon: HeartPulse, color: "text-warning", border: "border-l-warning" },
  ] as const;

  const CATEGORY_KEYS: Record<string, string> = {
    cpr: "cat.cpr",
    choking: "cat.choking",
    bleeding: "cat.bleeding",
    burns: "cat.burns",
    fracture: "cat.fracture",
    allergic: "cat.allergic",
  };

  const filtered = CATS.filter((c) =>
    !q || t(c.titleKey).toLowerCase().includes(q.toLowerCase()) || t(c.descKey).toLowerCase().includes(q.toLowerCase())
  );

  const EMERGENCY_NUMBERS = [
    { label: "Emergency (Police/Fire/Ambulance)", num: "112" },
    { label: "Disaster Helpline", num: "1078" },
    { label: "Women Helpline", num: "1091" },
    { label: "Child Helpline", num: "1098" },
    { label: "Poison Control", num: "1800-11-6117" },
  ];

  const FIRST_AID_TIPS = [
    { key: "know.firstAidBleeding", icon: "🩸" },
    { key: "know.firstAidCPR", icon: "💓" },
    { key: "know.firstAidChoking", icon: "🫁" },
    { key: "know.firstAidBurns", icon: "🔥" },
    { key: "know.firstAidFracture", icon: "🦴" },
    { key: "know.firstAidSeizure", icon: "⚡" },
    { key: "know.firstAidShock", icon: "🩺" },
  ];

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t("know.title")}</h1>
          <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-warning">
            <WifiOff className="h-4 w-4" /> {t("know.offlineReady")}
          </p>
        </div>
      </div>

      {/* Internet Required Banner */}
      <div className="rounded-2xl border border-warning/30 bg-warning/5 p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-warning/15 text-warning">
            <Wifi className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-warning">{t("know.offlineBanner")}</h3>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {t("know.offlineBannerDesc")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={t("know.searchPlaceholder")}
          className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Link
            key={c.titleKey}
            to="/guidance"
            search={{ c: c.id as never }}
            className={`group rounded-2xl border-l-4 ${c.border} bg-card p-5 transition hover:bg-accent`}
          >
            <span className={`mb-3 inline-grid h-10 w-10 place-items-center rounded-full bg-accent ${c.color}`}>
              <c.Icon className="h-5 w-5" />
            </span>
            <h3 className="text-xl font-bold">{t(c.titleKey)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(c.descKey)}</p>
            <div className="mt-4 text-xs font-bold tracking-wider text-primary">{c.count} {t("know.protocols")} →</div>
          </Link>
        ))}
      </div>

      {/* Essential Emergency Numbers (offline accessible) */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Phone className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">{t("know.essentialTitle")}</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{t("know.essentialDesc")}</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {EMERGENCY_NUMBERS.map((en) => (
            <a
              key={en.num}
              href={`tel:${en.num}`}
              className="flex items-center justify-between rounded-xl border border-border bg-background p-3 transition hover:bg-accent"
            >
              <span className="text-sm font-medium">{en.label}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
                <Phone className="h-3 w-3" /> {en.num}
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* Basic First Aid Quick Reference (offline accessible) */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-success" />
          <h2 className="text-lg font-bold">{t("know.basicFirstAid")}</h2>
        </div>
        <div className="grid gap-3">
          {FIRST_AID_TIPS.map(({ key, icon }) => (
            <div
              key={key}
              className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
            >
              <span className="text-xl">{icon}</span>
              <p className="text-sm leading-relaxed text-foreground/90">{t(key)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">{t("know.frequentlyAccessed")}</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to="/guidance"
              search={{ c: c.id }}
              className="rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-accent"
            >
              {CATEGORY_KEYS[c.id] ? t(CATEGORY_KEYS[c.id]) : c.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
