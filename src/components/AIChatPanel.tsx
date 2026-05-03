import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, Loader2, Sparkles, X, MessageCircle } from "lucide-react";
import { aiProtocolChat, isAIAvailable, type ChatMessage } from "@/lib/ai";
import { useI18n } from "@/lib/i18n";

interface AIChatPanelProps {
  protocolTitle: string;
  protocolSummary: string;
}

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
}

export function AIChatPanel({ protocolTitle, protocolSummary }: AIChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const available = isAIAvailable();
  const { t, lang } = useI18n();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Reset when protocol changes
  useEffect(() => {
    setMessages([]);
  }, [protocolTitle]);

  const sendMessage = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const history: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const reply = await aiProtocolChat(protocolTitle, protocolSummary, history, q, lang);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ AI unavailable: ${err.message}. Please rely on the protocol steps above.` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, protocolTitle, protocolSummary, lang]);

  if (!available) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="group flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-5 transition hover:bg-accent hover:shadow-lg"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary group-hover:from-primary/30">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="flex-1 text-left">
          <div className="text-sm font-bold">{t("ai.askAssistant")}</div>
          <div className="text-xs text-muted-foreground">{t("ai.getPersonalized")}</div>
        </div>
        <MessageCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
      </button>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/10 to-transparent px-5 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="text-sm font-bold">{t("ai.aiAssistant")}</span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary">
            GPT-4o MINI
          </span>
        </div>
        <button onClick={() => setOpen(false)} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-accent">
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="max-h-80 min-h-[120px] overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Sparkles className="h-8 w-8 text-primary/40" />
            <p className="text-sm text-muted-foreground">
              {t("ai.askFollowUp")} <strong>{protocolTitle}</strong>
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {["What if they're a child?", "How do I know it's working?", "When should I stop?"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                  }}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-3 flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-foreground"
              }`}
            >
              {m.role === "assistant" && (
                <div className="mb-1 flex items-center gap-1.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-bold tracking-wider text-primary">AI</span>
                </div>
              )}
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="mb-3 flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              {t("ai.thinking")}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder={t("ai.askPlaceholder")}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
