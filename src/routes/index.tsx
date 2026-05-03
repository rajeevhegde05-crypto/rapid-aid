import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import {
  ShieldAlert,
  Flame,
  Stethoscope,
  LifeBuoy,
  Mic,
  Send,
  CheckCircle2,
  HeartPulse,
  Wind,
  Droplets,
  Bone,
  Syringe,
  Phone,
  MapPin,
  Loader2,
  Navigation,
  Building2,
  Siren,
  Cross,
  AlertTriangle,
} from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { QUICK_CATEGORIES, type Category } from "@/lib/triage";
import { useVoiceInput } from "@/lib/voice";
import { useI18n } from "@/lib/i18n";
import { getCurrentPosition, findNearbyFacilities, type Facility } from "@/lib/geo";

export const Route = createFileRoute("/")({
  component: IndexPage,
});

const PROTOCOL_ICONS: Record<string, any> = {
  "heart-pulse": HeartPulse,
  "wind": Wind,
  "droplet": Droplets,
  "flame": Flame,
  "bone": Bone,
  "syringe": Syringe,
};

const CATEGORY_KEYS: Record<string, string> = {
  cpr: "cat.cpr",
  choking: "cat.choking",
  bleeding: "cat.bleeding",
  burns: "cat.burns",
  fracture: "cat.fracture",
  allergic: "cat.allergic",
};

const FACILITY_ICONS: Record<string, any> = {
  police: ShieldAlert,
  fire: Flame,
  hospital: Cross,
};

const FACILITY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  police: { text: "text-primary", bg: "bg-primary/15", border: "border-l-primary" },
  fire: { text: "text-warning", bg: "bg-warning/15", border: "border-l-warning" },
  hospital: { text: "text-coral", bg: "bg-coral/15", border: "border-l-coral" },
};

function IndexPage() {
  const [role, setRole] = useState<"civilian" | "admin" | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("rapid-aid-role") as any || null;
    }
    return null;
  });
  const navigate = useNavigate();

  const pickRole = (r: "civilian" | "admin") => {
    if (typeof window !== "undefined") sessionStorage.setItem("rapid-aid-role", r);
    if (r === "admin") {
      navigate({ to: "/admin" });
    } else {
      setRole(r);
    }
  };

  if (!role) {
    return <RoleSplash onSelect={pickRole} />;
  }

  return (
    <AppShell>
      <Dashboard />
    </AppShell>
  );
}

// ─── Role Selection Splash Screen ───────────────────────────────────
function RoleSplash({ onSelect }: { onSelect: (role: "civilian" | "admin") => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        {/* Brand */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Cross className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">RAPID AID</h1>
          <p className="mt-2 text-base text-muted-foreground">Emergency First Response Guide</p>
        </div>

        {/* Role Selection */}
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-foreground">How would you like to continue?</h2>
          <p className="mt-1 text-sm text-muted-foreground">Select your role to get started</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Civilian */}
          <button
            onClick={() => onSelect("civilian")}
            className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border bg-card p-8 text-center transition hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary transition group-hover:bg-primary/25">
              <ShieldAlert className="h-8 w-8" />
            </span>
            <div>
              <div className="text-xl font-bold text-foreground">Civilian</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Access emergency protocols, first-aid guidance, and nearby facilities
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
              No login required →
            </span>
          </button>

          {/* Admin */}
          <button
            onClick={() => onSelect("admin")}
            className="group flex flex-col items-center gap-4 rounded-2xl border-2 border-border bg-card p-8 text-center transition hover:border-warning hover:bg-warning/5 active:scale-[0.98]"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-warning/15 text-warning transition group-hover:bg-warning/25">
              <ShieldAlert className="h-8 w-8" />
            </span>
            <div>
              <div className="text-xl font-bold text-foreground">Admin</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage alerts, configure the platform, and monitor system status
              </p>
            </div>
            <span className="rounded-full bg-warning/10 px-4 py-1.5 text-xs font-bold text-warning">
              Google sign-in required →
            </span>
          </button>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          ⚠ This is not a substitute for professional medical help.<br />
          In a real emergency, call your local emergency number.
        </p>
      </div>
    </div>
  );
}

