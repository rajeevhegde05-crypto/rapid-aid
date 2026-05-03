// Rule-based triage engine. Replace with LLM call when Cloud is enabled.
export type Urgency = "low" | "medium" | "high" | "critical";
export type Category =
  | "cpr"
  | "choking"
  | "bleeding"
  | "burns"
  | "fracture"
  | "unconscious"
  | "allergic"
  | "stroke"
  | "general";

export interface Step { title: string; detail: string; }
export interface TimerSpec { label: string; duration: number; }
export interface Protocol {
  category: Category;
  title: string;
  urgency: Urgency;
  riskScore: number;
  summary: string;
  steps: Step[];
  warnings: string[];
  callEmergency: boolean;
  timers?: TimerSpec[];
  cprMode?: boolean;
}

const CRITICAL_KEYWORDS = [
  "not breathing", "no pulse", "unconscious", "unresponsive",
  "severe bleeding", "spurting", "heart attack", "stroke",
  "drowning", "fire spreading", "anaphyla", "can't breathe",
  "cardiac arrest",
];

export const QUICK_CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "cpr", label: "CPR / Unconscious", icon: "heart-pulse" },
  { id: "choking", label: "Choking", icon: "wind" },
  { id: "bleeding", label: "Bleeding", icon: "droplet" },
  { id: "burns", label: "Burns", icon: "flame" },
  { id: "fracture", label: "Fracture", icon: "bone" },
  { id: "allergic", label: "Allergic Reaction", icon: "syringe" },
];

