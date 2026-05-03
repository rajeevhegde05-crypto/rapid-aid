import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Shield, LogIn, LogOut, Plus, Pencil, Trash2, X, Save, Loader2,
  AlertTriangle, MapPin, ShieldCheck, Bell
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  useAuth,
  isFirebaseConfigured,
  subscribeToAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  type AlertData,
} from "@/lib/firebase";

export const Route = createFileRoute("/admin")({
  component: () => <AppShell><AdminPage /></AppShell>,
});

function AdminPage() {
  const { t } = useI18n();
  const { user, loading: authLoading, isAdminUser, signIn, signInWithEmail, signUpWithEmail, signOut, authError } = useAuth();
  const fbConfigured = isFirebaseConfigured();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleEmailAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) {
      signUpWithEmail(email, password);
    } else {
      signInWithEmail(email, password);
    }
  };

  // If Firebase is not configured, show setup instructions
  if (!fbConfigured) {
    return (
      <div className="grid gap-6">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
        </div>
        <div className="rounded-2xl border border-warning/30 bg-warning/5 p-6">
          <h2 className="mb-3 text-lg font-bold text-warning">Firebase Setup Required</h2>
          <p className="mb-4 text-sm text-muted-foreground leading-relaxed">
            To use the admin dashboard, you need to configure Firebase. Add the following variables to your <code className="rounded bg-accent px-1.5 py-0.5 text-xs font-mono">.env</code> file:
          </p>
          <pre className="overflow-x-auto rounded-xl bg-background p-4 text-xs text-muted-foreground">
{`VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_ADMIN_EMAIL=your-admin@gmail.com`}
          </pre>
          <p className="mt-4 text-xs text-muted-foreground">
            1. Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener" className="text-primary underline">Firebase Console</a><br/>
            2. Create a project → Enable Authentication (Google provider)<br/>
            3. Enable Cloud Firestore<br/>
            4. Copy your web app config values into <code className="rounded bg-accent px-1 py-0.5 text-xs font-mono">.env</code>
          </p>
        </div>
      </div>
    );
  }

  // Loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="grid gap-6">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl border border-border bg-card p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/15 text-primary">
              <LogIn className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">{t("admin.signInRequired")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Only authorized administrators can manage alerts.
            </p>
          </div>

          {authError && (
            <div className="rounded-xl border border-critical/30 bg-critical/5 p-4 text-left">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-critical" />
                <p className="text-sm text-foreground/80">{authError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-muted-foreground">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-muted-foreground">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition"
            >
              {isSignUp ? "Create Password & Sign Up" : "Sign In with Email"}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-primary hover:underline"
            >
              {isSignUp ? "Already have an account? Sign in" : "Need to create a password? Sign up"}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <button
            onClick={signIn}
            className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-6 py-3 text-sm font-bold transition hover:bg-accent"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
        </div>
      </div>
    );
  }

  // Signed in but not admin
  if (!isAdminUser) {
    return (
      <div className="grid gap-6">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
        </div>
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-2xl border border-critical/30 bg-critical/5 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-critical" />
          <h2 className="text-xl font-bold">{t("admin.notAuthorized")}</h2>
          <p className="text-sm text-muted-foreground">Signed in as: {user.email}</p>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            <LogOut className="h-4 w-4" /> {t("admin.signOut")}
          </button>
        </div>
      </div>
    );
  }

  // Admin dashboard
  return <AdminDashboard />;
}

// ─── Admin Dashboard ────────────────────────────────────────────────
function AdminDashboard() {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AlertData | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formLevel, setFormLevel] = useState<"high" | "info" | "ok">("info");

  useEffect(() => {
    const unsub = subscribeToAlerts(
      (a) => { setAlerts(a); setLoading(false); },
      (err) => { console.error("Admin alerts error:", err); setLoading(false); }
    );
    return unsub;
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormTitle("");
    setFormBody("");
    setFormLevel("info");
    setCreating(true);
  };

  const openEdit = (alert: AlertData) => {
    setCreating(false);
    setEditing(alert);
    setFormTitle(alert.title);
    setFormBody(alert.body);
    setFormLevel(alert.level);
  };

  const closeForm = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formBody.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateAlert(editing.id, { title: formTitle, body: formBody, level: formLevel });
      } else {
        await createAlert({ title: formTitle, body: formBody, level: formLevel });
      }
      closeForm();
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("admin.confirmDelete"))) return;
    try {
      await deleteAlert(id);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const LEVEL_ICONS: Record<string, any> = {
    high: AlertTriangle,
    info: MapPin,
    ok: ShieldCheck,
  };

  const LEVEL_COLORS: Record<string, string> = {
    high: "text-coral",
    info: "text-primary",
    ok: "text-success",
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> {t("admin.addAlert")}
          </button>
          <button
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold hover:bg-accent"
          >
            <LogOut className="h-4 w-4" /> {t("admin.signOut")}
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(creating || editing) && (
        <div className="rounded-2xl border border-primary/30 bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              {editing ? t("admin.editAlert") : t("admin.addAlert")}
            </h2>
            <button onClick={closeForm} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-muted-foreground">{t("admin.alertTitle")}</label>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
                placeholder="Alert title..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-muted-foreground">{t("admin.alertBody")}</label>
              <textarea
                value={formBody}
                onChange={(e) => setFormBody(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary resize-none"
                placeholder="Alert description..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold tracking-wider text-muted-foreground">{t("admin.alertLevel")}</label>
              <div className="flex gap-2">
                {(["high", "info", "ok"] as const).map((lvl) => {
                  const Icon = LEVEL_ICONS[lvl];
                  return (
                    <button
                      key={lvl}
                      onClick={() => setFormLevel(lvl)}
                      className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                        formLevel === lvl
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-4 w-4" /> {lvl.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={closeForm}
                className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:bg-accent"
              >
                {t("admin.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formTitle.trim() || !formBody.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("admin.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert List */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Bell className="h-5 w-5 text-primary" /> {t("admin.manageAlerts")}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No alerts yet. Click "Add Alert" to create one.
          </div>
        ) : (
          <div className="grid gap-3">
            {alerts.map((a) => {
              const Icon = LEVEL_ICONS[a.level] || LEVEL_ICONS.info;
              const color = LEVEL_COLORS[a.level] || LEVEL_COLORS.info;
              return (
                <div key={a.id} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent ${color}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <h3 className="text-base font-bold">{a.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(a)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-accent"
                      title={t("admin.editAlert")}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-critical/30 hover:bg-critical/10"
                      title={t("admin.deleteAlert")}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-critical" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