function Dashboard() {
  const [text, setText] = useState("");
  const navigate = useNavigate();
  const { listening, start, supported } = useVoiceInput((t) => setText((p) => (p ? p + " " : "") + t));
  const { t } = useI18n();

  const submit = (input: string, category?: Category) => {
    const params = new URLSearchParams();
    if (input) params.set("q", input);
    if (category) params.set("c", category);
    navigate({ to: "/guidance", search: Object.fromEntries(params) as never });
  };

  const callEmergency = () => {
    if (typeof window !== "undefined") window.location.href = "tel:112";
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border-l-4 border-primary bg-card p-5 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t("dash.systemReadiness")}</h2>
            <p className="text-sm text-muted-foreground">{t("dash.systemDesc")}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" /> {t("dash.optimal")}
          </span>
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 py-4">
        <button
          onClick={callEmergency}
          className="animate-pulse-emergency relative w-full max-w-2xl rounded-full bg-critical px-10 py-10 text-critical-foreground shadow-2xl transition active:scale-[0.98]"
        >
          <div className="text-sm font-bold tracking-[0.3em] opacity-90">{t("dash.sos")}</div>
          <div className="text-3xl font-black tracking-wider sm:text-5xl">{t("dash.callEmergency")}</div>
        </button>
        <p className="text-sm text-muted-foreground">{t("dash.tapImmediately")}</p>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold">{t("dash.quickProtocols")}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {QUICK_CATEGORIES.map((c) => {
            const Icon = PROTOCOL_ICONS[c.icon] || Stethoscope;
            const translatedLabel = t(CATEGORY_KEYS[c.id] || c.label);
            return (
              <button
                key={c.id}
                onClick={() => submit(c.label, c.id)}
                className="flex flex-col items-center gap-2 rounded-xl border-l-4 border-coral bg-card p-4 text-center transition hover:bg-accent active:scale-95"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-coral/15 text-coral">
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-sm font-semibold">{translatedLabel}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Emergency Contacts */}
      <EmergencyContacts />

      {/* Nearby Facilities (GPS) */}
      <NearbyFacilities />

      <section className="rounded-2xl border border-border bg-card p-5">
        <label className="mb-3 block text-xs font-bold tracking-[0.2em] text-muted-foreground">{t("dash.describeSituation")}</label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && text.trim() && submit(text)}
            placeholder={t("dash.typePlaceholder")}
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
          {t("dash.tryPrefix")} "<button onClick={() => submit("Person not breathing")} className="underline">{t("dash.tryNotBreathing")}</button>" •
          " <button onClick={() => submit("Severe bleeding from arm")} className="underline">{t("dash.trySevereBleeding")}</button>"
        </p>
      </section>
    </div>
  );
}

// ─── Emergency Contacts Section ─────────────────────────────────────
function EmergencyContacts() {
  const { t } = useI18n();

  const contacts = [
    { key: "police", Icon: ShieldAlert, color: "text-primary", bg: "bg-primary/15", border: "border-l-primary" },
    { key: "fire", Icon: Flame, color: "text-warning", bg: "bg-warning/15", border: "border-l-warning" },
    { key: "ambulance", Icon: Siren, color: "text-coral", bg: "bg-coral/15", border: "border-l-coral" },
    { key: "disaster", Icon: AlertTriangle, color: "text-success", bg: "bg-success/15", border: "border-l-success" },
  ];

  return (
    <section>
      <h3 className="mb-3 text-lg font-semibold">{t("dash.emergencyContacts")}</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {contacts.map(({ key, Icon, color, bg, border }) => {
          const num = t(`contact.${key}Num`);
          return (
            <div
              key={key}
              className={`flex items-start gap-3 rounded-xl border-l-4 ${border} bg-card p-4`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${bg} ${color}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold">{t(`contact.${key}`)}</div>
                <div className="text-xs text-muted-foreground">{t(`contact.${key}Desc`)}</div>
                <a
                  href={`tel:${num}`}
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full ${bg} px-3 py-1 text-xs font-bold ${color} transition hover:opacity-80`}
                >
                  <Phone className="h-3 w-3" />
                  {num}
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Nearby Facilities Section (GPS) ────────────────────────────────
function NearbyFacilities() {
  const { t } = useI18n();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = async () => {
    setLoading(true);
    setError(null);
    try {
      const pos = await getCurrentPosition();
      const results = await findNearbyFacilities(pos.coords.latitude, pos.coords.longitude);
      setFacilities(results);
      setHasSearched(true);
    } catch (err: any) {
      if (err?.code === 1) {
        setError(t("dash.locationDenied"));
      } else {
        setError(err.message || "Failed to find nearby facilities");
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on mount
  useEffect(() => {
    if (!hasSearched && typeof navigator !== "undefined" && navigator.geolocation) {
      search();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("dash.nearbyFacilities")}</h3>
        <button
          onClick={search}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-accent"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
          {loading ? t("dash.locating") : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <MapPin className="mr-2 inline h-4 w-4 text-warning" />
          {error}
        </div>
      )}

      {!error && facilities.length === 0 && !loading && hasSearched && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {t("dash.noFacilities")}
        </div>
      )}

      {facilities.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((f, i) => {
            const Icon = FACILITY_ICONS[f.type] || Building2;
            const colors = FACILITY_COLORS[f.type] || FACILITY_COLORS.hospital;
            return (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl border-l-4 ${colors.border} bg-card p-4`}
              >
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${colors.bg} ${colors.text}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate">{f.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {f.distance.toFixed(1)} {t("dash.km")}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {f.phone && (
                      <a
                        href={`tel:${f.phone}`}
                        className={`inline-flex items-center gap-1 rounded-full ${colors.bg} px-2.5 py-1 text-[11px] font-bold ${colors.text}`}
                      >
                        <Phone className="h-3 w-3" /> {t("dash.call")}
                      </a>
                    )}
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-foreground/70 hover:text-foreground"
                    >
                      <MapPin className="h-3 w-3" /> {t("dash.viewOnMap")}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// re-export for convenience
export { useMemo };
