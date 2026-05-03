// Internationalization system with AI-powered translation via OpenRouter
import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { chatCompletion, isAIAvailable } from "./ai";

// ─── Supported Languages ────────────────────────────────────────────
export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇺🇸" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

// ─── English Base Strings ───────────────────────────────────────────
// These are ALL translatable UI strings, keyed for lookup.
export const EN_STRINGS: Record<string, string> = {
  // Nav
  "nav.dashboard": "DASHBOARD",
  "nav.guidance": "GUIDANCE",
  "nav.knowledge": "KNOWLEDGE",
  "nav.alerts": "ALERTS",
  "nav.brand": "RAPID AID",
  "nav.admin": "ADMIN",

  // Dashboard
  "dash.systemReadiness": "System Readiness",
  "dash.systemDesc": "All local emergency networks online. Location active.",
  "dash.optimal": "OPTIMAL",
  "dash.sos": "SOS",
  "dash.callEmergency": "CALL EMERGENCY",
  "dash.tapImmediately": "Tap immediately for life-threatening situations.",
  "dash.quickProtocols": "Quick Protocols",
  "dash.emergencyContacts": "Emergency Contacts",
  "dash.nearbyFacilities": "Nearby Facilities",
  "dash.describeSituation": "DESCRIBE SITUATION",
  "dash.typePlaceholder": "Type details or use voice input…",
  "dash.tryPrefix": "Try:",
  "dash.tryNotBreathing": "person not breathing",
  "dash.trySevereBleeding": "severe bleeding",
  "dash.locating": "Locating nearby facilities…",
  "dash.locationDenied": "Location access denied. Enable GPS to see nearby facilities.",
  "dash.noFacilities": "No nearby facilities found.",
  "dash.viewOnMap": "View on Map",
  "dash.km": "km",
  "dash.call": "Call",

  // Emergency contacts
  "contact.police": "Police",
  "contact.policeNum": "100",
  "contact.policeDesc": "Law enforcement, crime, accidents",
  "contact.fire": "Fire Department",
  "contact.fireNum": "101",
  "contact.fireDesc": "Fires, chemical spills, rescue",
  "contact.ambulance": "Ambulance",
  "contact.ambulanceNum": "102",
  "contact.ambulanceDesc": "Medical emergencies, injuries",
  "contact.disaster": "Disaster Helpline",
  "contact.disasterNum": "1078",
  "contact.disasterDesc": "Natural disasters, flood, earthquake",

  // Quick categories
  "cat.cpr": "CPR / Unconscious",
  "cat.choking": "Choking",
  "cat.bleeding": "Bleeding",
  "cat.burns": "Burns",
  "cat.fracture": "Fracture",
  "cat.allergic": "Allergic Reaction",

  // Guidance
  "guide.back": "Back",
  "guide.risk": "RISK",
  "guide.protocol": "PROTOCOL",
  "guide.step": "Step",
  "guide.of": "of",
  "guide.previous": "Previous",
  "guide.voiceOn": "Voice ON",
  "guide.voiceOff": "Voice OFF",
  "guide.nextStep": "Next step",
  "guide.enterCpr": "Enter CPR Live Mode",
  "guide.cprDesc": "Animated rhythm + audio cues at 110 BPM",
  "guide.doNot": "DO NOT",
  "guide.call112": "CALL 112",
  "guide.reassurance": "REASSURANCE",
  "guide.reassuranceText": "You're doing the right thing. Stay calm — your actions matter. Help is coming.",
  "guide.switchProtocol": "SWITCH PROTOCOL",
  "guide.disclaimer": "DISCLAIMER",
  "guide.disclaimerText": "This guidance is for informational purposes and is not a substitute for professional medical care.",

  // Knowledge / Offline
  "know.title": "Emergency Knowledge Base",
  "know.offlineReady": "OFFLINE READY • LOCAL TEMPLATES LOADED",
  "know.searchPlaceholder": "Search conditions, protocols, or symptoms…",
  "know.protocols": "PROTOCOLS",
  "know.frequentlyAccessed": "Frequently Accessed",
  "know.severeTrauma": "Severe Trauma",
  "know.severeTraumaDesc": "Hemorrhage control, tourniquet application, and shock management protocols.",
  "know.neurological": "Neurological",
  "know.neurologicalDesc": "Stroke identification (FAST), seizure management, and altered mental status.",
  "know.toxicology": "Toxicology",
  "know.toxicologyDesc": "Poisoning, overdose response, and hazardous material exposure guidelines.",
  "know.cardiacEvents": "Cardiac Events",
  "know.cardiacEventsDesc": "CPR algorithms, AED deployment, and suspected myocardial infarction.",
  "know.respiratory": "Respiratory Distress",
  "know.respiratoryDesc": "Airway management, asthma exacerbation, and anaphylaxis response.",
  "know.thermal": "Thermal & Burns",
  "know.thermalDesc": "Burn classification, cooling protocols, and chemical burn response.",
  "know.offlineBanner": "Internet Connection Required for Full Features",
  "know.offlineBannerDesc": "AI-powered triage analysis, real-time alerts, and nearby facility search require an active internet connection. The emergency protocols and first-aid instructions below are always available offline.",
  "know.essentialTitle": "Essential Emergency Numbers",
  "know.essentialDesc": "Save these numbers on your phone for quick access in emergencies.",
  "know.basicFirstAid": "Basic First Aid — Quick Reference",
  "know.firstAidBleeding": "Bleeding: Apply firm, direct pressure with a clean cloth for at least 5 minutes.",
  "know.firstAidCPR": "CPR: Push hard & fast (100–120/min) on the center of the chest. 2 inches deep.",
  "know.firstAidChoking": "Choking: 5 back blows, then 5 abdominal thrusts. Repeat until clear.",
  "know.firstAidBurns": "Burns: Cool under running water for 20 minutes. Do NOT use ice or butter.",
  "know.firstAidFracture": "Fracture: Immobilize the limb. Do NOT try to realign the bone.",
  "know.firstAidSeizure": "Seizure: Clear the area, protect the head, do NOT restrain or put anything in mouth.",
  "know.firstAidShock": "Shock: Lay them flat, raise legs, keep warm and still. Call emergency services.",

  // Alerts
  "alert.title": "Alerts",
  "alert.desc": "Local incidents, system updates, and helpful nearby resources.",
  "alert.weatherTitle": "Severe weather warning",
  "alert.weatherBody": "Thunderstorms expected in your area. Stay indoors.",
  "alert.aedTitle": "Local AED available",
  "alert.aedBody": "Public AED registered 0.3 mi away — Central Park West.",
  "alert.systemTitle": "System check passed",
  "alert.systemBody": "Offline templates synced. Voice & vibration ready.",
  "alert.noAlerts": "No alerts to display.",

  // AI
  "ai.askAssistant": "Ask AI Assistant",
  "ai.getPersonalized": "Get personalized follow-up guidance for this situation",
  "ai.aiAssistant": "AI Assistant",
  "ai.thinking": "Thinking…",
  "ai.askFollowUp": "Ask a follow-up question about",
  "ai.askPlaceholder": "Ask a follow-up question…",
  "ai.analysis": "AI ANALYSIS",
  "ai.analyzing": "Analyzing your situation…",
  "ai.unavailable": "AI analysis unavailable. Follow the protocol steps above.",
  "ai.getAnalysis": "Get AI analysis for this situation",
  "ai.refresh": "Refresh",

  // Admin
  "admin.title": "Admin Dashboard",
  "admin.signIn": "Sign in with Google",
  "admin.signOut": "Sign Out",
  "admin.manageAlerts": "Manage Alerts",
  "admin.addAlert": "Add Alert",
  "admin.editAlert": "Edit Alert",
  "admin.deleteAlert": "Delete Alert",
  "admin.alertTitle": "Alert Title",
  "admin.alertBody": "Alert Body",
  "admin.alertLevel": "Alert Level",
  "admin.save": "Save",
  "admin.cancel": "Cancel",
  "admin.confirmDelete": "Are you sure you want to delete this alert?",
  "admin.notAuthorized": "You are not authorized to access this page.",
  "admin.signInRequired": "Admin sign-in required to manage alerts.",

  // Footer
  "footer.disclaimer": "⚠ This is not a substitute for professional medical help. In a real emergency, call your local emergency number.",

  // Language
  "lang.selectLanguage": "Language",
};

