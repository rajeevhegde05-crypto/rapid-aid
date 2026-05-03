import { useState, useEffect, useCallback } from "react";
import { Brain, Loader2, RefreshCw, Sparkles, AlertTriangle } from "lucide-react";
import { aiTriageAnalysis, isAIAvailable } from "@/lib/ai";
import { useI18n } from "@/lib/i18n";

interface AITriageInsightProps {
  situationText: string;
}

export function AITriageInsight({ situationText }: AITriageInsightProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  const available = isAIAvailable();
  const { t, lang } = useI18n();

  const fetchInsight = useCallback(async () => {
    if (!situationText.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await aiTriageAnalysis(situationText, lang);
      setInsight(result);
      setHasRun(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [situationText, loading, lang]);

  // Auto-fetch on mount if we have situation text
  useEffect(() => {
    if (available && situationText.trim() && !hasRun) {
      fetchInsight();
    }
  }, [available, situationText]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!available || !situationText.trim()) return null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary">
            <Brain className="h-4 w-4" />
          </span>
          <div>
            <span className="text-xs font-bold tracking-[0.15em] text-primary">{t("ai.analysis")}</span>
            <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary/70">
              GPT-4o MINI
            </span>
          </div>
        </div>
        {hasRun && !loading && (
          <button
            onClick={fetchInsight}
            className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            <RefreshCw className="h-3 w-3" /> {t("ai.refresh")}
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">{t("ai.analyzing")}</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-critical/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-critical" />
          <div className="text-sm text-foreground/80">
            {t("ai.unavailable")} <br />
            <span className="text-xs text-muted-foreground">{error}</span>
          </div>
        </div>
      )}

      {insight && !loading && (
        <div className="prose prose-sm max-w-none text-foreground/90">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{insight}</div>
        </div>
      )}

      {!loading && !insight && !error && (
        <button
          onClick={fetchInsight}
          className="flex items-center gap-2 rounded-xl border border-dashed border-primary/30 px-4 py-3 text-sm font-medium text-primary transition hover:bg-primary/5"
        >
          <Sparkles className="h-4 w-4" /> {t("ai.getAnalysis")}
        </button>
      )}
    </div>
  );
}
