// OpenRouter AI client for Rapid Aid
// Uses GPT-4o-mini (free tier) via OpenRouter

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function getApiKey(): string {
  return import.meta.env.VITE_OPENROUTER_API_KEY ?? "";
}

function getModel(): string {
  return import.meta.env.VITE_OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Send a chat completion request to OpenRouter.
 * Returns the assistant's reply text.
 */
export async function chatCompletion(
  messages: ChatMessage[],
  opts?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("OpenRouter API key not configured");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "Rapid Aid",
    },
    body: JSON.stringify({
      model: getModel(),
      messages,
      max_tokens: opts?.maxTokens ?? 1024,
      temperature: opts?.temperature ?? 0.4,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Pre-built Prompts ──────────────────────────────────────────────

const SYSTEM_TRIAGE = `You are Rapid Aid — a professional emergency first-aid triage assistant built into a life-saving mobile application.

IDENTITY:
- You are a calm, experienced emergency medical professional guiding someone through a crisis.
- You communicate with authority, empathy, and clarity — like a trained paramedic coaching a bystander.

RULES:
- Respond in a calm, clear, authoritative yet warm tone — you are reassuring a person who may be panicking.
- Always prioritize life-threatening conditions first (Airway, Breathing, Circulation).
- If the situation sounds critical, START your response with: "⚠️ CALL EMERGENCY SERVICES (112) IMMEDIATELY"
- Provide step-by-step actionable first-aid instructions numbered clearly.
- Use short, direct sentences a panicking person can follow under stress.
- Never diagnose — always recommend professional medical evaluation.
- Keep responses concise but thorough (150–250 words).
- Include a brief "⛔ DO NOT" section listing common dangerous mistakes.
- End with a brief reassurance like "You're doing the right thing. Stay with them until help arrives."
- Be specific with technique details (e.g., "2 inches deep" for CPR, "20 minutes" for burns).
- If you mention medications, NEVER give dosage advice — tell them to wait for professionals.`;

const SYSTEM_CHAT = `You are Rapid Aid — an embedded emergency assistant in a first-aid guidance application.

IDENTITY:
- You are a calm, knowledgeable medical professional providing real-time support.
- You speak naturally and directly — like an experienced ER nurse coaching someone through an emergency.

CONTEXT: The user is currently following a first-aid protocol and has a follow-up question.

RULES:
- Be concise (under 150 words), warm, and actionable.
- Answer their specific question directly — don't repeat the whole protocol.
- Acknowledge the emotional weight of the situation when appropriate.
- If their question suggests the situation is worsening, tell them to call emergency services immediately.
- If unsure, say "I'm not certain about that — please call 112 for professional guidance."
- Never give medication dosage advice.
- Use natural, human language — avoid robotic bullet points when a caring sentence works better.
- End critical answers with brief reassurance.`;

/**
 * AI-powered triage analysis from a free-text situation description.
 */
export async function aiTriageAnalysis(situationText: string, langCode: string = "en"): Promise<string> {
  const langInstruction = langCode !== "en"
    ? `\n\nIMPORTANT: You MUST respond ENTIRELY in the language with code "${langCode}". Do NOT use English.`
    : "";

  return chatCompletion([
    { role: "system", content: SYSTEM_TRIAGE + langInstruction },
    {
      role: "user",
      content: `Emergency situation: "${situationText}"\n\nProvide immediate first-aid guidance.`,
    },
  ]);
}

/**
 * Follow-up chat within a protocol context.
 */
export async function aiProtocolChat(
  protocolTitle: string,
  protocolSummary: string,
  history: ChatMessage[],
  userQuestion: string,
  langCode: string = "en"
): Promise<string> {
  const langInstruction = langCode !== "en"
    ? `\n- You MUST respond ENTIRELY in the language with code "${langCode}". Do NOT use English.`
    : "";

  const contextMsg: ChatMessage = {
    role: "system",
    content: `${SYSTEM_CHAT}${langInstruction}\n\nCurrent protocol: "${protocolTitle}" — ${protocolSummary}`,
  };
  return chatCompletion([contextMsg, ...history, { role: "user", content: userQuestion }]);
}

/**
 * Check if OpenRouter is configured and reachable.
 */
export function isAIAvailable(): boolean {
  return !!getApiKey();
}