// ─── Translation Cache ──────────────────────────────────────────────
const translationCache: Record<string, Record<string, string>> = {
  en: { ...EN_STRINGS },
};

/**
 * Translate all strings to a target language using AI.
 * Results are cached in memory.
 */
async function translateAllStrings(langCode: LangCode): Promise<Record<string, string>> {
  if (langCode === "en") return EN_STRINGS;
  if (translationCache[langCode]) return translationCache[langCode];

  const langName = LANGUAGES.find((l) => l.code === langCode)?.label ?? langCode;
  const keys = Object.keys(EN_STRINGS);
  const values = Object.values(EN_STRINGS);

  // Send all strings at once for efficiency
  const prompt = `Translate the following English UI strings to ${langName} (${langCode}). 
Return ONLY a JSON array of translated strings in the same order. No explanations, no markdown, just the JSON array.
Keep the translations concise and natural for a first-aid emergency app.
For medical/emergency terms, use the standard terms in ${langName}.

English strings:
${JSON.stringify(values)}`;

  try {
    const reply = await chatCompletion(
      [{ role: "user", content: prompt }],
      { maxTokens: 4096, temperature: 0.2 }
    );

    // Parse the JSON array from the response
    const jsonMatch = reply.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array in response");

    const translated: string[] = JSON.parse(jsonMatch[0]);
    if (translated.length !== keys.length) throw new Error("Translation count mismatch");

    const result: Record<string, string> = {};
    keys.forEach((key, i) => {
      result[key] = translated[i] || EN_STRINGS[key];
    });

    translationCache[langCode] = result;
    return result;
  } catch (err) {
    console.error("Translation failed:", err);
    return EN_STRINGS;
  }
}

// ─── React Context ──────────────────────────────────────────────────
interface I18nContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string) => string;
  loading: boolean;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => EN_STRINGS[key] ?? key,
  loading: false,
});

export function useI18n() {
  return useContext(I18nContext);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("guardian-lang") as LangCode) || "en";
    }
    return "en";
  });
  const [strings, setStrings] = useState<Record<string, string>>(EN_STRINGS);
  const [loading, setLoading] = useState(false);

  const setLang = useCallback(async (code: LangCode) => {
    setLangState(code);
    if (typeof window !== "undefined") {
      localStorage.setItem("guardian-lang", code);
    }

    if (code === "en") {
      setStrings(EN_STRINGS);
      return;
    }

    // Check cache first
    if (translationCache[code]) {
      setStrings(translationCache[code]);
      return;
    }

    // Use AI to translate
    if (isAIAvailable()) {
      setLoading(true);
      try {
        const translated = await translateAllStrings(code);
        setStrings(translated);
      } catch {
        setStrings(EN_STRINGS);
      } finally {
        setLoading(false);
      }
    }
  }, []);

  // Load saved language on mount
  useEffect(() => {
    if (lang !== "en") {
      setLang(lang);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const t = useCallback(
    (key: string) => strings[key] ?? EN_STRINGS[key] ?? key,
    [strings]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, loading }}>
      {children}
    </I18nContext.Provider>
  );
}