const PROTOCOLS: Record<Category, Protocol> = {
  cpr: {
    category: "cpr",
    title: "Adult CPR",
    urgency: "critical",
    riskScore: 10,
    summary: "Person is unresponsive. Begin hands-only CPR immediately.",
    callEmergency: true,
    cprMode: true,
    steps: [
      { title: "Call emergency services NOW", detail: "Dial your local emergency number. Put phone on speaker." },
      { title: "Lay them flat on their back", detail: "On a firm, hard surface. Tilt head slightly back." },
      { title: "Hand placement", detail: "Heel of one hand on center of chest, between nipples. Other hand on top, fingers interlocked." },
      { title: "Push hard and fast", detail: "Compress at least 2 inches (5cm) deep at 100–120 beats per minute." },
      { title: "Do not stop", detail: "Continue compressions until help arrives or person wakes up." },
    ],
    warnings: [
      "Do NOT stop compressions to check pulse repeatedly",
      "Do NOT bend your elbows — keep arms straight",
      "Do NOT give CPR if the person is conscious and breathing",
    ],
    timers: [{ label: "Compression cycle", duration: 120 }],
  },
  choking: {
    category: "choking",
    title: "Choking — Conscious Adult",
    urgency: "critical",
    riskScore: 9,
    summary: "Airway is blocked. Perform back blows and abdominal thrusts.",
    callEmergency: true,
    steps: [
      { title: "Ask: 'Are you choking?'", detail: "If they cannot speak, cough, or breathe — act now." },
      { title: "5 back blows", detail: "Lean them forward. Strike firmly between shoulder blades with heel of hand." },
      { title: "5 abdominal thrusts", detail: "Stand behind. Fist above navel. Grasp with other hand. Quick inward and upward thrusts." },
      { title: "Repeat", detail: "Alternate 5 back blows and 5 thrusts until object dislodges or they go unconscious." },
      { title: "If unconscious — start CPR", detail: "Lay flat and begin chest compressions immediately." },
    ],
    warnings: [
      "Do NOT use abdominal thrusts on infants under 1 year",
      "Do NOT do a blind finger sweep",
    ],
  },
  bleeding: {
    category: "bleeding",
    title: "Severe Bleeding Control",
    urgency: "high",
    riskScore: 8,
    summary: "Apply continuous pressure. Do not remove the dressing.",
    callEmergency: true,
    steps: [
      { title: "Apply firm, direct pressure", detail: "Use a clean cloth or gauze. Press deeply into the wound with both hands." },
      { title: "Keep pressing — do not peek", detail: "Maintain pressure for at least 5 minutes without lifting the cloth." },
      { title: "Elevate the wound", detail: "If possible, raise the injured area above heart level." },
      { title: "Add more layers if soaked", detail: "Do not remove the original dressing — just add more on top." },
      { title: "Tourniquet (last resort)", detail: "Only for life-threatening limb bleeding that won't stop. 2–3 inches above wound, never on a joint." },
    ],
    warnings: [
      "Do NOT remove embedded objects — stabilize them",
      "Do NOT lift the dressing to check the wound",
      "Do NOT use a tourniquet on the head, neck, or torso",
    ],
    timers: [{ label: "Maintain pressure", duration: 300 }],
  },
  burns: {
    category: "burns",
    title: "Thermal Burn",
    urgency: "medium",
    riskScore: 5,
    summary: "Cool the burn under running water. Do not apply ice or creams.",
    callEmergency: false,
    steps: [
      { title: "Move to safety", detail: "Stop the burning process. Remove from the heat source." },
      { title: "Cool with running water", detail: "Cool (not cold) running water over the burn for 20 minutes." },
      { title: "Remove tight items", detail: "Carefully remove jewelry or clothing near the burn — but not if stuck." },
      { title: "Cover loosely", detail: "Use cling film or a clean, non-fluffy cloth." },
      { title: "Seek medical help", detail: "For burns larger than your palm, on face/hands/genitals, or any chemical/electrical burn." },
    ],
    warnings: [
      "Do NOT apply ice, butter, toothpaste, or creams",
      "Do NOT pop blisters",
      "Do NOT remove clothing stuck to the burn",
    ],
    timers: [{ label: "Cool under water", duration: 1200 }],
  },
  fracture: {
    category: "fracture",
    title: "Suspected Fracture",
    urgency: "medium",
    riskScore: 6,
    summary: "Immobilize the limb. Do not try to realign the bone.",
    callEmergency: true,
    steps: [
      { title: "Keep them still", detail: "Do not move the injured area unless they are in immediate danger." },
      { title: "Support the injury", detail: "Use cushions or rolled clothing to support the limb in the position found." },
      { title: "Apply cold pack", detail: "Wrap ice in a cloth and apply to reduce swelling. 20 min on, 20 min off." },
      { title: "Watch for shock", detail: "Pale skin, rapid breathing — keep them warm and lying down." },
      { title: "Get medical help", detail: "Transport carefully or wait for paramedics if a major bone is involved." },
    ],
    warnings: [
      "Do NOT try to push a bone back into place",
      "Do NOT move a suspected spinal injury",
      "Do NOT give food or water (may need surgery)",
    ],
  },
  unconscious: {
    category: "unconscious",
    title: "Unconscious but Breathing",
    urgency: "critical",
    riskScore: 9,
    summary: "Place in recovery position and monitor breathing.",
    callEmergency: true,
    steps: [
      { title: "Call emergency services", detail: "Dial now. Put phone on speaker." },
      { title: "Check breathing", detail: "Tilt head back, lift chin. Look, listen, feel for 10 seconds." },
      { title: "Recovery position", detail: "Roll onto their side. Top knee bent. Head tilted to keep airway open." },
      { title: "Monitor continuously", detail: "Stay with them. If breathing stops — start CPR immediately." },
    ],
    warnings: [
      "Do NOT leave them on their back if vomiting",
      "Do NOT give food or water",
      "Do NOT move if spinal injury suspected (unless not breathing)",
    ],
  },
  allergic: {
    category: "allergic",
    title: "Severe Allergic Reaction",
    urgency: "critical",
    riskScore: 9,
    summary: "Possible anaphylaxis. Use epinephrine auto-injector if available.",
    callEmergency: true,
    steps: [
      { title: "Call emergency services", detail: "Anaphylaxis is life-threatening. Dial now." },
      { title: "Use EpiPen if available", detail: "Press firmly into outer thigh. Hold 3 seconds. Can go through clothing." },
      { title: "Lay them flat", detail: "Raise legs. If breathing is hard, let them sit up slightly." },
      { title: "Loosen tight clothing", detail: "Especially around neck and chest." },
      { title: "Second dose if no improvement", detail: "After 5–15 minutes, use a second auto-injector if symptoms persist." },
    ],
    warnings: [
      "Do NOT let them stand or walk",
      "Do NOT give food or drink",
      "Do NOT assume they're fine after EpiPen — still call 911",
    ],
    timers: [{ label: "Wait before 2nd dose", duration: 300 }],
  },
  stroke: {
    category: "stroke",
    title: "Stroke (FAST)",
    urgency: "critical",
    riskScore: 10,
    summary: "Time is brain. Note the time symptoms started.",
    callEmergency: true,
    steps: [
      { title: "Call emergency services", detail: "Tell them you suspect a stroke. Time is critical." },
      { title: "F — Face drooping", detail: "Ask them to smile. Does one side droop?" },
      { title: "A — Arm weakness", detail: "Ask them to raise both arms. Does one drift down?" },
      { title: "S — Speech difficulty", detail: "Ask them to repeat a simple phrase. Slurred?" },
      { title: "T — Time", detail: "Note exact time symptoms started. Tell paramedics." },
    ],
    warnings: [
      "Do NOT give aspirin (could be a bleed)",
      "Do NOT give food or water",
      "Do NOT let them 'sleep it off'",
    ],
  },
  general: {
    category: "general",
    title: "General Emergency",
    urgency: "medium",
    riskScore: 4,
    summary: "Stay calm and assess the situation.",
    callEmergency: false,
    steps: [
      { title: "Ensure your safety first", detail: "Do not become a second victim. Check surroundings." },
      { title: "Check responsiveness", detail: "Tap shoulder, ask loudly: 'Are you OK?'" },
      { title: "Call for help if unsure", detail: "When in doubt, call emergency services." },
      { title: "Stay with the person", detail: "Reassure them. Keep them warm and still." },
    ],
    warnings: ["Do NOT move a seriously injured person unless they are in danger"],
  },
};

