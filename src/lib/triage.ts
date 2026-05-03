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

export interface Step {
  title: string;
  detail: string;
  why: string;
  riskIfSkipped: string;
  estimatedSeconds: number;
  isCritical?: boolean;
  icon?: string; // emoji for visual guide
}

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
  confidence: number; // AI confidence 0-100
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
    confidence: 95,
    summary: "Person is unresponsive. Begin hands-only CPR immediately.",
    callEmergency: true,
    cprMode: true,
    steps: [
      {
        title: "Call emergency services NOW",
        detail: "Dial your local emergency number. Put phone on speaker.",
        why: "Professional help must be dispatched immediately — every second counts in cardiac arrest.",
        riskIfSkipped: "Without EMS, survival rate drops 7-10% per minute. Brain damage begins in 4-6 minutes.",
        estimatedSeconds: 30,
        isCritical: true,
        icon: "📞",
      },
      {
        title: "Lay them flat on their back",
        detail: "On a firm, hard surface. Tilt head slightly back.",
        why: "A firm surface ensures chest compressions effectively push blood to vital organs.",
        riskIfSkipped: "Soft surfaces absorb compression force, making CPR ineffective.",
        estimatedSeconds: 15,
        icon: "🛏️",
      },
      {
        title: "Hand placement",
        detail: "Heel of one hand on center of chest, between nipples. Other hand on top, fingers interlocked.",
        why: "Correct hand placement maximizes blood flow to the heart and brain.",
        riskIfSkipped: "Wrong placement can break ribs without effective circulation, or damage internal organs.",
        estimatedSeconds: 10,
        isCritical: true,
        icon: "🤲",
      },
      {
        title: "Push hard and fast",
        detail: "Compress at least 2 inches (5cm) deep at 100–120 beats per minute.",
        why: "Deep, fast compressions create artificial circulation keeping the brain alive.",
        riskIfSkipped: "Shallow or slow compressions fail to circulate blood, leading to brain death.",
        estimatedSeconds: 120,
        isCritical: true,
        icon: "💓",
      },
      {
        title: "Do not stop",
        detail: "Continue compressions until help arrives or person wakes up.",
        why: "Continuous compressions maintain the small amount of blood flow keeping them alive.",
        riskIfSkipped: "Stopping even briefly causes blood pressure to drop to zero.",
        estimatedSeconds: 300,
        isCritical: true,
        icon: "⏱️",
      },
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
    confidence: 92,
    summary: "Airway is blocked. Perform back blows and abdominal thrusts.",
    callEmergency: true,
    steps: [
      {
        title: "Ask: 'Are you choking?'",
        detail: "If they cannot speak, cough, or breathe — act now.",
        why: "Confirming a complete blockage determines whether intervention is needed immediately.",
        riskIfSkipped: "You might intervene on someone who can clear the obstruction themselves.",
        estimatedSeconds: 5,
        isCritical: true,
        icon: "❓",
      },
      {
        title: "5 back blows",
        detail: "Lean them forward. Strike firmly between shoulder blades with heel of hand.",
        why: "Back blows create pressure behind the blockage, helping to dislodge it.",
        riskIfSkipped: "The object remains lodged; the person loses consciousness within 2-3 minutes.",
        estimatedSeconds: 15,
        isCritical: true,
        icon: "👋",
      },
      {
        title: "5 abdominal thrusts",
        detail: "Stand behind. Fist above navel. Grasp with other hand. Quick inward and upward thrusts.",
        why: "Thrusts push air from the lungs upward, forcing the object out like a cork.",
        riskIfSkipped: "Without thrusts, back blows alone may not generate enough force.",
        estimatedSeconds: 15,
        isCritical: true,
        icon: "🤜",
      },
      {
        title: "Repeat",
        detail: "Alternate 5 back blows and 5 thrusts until object dislodges or they go unconscious.",
        why: "Alternating techniques attacks the blockage from different angles.",
        riskIfSkipped: "Giving up means certain loss of consciousness and potential death.",
        estimatedSeconds: 60,
        icon: "🔄",
      },
      {
        title: "If unconscious — start CPR",
        detail: "Lay flat and begin chest compressions immediately.",
        why: "CPR can dislodge the object while also maintaining circulation.",
        riskIfSkipped: "Without CPR, brain death occurs within minutes.",
        estimatedSeconds: 120,
        isCritical: true,
        icon: "💓",
      },
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
    confidence: 90,
    summary: "Apply continuous pressure. Do not remove the dressing.",
    callEmergency: true,
    steps: [
      {
        title: "Apply firm, direct pressure",
        detail: "Use a clean cloth or gauze. Press deeply into the wound with both hands.",
        why: "Direct pressure compresses blood vessels, allowing clots to form and stop bleeding.",
        riskIfSkipped: "Uncontrolled bleeding can cause shock and death within minutes.",
        estimatedSeconds: 10,
        isCritical: true,
        icon: "🩹",
      },
      {
        title: "Keep pressing — do not peek",
        detail: "Maintain pressure for at least 5 minutes without lifting the cloth.",
        why: "Lifting the dressing breaks forming clots and restarts bleeding.",
        riskIfSkipped: "Blood clots are fragile when forming; disturbing them causes re-bleeding.",
        estimatedSeconds: 300,
        isCritical: true,
        icon: "⏳",
      },
      {
        title: "Elevate the wound",
        detail: "If possible, raise the injured area above heart level.",
        why: "Gravity reduces blood pressure at the wound, slowing bleeding.",
        riskIfSkipped: "More blood flows to the wound, making it harder to control.",
        estimatedSeconds: 10,
        icon: "⬆️",
      },
      {
        title: "Add more layers if soaked",
        detail: "Do not remove the original dressing — just add more on top.",
        why: "Removing dressings destroys clots. Adding layers maintains pressure.",
        riskIfSkipped: "Removing a soaked dressing causes massive re-bleeding.",
        estimatedSeconds: 15,
        icon: "🧻",
      },
      {
        title: "Tourniquet (last resort)",
        detail: "Only for life-threatening limb bleeding that won't stop. 2–3 inches above wound, never on a joint.",
        why: "A tourniquet completely stops blood flow, preventing fatal blood loss.",
        riskIfSkipped: "Without a tourniquet, a severed artery can cause death in under 5 minutes.",
        estimatedSeconds: 30,
        isCritical: true,
        icon: "🔧",
      },
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
    confidence: 88,
    summary: "Cool the burn under running water. Do not apply ice or creams.",
    callEmergency: false,
    steps: [
      {
        title: "Move to safety",
        detail: "Stop the burning process. Remove from the heat source.",
        why: "The burn continues to damage tissue as long as heat is present.",
        riskIfSkipped: "Continued exposure deepens the burn from partial to full thickness.",
        estimatedSeconds: 15,
        isCritical: true,
        icon: "🚶",
      },
      {
        title: "Cool with running water",
        detail: "Cool (not cold) running water over the burn for 20 minutes.",
        why: "Cooling reduces tissue damage, pain, and swelling for up to 3 hours after the burn.",
        riskIfSkipped: "Heat trapped in tissue continues destroying cells, worsening the burn.",
        estimatedSeconds: 1200,
        isCritical: true,
        icon: "🚿",
      },
      {
        title: "Remove tight items",
        detail: "Carefully remove jewelry or clothing near the burn — but not if stuck.",
        why: "Swelling begins quickly; tight items can cut off circulation.",
        riskIfSkipped: "Rings, watches, and tight clothing become impossible to remove after swelling.",
        estimatedSeconds: 30,
        icon: "💍",
      },
      {
        title: "Cover loosely",
        detail: "Use cling film or a clean, non-fluffy cloth.",
        why: "Covering prevents infection and reduces pain from air exposure.",
        riskIfSkipped: "Open burns are extremely vulnerable to infection.",
        estimatedSeconds: 30,
        icon: "🩹",
      },
      {
        title: "Seek medical help",
        detail: "For burns larger than your palm, on face/hands/genitals, or any chemical/electrical burn.",
        why: "Professional treatment prevents scarring, contractures, and infection.",
        riskIfSkipped: "Untreated burns can lead to infection, permanent scarring, and loss of function.",
        estimatedSeconds: 10,
        icon: "🏥",
      },
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
    confidence: 85,
    summary: "Immobilize the limb. Do not try to realign the bone.",
    callEmergency: true,
    steps: [
      {
        title: "Keep them still",
        detail: "Do not move the injured area unless they are in immediate danger.",
        why: "Movement can displace bone fragments, damaging nerves and blood vessels.",
        riskIfSkipped: "A simple fracture can become compound (bone through skin) with movement.",
        estimatedSeconds: 10,
        isCritical: true,
        icon: "✋",
      },
      {
        title: "Support the injury",
        detail: "Use cushions or rolled clothing to support the limb in the position found.",
        why: "Supporting prevents further displacement and reduces pain significantly.",
        riskIfSkipped: "Unsupported fractures are agonizing and may cause shock from pain alone.",
        estimatedSeconds: 60,
        icon: "🛡️",
      },
      {
        title: "Apply cold pack",
        detail: "Wrap ice in a cloth and apply to reduce swelling. 20 min on, 20 min off.",
        why: "Cold constricts blood vessels, limiting swelling and internal bleeding.",
        riskIfSkipped: "Excessive swelling increases pain and can compress nerves.",
        estimatedSeconds: 30,
        icon: "🧊",
      },
      {
        title: "Watch for shock",
        detail: "Pale skin, rapid breathing — keep them warm and lying down.",
        why: "Fractures can cause significant internal bleeding, leading to shock.",
        riskIfSkipped: "Untreated shock can be fatal even with a 'simple' fracture.",
        estimatedSeconds: 60,
        icon: "👀",
      },
      {
        title: "Get medical help",
        detail: "Transport carefully or wait for paramedics if a major bone is involved.",
        why: "Professional imaging and treatment ensures proper healing and prevents complications.",
        riskIfSkipped: "Improperly healed fractures cause chronic pain and disability.",
        estimatedSeconds: 10,
        icon: "🚑",
      },
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
    confidence: 93,
    summary: "Place in recovery position and monitor breathing.",
    callEmergency: true,
    steps: [
      {
        title: "Call emergency services",
        detail: "Dial now. Put phone on speaker.",
        why: "Unconsciousness indicates a serious underlying condition requiring professional care.",
        riskIfSkipped: "The underlying cause (stroke, head injury, overdose) may be fatal without treatment.",
        estimatedSeconds: 30,
        isCritical: true,
        icon: "📞",
      },
      {
        title: "Check breathing",
        detail: "Tilt head back, lift chin. Look, listen, feel for 10 seconds.",
        why: "Confirming breathing determines whether CPR is needed immediately.",
        riskIfSkipped: "If they're not breathing and you don't check, they die without CPR.",
        estimatedSeconds: 15,
        isCritical: true,
        icon: "👂",
      },
      {
        title: "Recovery position",
        detail: "Roll onto their side. Top knee bent. Head tilted to keep airway open.",
        why: "The recovery position prevents choking on vomit — the #1 killer of unconscious people.",
        riskIfSkipped: "Lying on their back, vomit can silently block the airway causing death.",
        estimatedSeconds: 30,
        isCritical: true,
        icon: "🔄",
      },
      {
        title: "Monitor continuously",
        detail: "Stay with them. If breathing stops — start CPR immediately.",
        why: "Unconscious patients can stop breathing at any moment without warning.",
        riskIfSkipped: "If breathing stops unnoticed, they have only 4-6 minutes before brain damage.",
        estimatedSeconds: 300,
        isCritical: true,
        icon: "👁️",
      },
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
    confidence: 91,
    summary: "Possible anaphylaxis. Use epinephrine auto-injector if available.",
    callEmergency: true,
    steps: [
      {
        title: "Call emergency services",
        detail: "Anaphylaxis is life-threatening. Dial now.",
        why: "Anaphylaxis can close the airway completely within minutes.",
        riskIfSkipped: "Without epinephrine from EMS, airway closure is fatal.",
        estimatedSeconds: 30,
        isCritical: true,
        icon: "📞",
      },
      {
        title: "Use EpiPen if available",
        detail: "Press firmly into outer thigh. Hold 3 seconds. Can go through clothing.",
        why: "Epinephrine reverses the allergic reaction by opening airways and raising blood pressure.",
        riskIfSkipped: "Without epinephrine, the airway swells shut and blood pressure crashes.",
        estimatedSeconds: 10,
        isCritical: true,
        icon: "💉",
      },
      {
        title: "Lay them flat",
        detail: "Raise legs. If breathing is hard, let them sit up slightly.",
        why: "Lying flat with raised legs combats the dangerous blood pressure drop of anaphylaxis.",
        riskIfSkipped: "Standing or sitting can cause fatal cardiovascular collapse.",
        estimatedSeconds: 10,
        icon: "🛌",
      },
      {
        title: "Loosen tight clothing",
        detail: "Especially around neck and chest.",
        why: "Tight clothing restricts an already compromised airway and breathing.",
        riskIfSkipped: "Additional constriction accelerates breathing failure.",
        estimatedSeconds: 15,
        icon: "👔",
      },
      {
        title: "Second dose if no improvement",
        detail: "After 5–15 minutes, use a second auto-injector if symptoms persist.",
        why: "One dose isn't always enough — a second dose can be lifesaving.",
        riskIfSkipped: "If the first dose wears off, the reaction can return full force (biphasic reaction).",
        estimatedSeconds: 10,
        icon: "💉",
      },
    ],
    warnings: [
      "Do NOT let them stand or walk",
      "Do NOT give food or drink",
      "Do NOT assume they're fine after EpiPen — still call 112",
    ],
    timers: [{ label: "Wait before 2nd dose", duration: 300 }],
  },
  stroke: {
    category: "stroke",
    title: "Stroke (FAST)",
    urgency: "critical",
    riskScore: 10,
    confidence: 94,
    summary: "Time is brain. Note the time symptoms started.",
    callEmergency: true,
    steps: [
      {
        title: "Call emergency services",
        detail: "Tell them you suspect a stroke. Time is critical.",
        why: "Clot-busting drugs must be given within 3-4.5 hours of symptom onset.",
        riskIfSkipped: "Every minute of delay kills ~1.9 million neurons. Permanent disability results.",
        estimatedSeconds: 30,
        isCritical: true,
        icon: "📞",
      },
      {
        title: "F — Face drooping",
        detail: "Ask them to smile. Does one side droop?",
        why: "Facial droop confirms stroke damage to the brain's motor cortex.",
        riskIfSkipped: "Missing this sign delays treatment, increasing permanent damage.",
        estimatedSeconds: 15,
        icon: "😐",
      },
      {
        title: "A — Arm weakness",
        detail: "Ask them to raise both arms. Does one drift down?",
        why: "Unilateral arm weakness confirms brain damage on the opposite side.",
        riskIfSkipped: "Without clear symptoms to report, EMS may not prioritize correctly.",
        estimatedSeconds: 15,
        icon: "💪",
      },
      {
        title: "S — Speech difficulty",
        detail: "Ask them to repeat a simple phrase. Slurred?",
        why: "Speech problems indicate damage to the brain's language centers.",
        riskIfSkipped: "Incomplete assessment delays the correct treatment at the hospital.",
        estimatedSeconds: 15,
        icon: "🗣️",
      },
      {
        title: "T — Time",
        detail: "Note exact time symptoms started. Tell paramedics.",
        why: "The exact onset time determines which treatments are safe to use.",
        riskIfSkipped: "Without onset time, doctors cannot safely give clot-busting drugs.",
        estimatedSeconds: 10,
        isCritical: true,
        icon: "⏰",
      },
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
    confidence: 75,
    summary: "Stay calm and assess the situation.",
    callEmergency: false,
    steps: [
      {
        title: "Ensure your safety first",
        detail: "Do not become a second victim. Check surroundings.",
        why: "An injured rescuer cannot help anyone and creates an additional emergency.",
        riskIfSkipped: "You could be injured by the same hazard, doubling the emergency.",
        estimatedSeconds: 15,
        icon: "🛡️",
      },
      {
        title: "Check responsiveness",
        detail: "Tap shoulder, ask loudly: 'Are you OK?'",
        why: "Responsiveness determines the urgency level and next steps.",
        riskIfSkipped: "An unconscious person needs immediate airway management.",
        estimatedSeconds: 10,
        icon: "🤚",
      },
      {
        title: "Call for help if unsure",
        detail: "When in doubt, call emergency services.",
        why: "Professional dispatchers can guide you through any situation over the phone.",
        riskIfSkipped: "Delayed calls reduce survival chances for hidden life-threatening conditions.",
        estimatedSeconds: 30,
        icon: "📞",
      },
      {
        title: "Stay with the person",
        detail: "Reassure them. Keep them warm and still.",
        why: "Reassurance reduces panic, which slows heart rate and bleeding.",
        riskIfSkipped: "Leaving them alone increases anxiety, worsening their condition.",
        estimatedSeconds: 300,
        icon: "🤝",
      },
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
