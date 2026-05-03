import { Link, useLocation } from "@tanstack/react-router";
import { Asterisk, BookOpen, Bell, Settings, UserCircle2, Plus, LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/" as const, label: "DASHBOARD", icon: LayoutDashboard },
  { to: "/guidance" as const, label: "GUIDANCE", icon: Asterisk },
  { to: "/knowledge" as const, label: "KNOWLEDGE", icon: BookOpen },
  { to: "/alerts" as const, label: "ALERTS", icon: Bell },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-wider">
            <Plus className="h-5 w-5 text-primary" />
            <span className="text-sm sm:text-base">RESPONDER AI</span>
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
            <button className="rounded-full p-2 text-primary hover:bg-accent" aria-label="Profile">
              <UserCircle2 className="h-5 w-5" />
            </button>
            <button className="rounded-full p-2 text-primary hover:bg-accent" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </button>
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
        ⚠ This is not a substitute for professional medical help. In a real emergency, call your local emergency number.
      </p>
    </div>
  );
}