const KEYWORD_MAP: [RegExp, Category][] = [
  [/chok|swallow|airway/i, "choking"],
  [/bleed|blood|cut|hemorr|wound/i, "bleeding"],
  [/burn|fire|scald|hot/i, "burns"],
  [/fracture|broken|bone|sprain/i, "fracture"],
  [/unconscious|fainted|passed out|unresponsive/i, "unconscious"],
  [/allerg|anaphyla|epipen|hives|swelling face/i, "allergic"],
  [/stroke|droop|slurred|weakness one side/i, "stroke"],
  [/cpr|not breathing|no pulse|cardiac/i, "cpr"],
];

export function detectCategory(text: string): Category {
  const t = text.toLowerCase();
  for (const [re, cat] of KEYWORD_MAP) if (re.test(t)) return cat;
  return "general";
}

export function isCriticalText(text: string): boolean {
  const t = text.toLowerCase();
  return CRITICAL_KEYWORDS.some((k) => t.includes(k));
}

export function getProtocol(category: Category): Protocol {
  return PROTOCOLS[category] ?? PROTOCOLS.general;
}

export function analyze(input: string, category?: Category): Protocol {
  const cat = category ?? detectCategory(input);
  const proto = { ...getProtocol(cat) };
  if (isCriticalText(input)) {
    proto.urgency = "critical";
    proto.callEmergency = true;
    proto.riskScore = Math.max(proto.riskScore, 9);
  }
  return proto;
}

export const URGENCY_STYLE: Record<Urgency, { label: string; className: string }> = {
  low: { label: "LOW", className: "bg-success/20 text-success border-success/40" },
  medium: { label: "MEDIUM", className: "bg-warning/20 text-warning border-warning/40" },
  high: { label: "HIGH", className: "bg-coral/20 text-coral border-coral/40" },
  critical: { label: "CRITICAL", className: "bg-critical/20 text-critical border-critical/50 animate-pulse-emergency" },
};
