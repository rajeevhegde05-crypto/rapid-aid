import { Link, useLocation } from "@tanstack/react-router";
import { Asterisk, BookOpen, Bell, Plus, LayoutDashboard, Globe, ChevronDown, Loader2, Shield } from "lucide-react";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import { useAuth, isFirebaseConfigured } from "@/lib/firebase";

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const { isAdminUser } = useAuth();

  const NAV = [
    { to: "/" as const, label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/guidance" as const, label: t("nav.guidance"), icon: Asterisk },
    { to: "/knowledge" as const, label: t("nav.knowledge"), icon: BookOpen },
    { to: "/alerts" as const, label: t("nav.alerts"), icon: Bell },
    ...(isAdminUser ? [{ to: "/admin" as const, label: t("nav.admin"), icon: Shield }] : []),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-wider">
            <Plus className="h-5 w-5 text-primary" />
            <span className="text-sm sm:text-base">{t("nav.brand")}</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold tracking-wide transition ${
                    active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSelector />
          </div>
        </div>
        <nav className="flex items-center gap-1 overflow-x-auto border-t border-border px-4 py-2 md:hidden">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap ${
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <p className="mx-auto max-w-7xl px-4 pb-8 text-center text-xs text-muted-foreground sm:px-6">
        {t("footer.disclaimer")}
      </p>
    </div>
  );
}

// ─── Language Selector Dropdown ─────────────────────────────────────
function LanguageSelector() {
  const { lang, setLang, loading } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGUAGES.find((l) => l.code === lang);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition hover:bg-accent"
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : (
          <Globe className="h-4 w-4 text-primary" />
        )}
        <span className="hidden sm:inline">{current?.flag}</span>
        <span className="text-xs font-semibold">{current?.code.toUpperCase()}</span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          <div className="p-2">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-accent ${
                  lang === l.code ? "bg-primary/10 text-primary font-semibold" : "text-foreground"
                }`}
              >
                <span className="text-lg">{l.flag}</span>
                <span className="flex-1">{l.label}</span>
                {lang === l.code && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
