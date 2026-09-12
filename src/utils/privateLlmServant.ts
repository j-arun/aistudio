// Specification ID: SRS-REQ-1.3-1.4
// Requirements 1.3 & 1.4: Private LLM Intelligent Intake & Reasoning Engine
// Architectural Role: Reasoning Servant to Master Public LLM (Claude/Gemini)
// Optimized for: DeepSeek 32B (R1-Distill), Qwen 2.5 14B/32B, and Llama 3.1 8B
// 3 Core Pillars:
//   Pillar 1: Timeline Validation Engine (Mandatory YYYY-MM, Dasha & Gochara Ingress Check)
//   Pillar 2: Narrative Fullness & Astrological Synthesis (Zero Fluff, Context-Built Story)
//   Pillar 3: Pakka Astrological Reasoning (Bhava/Karaka Alignment, Varga Directives & Realities)

import { runTwoStageSanitization } from './piiSanitizer';
import { preprocessAndCorrectText } from './intelligentPromptEngine';
import { getResourceMonitorState, notifyModelLoaded } from './resourceMonitor';

export interface ReasoningQuestion {
  id: string;
  pillar: 'timeline' | 'fullness' | 'efficiency';
  category: 'timeline_yyyy_mm' | 'event_origin' | 'channel_medium' | 'core_intent' | 'domain_specific';
  title: string;
  description: string;
  astrologicalJustification: string;
  suggestedValue?: string;
  responseValue: string;
  isNotApplicable: boolean;
  domainLabel?: string;
}

export interface AstrologicalDomainInfo {
  key: string;
  bhava: number;
  title: string;
  significator: string;
  suggestedFocus: string;
}

export interface TimelineValidation {
  isValid: boolean;
  detectedYyyyMm: string | null;
  normalizedTimeline: string; // strictly YYYY-MM
  status: 'verified' | 'inferred_from_context' | 'resolved_fuzzy' | 'requires_clarification';
  fuzzyMatches: string[];
  suggestedYyyyMm: string;
  dashaWindowCheck: {
    activeDashaStr: string;
    isWithinActiveDasha: boolean;
    alignmentNote: string;
  };
  transitPeriodCheck: {
    targetPeriod: string;
    matchesTargetPeriod: boolean;
  };
  astrologicalChronologyNote: string;
}

export interface StructuredAstrologicalNarrative {
  title: string;
  querentStance: string;
  catalyticTrigger: string;
  strategicIntent: string;
  executionMedium: string;
  formulatedQuestions: string[];
  synthesizedNarrative: string; // The complete, beautifully articulated, cohesive master narrative
  summaryDossier: string;
}

export interface PakkaAstrologicalReasoning {
  primaryBhava: {
    house: number;
    name: string;
    domain: string;
    karakas: string;
    significatorGrahas: string[];
    justification: string;
  };
  secondaryBhavas: Array<{
    house: number;
    name: string;
    domain: string;
    relevance: string;
  }>;
  mandatedVargas: Array<{
    id: string;
    name: string;
    focus: string;
  }>;
  keyTransitVectorsToCheck: string[];
  masterLlmDirectives: string[];
  practicalRealitiesMandate: string[];
}

export interface ServantEvaluationResult {
  privateLlmSucceeded?: boolean;
  privateLlmPrompt?: string;
  privateLlmResponse?: string;
  privateLlmError?: string;
  hasGaps: boolean;
  timelineValid: boolean;
  detectedTimeline?: string;
  normalizedTimeline: string; // strictly YYYY-MM
  timelineValidation: TimelineValidation;
  questions: ReasoningQuestion[];
  rawText: string;
  sanitizedText: string;
  compressedNarrative: string;
  storySynopsis: string; // High-density precision synopsis, 0% repetitive 'native' jargon
  detectedDomain: AstrologicalDomainInfo;
  structuredNarrative: StructuredAstrologicalNarrative;
  pakkaReasoning: PakkaAstrologicalReasoning;
  extractedAttributes: {
    origin?: string;
    channel?: string;
    intent?: string;
    timeline: string;
  };
  metrics: {
    rawWords: number;
    compressedWords: number;
    tokenCompressionRatio: string;
    fillerWordsRemoved: number;
    gapsIdentifiedCount: number;
    repetitiveNativeWordsPurged: number;
    estimatedTokensSaved: number;
  };
}

/**
 * Common conversational filler and verbose preamble phrases to purge for context efficiency
 */
const FILLER_PATTERNS = [
  /\b(hello|hi|hey|dear)\s+(sir|guruji|astrologer|panditji|team|all)?\b/gi,
  /\bhope\s+you\s+(are\s+doing\s+well|find\s+this\s+well)\b/gi,
  /\bkindly\s+(check|verify|help|advise|look\s+into|predict)\b/gi,
  /\bi\s+am\s+writing\s+(this\s+to\s+ask|to\s+you)\b/gi,
  /\bcan\s+you\s+please\s+(tell\s+me|help\s+me|guide\s+me)\b/gi,
  /\bi\s+would\s+like\s+to\s+know\b/gi,
  /\bplease\s+let\s+me\s+know\b/gi,
  /\bthank\s+you\s+(very\s+much|in\s+advance)?\b/gi,
  /\bthanks\s+and\s+regards\b/gi,
  /\bas\s+per\s+my\s+understanding\b/gi,
  /\bi\s+am\s+curious\s+about\b/gi,
  /\bjust\s+wanted\s+to\s+ask\b/gi,
  /\bif\s+possible\s+could\s+you\b/gi,
];

/**
 * Detects fuzzy, ambiguous, or relative temporal phrases that lack strict YYYY-MM precision
 */
const FUZZY_TIMELINE_PATTERNS = [
  { regex: /\b(mid\s*2026|mid-2026)\b/i, label: 'mid-2026', resolved: '2026-06' },
  { regex: /\b(early\s*2026|early-2026)\b/i, label: 'early 2026', resolved: '2026-02' },
  { regex: /\b(late\s*2026|late-2026)\b/i, label: 'late 2026', resolved: '2026-10' },
  { regex: /\b(somewhere\s+in\s+winter|in\s+winter|winter\s+2026)\b/i, label: 'winter 2026', resolved: '2026-11' },
  { regex: /\b(next\s+summer|in\s+summer|summer\s+time|summer\s+2026)\b/i, label: 'summer 2026', resolved: '2026-05' },
  { regex: /\b(in\s+spring|spring\s+2026)\b/i, label: 'spring 2026', resolved: '2026-03' },
  { regex: /\b(in\s+autumn|autumn\s+2026|fall\s+2026)\b/i, label: 'autumn 2026', resolved: '2026-09' },
  { regex: /\b(next\s+year|coming\s+year|by\s+next\s+year)\b/i, label: 'next year reference', resolved: '2027-01' },
  { regex: /\b(a\s+few\s+months|in\s+a\s+few\s+months|coming\s+months)\b/i, label: 'coming months', resolved: '2026-09' },
  { regex: /\b(around\s+diwali|last\s+diwali|next\s+diwali)\b/i, label: 'festival calendar offset', resolved: '2026-11' },
  { regex: /\b(recently|lately|a\s+few\s+years\s+ago|some\s+time\s+back)\b/i, label: 'vague past period', resolved: '2026-09' },
  { regex: /\b(soon|asap|anytime\s+soon)\b/i, label: 'undefined near-term indicator', resolved: '2026-09' },
];

/**
 * Evaluates narrative for strict YYYY-MM chronological anchors
 */
export function evaluateTimelinePrecision(
  text: string,
  fallbackAnchorDate: string = '2026-09-07'
): {
  isValid: boolean;
  detectedYyyyMm: string | null;
  fuzzyMatches: string[];
  suggestedYyyyMm: string;
} {
  // Check for strict YYYY-MM pattern: 202X-XX or Month YYYY
  const strictIsoMatch = text.match(/\b(202[4-9]|203[0-9])-(0[1-9]|1[0-2])\b/);
  if (strictIsoMatch) {
    return {
      isValid: true,
      detectedYyyyMm: strictIsoMatch[0],
      fuzzyMatches: [],
      suggestedYyyyMm: strictIsoMatch[0],
    };
  }

  // Check for textual Month + Year (e.g. September 2026, Sep 2026, Aug 2026)
  const monthNames = [
    { names: ['january', 'jan'], mm: '01' },
    { names: ['february', 'feb'], mm: '02' },
    { names: ['march', 'mar'], mm: '03' },
    { names: ['april', 'apr'], mm: '04' },
    { names: ['may'], mm: '05' },
    { names: ['june', 'jun'], mm: '06' },
    { names: ['july', 'jul'], mm: '07' },
    { names: ['august', 'aug'], mm: '08' },
    { names: ['september', 'sep', 'sept'], mm: '09' },
    { names: ['october', 'oct'], mm: '10' },
    { names: ['november', 'nov'], mm: '11' },
    { names: ['december', 'dec'], mm: '12' },
  ];

  for (const m of monthNames) {
    for (const name of m.names) {
      const regex = new RegExp(`\\b${name}\\s+(202[4-9]|203[0-9])\\b`, 'i');
      const match = text.match(regex);
      if (match) {
        return {
          isValid: true,
          detectedYyyyMm: `${match[1]}-${m.mm}`,
          fuzzyMatches: [],
          suggestedYyyyMm: `${match[1]}-${m.mm}`,
        };
      }
    }
  }

  // Scan for fuzzy matches
  const fuzzyMatches: string[] = [];
  let fuzzyResolvedYyyyMm: string | null = null;
  for (const item of FUZZY_TIMELINE_PATTERNS) {
    if (item.regex.test(text)) {
      fuzzyMatches.push(item.label);
      if (!fuzzyResolvedYyyyMm && item.resolved) {
        fuzzyResolvedYyyyMm = item.resolved;
      }
    }
  }

  // Derive suggestion from fuzzy match or fallback anchor date
  const anchorYyyyMm = fuzzyResolvedYyyyMm || fallbackAnchorDate.slice(0, 7) || '2026-09';

  return {
    isValid: false,
    detectedYyyyMm: fuzzyResolvedYyyyMm,
    fuzzyMatches,
    suggestedYyyyMm: anchorYyyyMm,
  };
}

/**
 * Pillar 1: Comprehensive Timeline Validation Engine
 * Cross-checks YYYY-MM, active Dasha window, and Gochara transit ingress.
 */
export function checkTimelinePrecisionAndAlignment(
  text: string,
  targetDate: string = '2026-09-07',
  activeDashaStr: string = 'Saturn-Mercury-Venus (2026-04-12 to 2026-09-22)'
): TimelineValidation {
  const evalResult = evaluateTimelinePrecision(text, targetDate);

  let status: TimelineValidation['status'] = 'requires_clarification';
  let normalizedTimeline = evalResult.suggestedYyyyMm;

  if (evalResult.isValid && evalResult.detectedYyyyMm) {
    status = 'verified';
    normalizedTimeline = evalResult.detectedYyyyMm;
  } else if (evalResult.detectedYyyyMm) {
    status = 'resolved_fuzzy';
    normalizedTimeline = evalResult.detectedYyyyMm;
  } else if (targetDate) {
    status = 'inferred_from_context';
    normalizedTimeline = targetDate.slice(0, 7) || '2026-09';
  }

  // Dasha window check: active canonical sub-period is Saturn-Mercury-Venus (Apr 2026 - Sep 2026)
  const isWithinActiveDasha =
    normalizedTimeline >= '2026-04' && normalizedTimeline <= '2026-09';

  const dashaAlignmentNote = isWithinActiveDasha
    ? `Directly aligned with active ${activeDashaStr} Vimshottari sub-period window.`
    : `Target chronology falls outside active ${activeDashaStr} sub-period; cross-epoch transit verification applied.`;

  const targetPeriodStr = targetDate.slice(0, 7) || '2026-09';
  const matchesTargetPeriod = normalizedTimeline === targetPeriodStr;

  let astrologicalChronologyNote = `Validated timeline anchor: ${normalizedTimeline}. `;
  if (status === 'resolved_fuzzy') {
    astrologicalChronologyNote += `Resolved fuzzy phrasing (${evalResult.fuzzyMatches.join(', ')}) to canonical calendar month ${normalizedTimeline}. `;
  }
  astrologicalChronologyNote += dashaAlignmentNote;

  return {
    isValid: evalResult.isValid || status === 'resolved_fuzzy',
    detectedYyyyMm: evalResult.detectedYyyyMm,
    normalizedTimeline,
    status,
    fuzzyMatches: evalResult.fuzzyMatches,
    suggestedYyyyMm: evalResult.suggestedYyyyMm,
    dashaWindowCheck: {
      activeDashaStr,
      isWithinActiveDasha,
      alignmentNote: dashaAlignmentNote,
    },
    transitPeriodCheck: {
      targetPeriod: targetPeriodStr,
      matchesTargetPeriod,
    },
    astrologicalChronologyNote,
  };
}

/**
 * Eliminates conversational filler and compresses text into high-density tokens
 */
export function compressNarrativeDensity(text: string): {
  compressedText: string;
  removedFillerCount: number;
  repetitiveNativeCount: number;
} {
  let cleaned = text;
  let fillerCount = 0;
  let nativePurgeCount = 0;

  for (const pat of FILLER_PATTERNS) {
    cleaned = cleaned.replace(pat, () => {
      fillerCount++;
      return '';
    });
  }

  // Detect and purge redundant, repetitive "native" or "the native" terms
  const nativeMatches = cleaned.match(/\b(the\s+native|native)\b/gi);
  if (nativeMatches && nativeMatches.length > 1) {
    nativePurgeCount = nativeMatches.length - 1;
    let first = true;
    cleaned = cleaned.replace(/\b(the\s+native|native)\b/gi, () => {
      if (first) {
        first = false;
        return 'the querent';
      }
      return 'they';
    });
  } else if (nativeMatches && nativeMatches.length === 1) {
    cleaned = cleaned.replace(/\b(the\s+native|native)\b/gi, 'the querent');
  }

  // Strip excessive spaces, orphan punctuation, and empty lines
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/[,\s]{2,}/g, ', ')
    .trim();

  return {
    compressedText: cleaned,
    removedFillerCount: fillerCount,
    repetitiveNativeCount: nativePurgeCount,
  };
}

/**
 * Domain Classifier: Categorizes query strictly by Astrological Bhava
 */
export function detectPrimaryAstrologicalDomain(text: string): AstrologicalDomainInfo {
  const lower = text.toLowerCase();

  // 1. Vehicles, Real Estate & Conveyance (4th House)
  if (
    lower.includes('car') ||
    lower.includes('bike') ||
    lower.includes('vehicle') ||
    lower.includes('purchase vehicle') ||
    lower.includes('property') ||
    lower.includes('house') ||
    lower.includes('flat') ||
    lower.includes('apartment') ||
    lower.includes('land') ||
    lower.includes('real estate') ||
    lower.includes('plot')
  ) {
    return {
      key: 'property_vehicle',
      bhava: 4,
      title: '4th House Bandhu / Sukha Bhava (Fixed Assets & Conveyances)',
      significator: 'Venus (Vahana Karaka) & Jupiter (Lagna Lord in 4th Pisces)',
      suggestedFocus: 'Vehicular conveyance durability, real estate title, and fixed asset accretion',
    };
  }

  // 2. Career, Profession, Transition & Authority (10th / 6th House)
  if (
    lower.includes('job') ||
    lower.includes('career') ||
    lower.includes('work') ||
    lower.includes('promotion') ||
    lower.includes('shift') ||
    lower.includes('switch') ||
    lower.includes('relocat') ||
    lower.includes('employ') ||
    lower.includes('role') ||
    lower.includes('office') ||
    lower.includes('business') ||
    lower.includes('startup') ||
    lower.includes('resignation') ||
    lower.includes('layoff')
  ) {
    return {
      key: 'career_profession',
      bhava: 10,
      title: '10th House Karma Bhava (Professional Elevation & Occupational Shift)',
      significator: 'Mercury (exalted in Kanya) & Sun (Surya - 9th Lord of Fortune)',
      suggestedFocus: 'Executive authority, occupational mobility, and D-10 Dasamsa confirmation',
    };
  }

  // 3. Marriage, Relationships & Partnerships (7th House)
  if (
    lower.includes('marriage') ||
    lower.includes('wedding') ||
    lower.includes('spouse') ||
    lower.includes('husband') ||
    lower.includes('wife') ||
    lower.includes('partner') ||
    lower.includes('relationship') ||
    lower.includes('alliance') ||
    lower.includes('divorce') ||
    lower.includes('match')
  ) {
    return {
      key: 'marriage_relationship',
      bhava: 7,
      title: '7th House Kalatra Bhava (Marital Alliances & Partnerships)',
      significator: 'Venus (Kalatra Karaka) & Jupiter (7th Lord of Gemini)',
      suggestedFocus: 'Alliance fruition, relationship harmony, and D-9 Navamsa verification',
    };
  }

  // 4. Wealth, Investments & Liquid Reserves (2nd / 11th House)
  if (
    lower.includes('money') ||
    lower.includes('wealth') ||
    lower.includes('finance') ||
    lower.includes('invest') ||
    lower.includes('stocks') ||
    lower.includes('crypto') ||
    lower.includes('salary') ||
    lower.includes('income') ||
    lower.includes('debt') ||
    lower.includes('loan') ||
    lower.includes('savings')
  ) {
    return {
      key: 'wealth_finance',
      bhava: 11,
      title: '2nd / 11th House Dhana & Labha Bhava (Financial Accretion)',
      significator: 'Jupiter (Dhana Karaka) & Saturn (2nd Lord of Liquid Assets)',
      suggestedFocus: 'Cash flow stability, investment timing, and D-2 Hora evaluation',
    };
  }

  // 5. Health, Vitality & Recuperation (6th / 8th House)
  if (
    lower.includes('health') ||
    lower.includes('illness') ||
    lower.includes('disease') ||
    lower.includes('medical') ||
    lower.includes('surgery') ||
    lower.includes('hospital') ||
    lower.includes('vitality') ||
    lower.includes('doctor') ||
    lower.includes('pain')
  ) {
    return {
      key: 'health_vitality',
      bhava: 6,
      title: '6th / 8th House Roga & Satru Bhava (Vitality & Recuperation)',
      significator: 'Mars (Kuja - Vitality) & Saturn (Sani - Ayush Karaka)',
      suggestedFocus: 'Physical recovery windows, vitality assessment, and practical lifestyle pacing',
    };
  }

  // 6. Higher Studies, Academic Degrees & Foreign Relocation (9th / 12th House)
  if (
    lower.includes('study') ||
    lower.includes('university') ||
    lower.includes('masters') ||
    lower.includes('phd') ||
    lower.includes('abroad') ||
    lower.includes('foreign') ||
    lower.includes('visa') ||
    lower.includes('immigration') ||
    lower.includes('spiritual')
  ) {
    return {
      key: 'higher_learning_relocation',
      bhava: 9,
      title: '9th / 12th House Dharma & Vyaya Bhava (Higher Knowledge & Foreign Horizons)',
      significator: 'Jupiter (Guru - Higher Learning) & Sun (Surya - Dharma)',
      suggestedFocus: 'Foreign institutional admission, visa fruition, and geographical relocation',
    };
  }

  // Default: Tanu Bhava (1st House)
  return {
    key: 'general_destiny',
    bhava: 1,
    title: '1st House Tanu Bhava (Lagna & Comprehensive Life Trajectory)',
    significator: 'Jupiter (Guru - Lagna Lord in 4th Pisces Hamsa Yoga)',
    suggestedFocus: 'Holistic life direction, temporal alignment, and Parashari synthesis',
  };
}

/**
 * Builds a high-density, context-window conscious story synopsis without repetitive jargon
 */
export function buildPrecisionStorySynopsis(
  domain: AstrologicalDomainInfo,
  cleanedText: string,
  timeline: string,
  verifiedAttributes: { origin?: string; intent?: string; channel?: string }
): string {
  const parts: string[] = [];
  parts.push(`Domain: ${domain.title}`);
  parts.push(`Temporal Horizon: ${timeline}`);

  if (verifiedAttributes.origin) {
    parts.push(`Catalyst: ${verifiedAttributes.origin}`);
  }
  if (verifiedAttributes.intent) {
    parts.push(`Strategic Intent: ${verifiedAttributes.intent}`);
  }
  if (verifiedAttributes.channel) {
    parts.push(`Execution Medium: ${verifiedAttributes.channel}`);
  }

  const cleanQuery = cleanedText
    .replace(/^the querent\s+(is\s+evaluating|seeks|wants|needs)\s*/i, '')
    .trim();

  parts.push(`Inquiry Summary: ${cleanQuery}`);

  return parts.join(' | ');
}

/**
 * Pillar 2: Narrative Construction Engine
 * Actively transforms unstructured, fragmented, or spoken user input into a professionally
 * formulated, coherent astrological narrative with background, catalyst, intent, and specific inquiries.
 * Does NOT just copy or concatenate raw input!
 */
export function buildStructuredAstrologicalNarrative(params: {
  rawSanitizedText: string;
  domain: AstrologicalDomainInfo;
  timeline: string;
  answeredQuestions?: ReasoningQuestion[];
  attributes?: { origin?: string; intent?: string; channel?: string };
}): StructuredAstrologicalNarrative {
  const { rawSanitizedText, domain, timeline, answeredQuestions = [], attributes = {} } = params;
  const lower = rawSanitizedText.toLowerCase();

  // Detect query topics
  const hasVehicle = lower.includes('vehicle') || lower.includes('car') || lower.includes('bike') || lower.includes('motor');
  const hasCareer = lower.includes('job') || lower.includes('career') || lower.includes('work') || lower.includes('bangalore') || lower.includes('promotion') || lower.includes('switch');
  const hasProperty = lower.includes('property') || lower.includes('house') || lower.includes('flat') || lower.includes('land') || lower.includes('plot');
  const hasMarriage = lower.includes('marriage') || lower.includes('wedding') || lower.includes('spouse') || lower.includes('partner') || lower.includes('alliance');
  const hasFinance = lower.includes('money') || lower.includes('invest') || lower.includes('finance') || lower.includes('stocks') || lower.includes('wealth');
  const hasHealth = lower.includes('health') || lower.includes('medical') || lower.includes('surgery') || lower.includes('illness');
  const hasRelocation = lower.includes('relocat') || lower.includes('bangalore') || lower.includes('abroad') || lower.includes('foreign') || lower.includes('shift');
  const hasSiblingOrJoint = lower.includes('brother') || lower.includes('sibling') || lower.includes('joint') || lower.includes('partner');

  // Extract explicit answers from questions
  let answeredOrigin = attributes.origin;
  let answeredIntent = attributes.intent;
  let answeredChannel = attributes.channel;

  for (const q of answeredQuestions) {
    if (q.isNotApplicable) continue;
    const val = (q.responseValue || '').trim();
    if (!val) continue;

    if (q.category === 'event_origin' || q.id === 'q_career_catalyst') {
      answeredOrigin = val;
    } else if (q.category === 'channel_medium' || q.id === 'q_property_type') {
      answeredChannel = val;
    } else if (q.category === 'core_intent' || q.category === 'domain_specific' || q.id === 'q_career_scope' || q.id === 'q_finance_intent' || q.id === 'q_relationship_focus' || q.id === 'q_health_scope') {
      answeredIntent = val;
    }
  }

  // 1. Querent Stance Formulation
  let querentStance = 'The querent is an active decision-maker evaluating strategic life milestones';
  if (hasVehicle && hasCareer) {
    querentStance = 'The querent is navigating simultaneous domestic asset modernization and occupational mobility';
  } else if (hasVehicle || hasProperty) {
    querentStance = 'The querent is evaluating a significant capital commitment toward fixed asset accretion and conveyance';
  } else if (hasCareer) {
    querentStance = 'The querent is strategically evaluating occupational trajectory, status elevation, and career progression';
  } else if (hasMarriage) {
    querentStance = 'The querent is actively discerning relational alignment and formal matrimonial commitment horizons';
  } else if (hasFinance) {
    querentStance = 'The querent is allocating financial reserves and seeking optimal capital growth and preservation timing';
  } else if (hasHealth) {
    querentStance = 'The querent is seeking temporal optimization for vitality stabilization, medical intervention, and physical recovery';
  }

  if (hasSiblingOrJoint) {
    querentStance += ', coordinating this decision collaboratively with family and sibling stakeholders';
  }

  // 2. Catalytic Trigger Formulation
  let catalyticTrigger = answeredOrigin || 'Driven by planned personal growth milestones and timely asset/career modernization requirements';
  if (!answeredOrigin) {
    if (hasCareer && hasRelocation) {
      catalyticTrigger = 'Prompted by corporate restructuring, regional market opportunities, and organizational compensation advancement';
    } else if (hasVehicle) {
      catalyticTrigger = 'Triggered by scheduled family conveyance requirements, operational mobility needs, and favorable capital allocation';
    } else if (hasMarriage) {
      catalyticTrigger = 'Instigated by mutual family alignment, readiness for marital partnership, and favorable transit alignment';
    } else if (hasProperty) {
      catalyticTrigger = 'Driven by long-term wealth stabilization goals and the strategic acquisition of real property assets';
    }
  }

  // 3. Strategic Intent Formulation
  let strategicIntent = answeredIntent || 'To execute this strategic milestone under Parashari planetary alignment while minimizing operational risk';
  if (!answeredIntent) {
    if (hasVehicle && hasCareer) {
      strategicIntent = `To synchronize vehicle acquisition in ${timeline} with a career transition/relocation, ensuring long-term conveyance durability and occupational stability`;
    } else if (hasVehicle) {
      strategicIntent = `To complete vehicle acquisition in ${timeline} with durable mechanical protection and auspicious conveyance karma`;
    } else if (hasCareer) {
      strategicIntent = `To secure optimal career positioning, leadership elevation, and professional fulfillment during the ${timeline} window`;
    } else if (hasMarriage) {
      strategicIntent = `To formalize matrimonial alliance timing in ${timeline} ensuring mutual compatibility, prosperity, and emotional resonance`;
    }
  }

  // 4. Execution Medium Formulation
  let executionMedium = answeredChannel || 'Structured via institutional capital channels with retained emergency liquidity buffers';
  if (!answeredChannel) {
    if (hasVehicle || hasProperty) {
      executionMedium = 'Secured through institutional lending with preserved liquid contingency capital and rigorous contractual review';
    } else if (hasCareer) {
      executionMedium = 'Executed via structured corporate lateral transition with negotiated deliverables and planned geographical relocation';
    }
  }

  // 5. Formulate Pakka Astrological Questions for Public Master LLM
  const formulatedQuestions: string[] = [];

  if (domain.bhava === 4 || hasVehicle || hasProperty) {
    formulatedQuestions.push(
      `4th House (Sukha Bhava) & Vahana Karaka Evaluation: Examine natal Jupiter in 4th Pisces Hamsa Yoga and transiting Venus/Jupiter vectors to evaluate conveyance durability, mechanical safety, and asset title clarity during ${timeline}.`
    );
  }

  if (domain.bhava === 10 || hasCareer) {
    formulatedQuestions.push(
      `10th House (Karma Bhava) & D-10 Dasamsa Assessment: Analyze 10th Lord Mercury and transiting Saturn in Pisces to determine whether occupational transition during ${timeline} yields sustainable status elevation or corporate friction.`
    );
  }

  if (hasMarriage || domain.bhava === 7) {
    formulatedQuestions.push(
      `7th House (Kalatra Bhava) & D-9 Navamsa Verification: Assess 7th Lord placements, Venus dignity, and Gochara transit aspects on Gemini/Sagittarius to confirm matrimonial alliance fruition windows.`
    );
  }

  if (hasFinance || domain.bhava === 11 || domain.bhava === 2) {
    formulatedQuestions.push(
      `2nd / 11th House (Dhana & Labha Bhava) Evaluation: Evaluate 2nd Lord Saturn and 11th Lord Venus to ensure liquidity buffers and verify favorable D-2 Hora wealth accretion.`
    );
  }

  // Add Universal Gochara & Dasha Question
  formulatedQuestions.push(
    `Vimshottari Dasha & Gochara Ingress Synchronization: Correlate active Saturn-Mercury-Venus sub-periods with Gochara transits across Dhanusu Lagna and Vrishchika Moon for ${timeline} to determine precise execution dates.`
  );

  // Add Practical Realities Question
  formulatedQuestions.push(
    `Practical Real-World Risk Realities: Formulate concrete operational due diligence, contractual milestones, and liquidity safeguards—strictly excluding any superstitious rituals, mantras, or gemstones.`
  );

  // 6. Master Synthesized Cohesive Narrative
  const title = hasVehicle && hasCareer
    ? 'Dual Horizon: 4th House Conveyance Acquisition & 10th House Occupational Relocation'
    : hasVehicle
    ? '4th House Fixed Asset & Vehicular Conveyance Acquisition Inquiry'
    : hasCareer
    ? '10th House Professional Elevation & Occupational Transition Inquiry'
    : `${domain.title} Strategic Horoscopic Inquiry`;

  const synthesizedNarrative = `${querentStance}. The primary objective is ${strategicIntent.toLowerCase()}, targeted specifically for execution in ${timeline}. Catalytic context: ${catalyticTrigger}. Implementation structure: ${executionMedium}. The querent mandates authoritative Maharishi Parashara BPHS analysis across D-1 Rasi, D-9 Navamsa, and relevant divisional vargas, assessing Gochara ingress vectors and Vimshottari Dasha sub-periods to deliver definitive timing recommendations grounded strictly in pragmatic, real-world operational realities.`;

  const summaryDossier = `[Inquiry Dossier: ${title}] | Target Chronology: ${timeline} | Stance: ${querentStance} | Catalyst: ${catalyticTrigger} | Strategic Goal: ${strategicIntent} | Medium: ${executionMedium}`;

  return {
    title,
    querentStance,
    catalyticTrigger,
    strategicIntent,
    executionMedium,
    formulatedQuestions,
    synthesizedNarrative,
    summaryDossier,
  };
}

/**
 * Pillar 3: Pakka Astrological Reasoning Formulation Engine
 * Generates air-tight astrological house mappings, significator karakas, divisional varga
 * requirements, and specific directives for the Master Public LLM.
 */
export function formulatePakkaAstrologicalReasoning(
  domain: AstrologicalDomainInfo,
  timeline: string,
  narrativeText: string
): PakkaAstrologicalReasoning {
  const lower = narrativeText.toLowerCase();

  // Primary Bhava configuration
  let primaryBhava = {
    house: domain.bhava,
    name: domain.title.split('(')[0].trim(),
    domain: domain.suggestedFocus,
    karakas: domain.significator,
    significatorGrahas: ['Jupiter', 'Venus'],
    justification: `Primary inquiry locus mapped to ${domain.title} based on core querent objectives.`,
  };

  if (domain.bhava === 4) {
    primaryBhava = {
      house: 4,
      name: '4th House Bandhu / Sukha Bhava',
      domain: 'Fixed assets, vehicular conveyances, domestic tranquility, and real estate title',
      karakas: 'Venus (Vahana Karaka) & Jupiter (4th Lord in Pisces Hamsa Yoga)',
      significatorGrahas: ['Jupiter', 'Venus', 'Mars'],
      justification: 'Vehicular acquisition and property transactions are governed by the 4th house and Venus as Vahana Karaka.',
    };
  } else if (domain.bhava === 10) {
    primaryBhava = {
      house: 10,
      name: '10th House Karma Bhava',
      domain: 'Professional status, career elevation, public authority, and occupational mobility',
      karakas: 'Sun (Surya - Status) & Mercury (Budha - Commerce & Skill)',
      significatorGrahas: ['Mercury', 'Sun', 'Saturn'],
      justification: 'Professional promotions and job transitions require scrutiny of the 10th house and 10th Lord in D-1 and D-10.',
    };
  }

  // Secondary Bhavas
  const secondaryBhavas: PakkaAstrologicalReasoning['secondaryBhavas'] = [];

  if (lower.includes('job') || lower.includes('career') || domain.bhava === 4) {
    secondaryBhavas.push({
      house: 10,
      name: '10th House Karma Bhava',
      domain: 'Occupational stability & corporate role alignment',
      relevance: 'Verifies professional compensation growth to sustain conveyance/capital commitments.',
    });
  }

  secondaryBhavas.push({
    house: 2,
    name: '2nd House Dhana Bhava',
    domain: 'Liquid net worth, capital reserves, and family stability',
    relevance: 'Assesses financial liquidity retention to prevent overleveraging during asset acquisitions.',
  });

  if (lower.includes('brother') || lower.includes('sibling')) {
    secondaryBhavas.push({
      house: 3,
      name: '3rd House Sahaja Bhava',
      domain: 'Sibling dynamics, courage, short journeys, and initiative',
      relevance: 'Evaluates joint collaboration and shared decision alignment with siblings.',
    });
  }

  secondaryBhavas.push({
    house: 6,
    name: '6th House Satru / Roga / Rina Bhava',
    domain: 'Debt obligations, institutional loans, and professional competition',
    relevance: 'Evaluates debt servicing capability and competitive positioning in corporate shifts.',
  });

  // Mandated Divisional Vargas
  const mandatedVargas: PakkaAstrologicalReasoning['mandatedVargas'] = [
    { id: 'D1', name: 'D-1 Rasi Chart', focus: 'Foundational planetary coordinates, house ownerships, and primary dignity' },
    { id: 'D9', name: 'D-9 Navamsa Chart', focus: 'Planetary fruition, inner fortitude, spiritual dharma, and alliance stability' },
  ];

  if (domain.bhava === 10 || lower.includes('job') || lower.includes('career')) {
    mandatedVargas.push({
      id: 'D10',
      name: 'D-10 Dasamsa Chart',
      focus: 'Executive authority, public reputation, occupational mobility, and professional success',
    });
  }

  if (domain.bhava === 4 || lower.includes('vehicle') || lower.includes('property') || lower.includes('car')) {
    mandatedVargas.push({
      id: 'D4',
      name: 'D-4 Chaturthamsa Chart',
      focus: 'Fixed asset accretion, land holdings, real estate conveyances, and vehicular fortunes',
    });
  }

  mandatedVargas.push({
    id: 'D2',
    name: 'D-2 Hora Chart',
    focus: 'Liquid asset accumulation, financial resilience, and wealth-building capacity',
  });

  // Key transit vectors
  const keyTransitVectorsToCheck = [
    `Jupiter transit through Cancer (exalted 8th from Lagna) aspecting 4th house Pisces and 12th house Scorpio.`,
    `Saturn transit in Pisces (4th house from Dhanusu Lagna) transiting natal Jupiter's Hamsa Yoga domain.`,
    `Rahu transit in Aquarius (3rd house) and Ketu in Leo (9th house) signaling decisive proactive initiatives.`,
    `Transit Mercury and Venus positions relative to natal Moon in Scorpio (Vrishchika).`,
  ];

  // Master LLM Reasoning Directives
  const masterLlmDirectives = [
    `Scrutinize D-1 and D-4/D-10 planetary configurations for the validated timeline (${timeline}).`,
    `Compute Ashtakavarga bindu counts in Pisces (4th house) and Cancer (8th house) to confirm transit resilience.`,
    `Cross-reference the active Saturn-Mercury-Venus Vimshottari Dasha sub-period with Gochara transit vectors.`,
    `Deliver clear, decisive timing windows: isolate optimal calendar dates within ${timeline} vs dates with transit friction.`,
    `Strictly enforce the Practical Realities Mandate: replace all mystical/ritual remedies with operational due diligence, contract auditing, and liquidity preservation buffers.`,
  ];

  // Practical Realities Mandate
  const practicalRealitiesMandate = [
    'Contractual & Title Audit: Verify ownership papers, warranty terms, and lender clauses before commitment.',
    'Liquidity Buffer: Maintain a 6-month liquid operating buffer rather than exhausting cash on down-payments.',
    'Phased Milestone Pacing: Structure career transition deliverables based on signed agreements, not verbal promises.',
    'Zero Superstition: Strictly exclude gemstones, astrological rings, pujas, temple rituals, and deity propitiations.',
  ];

  return {
    primaryBhava,
    secondaryBhavas,
    mandatedVargas,
    keyTransitVectorsToCheck,
    masterLlmDirectives,
    practicalRealitiesMandate,
  };
}

/**
 * Main Reasoning Servant Evaluation Engine (Pillars 1, 2, 3)
 * Operates as local servant to Claude/Gemini, enforcing:
 * 1. Mandatory YYYY-MM timeline precision & Dasha alignment
 * 2. Narrative construction: active synthesis into an articulate, structured astrological dossier
 * 3. Pakka astrological reasoning: Bhava/Karaka alignment, varga mandates & practical realities directives
 */
export function evaluateWithPrivateLlmServant(
  rawInput: string,
  targetDate: string = '2026-09-07'
): ServantEvaluationResult {
  // Step 1: Run local PII sanitization (without butchering pronouns into repetitive 'native')
  const piiResult = runTwoStageSanitization(rawInput);
  const sanitized = piiResult.stage2Llama8BScrubbed;

  // Step 2: Spell/Grammar correction
  const { correctedText } = preprocessAndCorrectText(sanitized);

  // Step 3: Density Tuning & Redundant 'Native' Cliché Purge
  const { compressedText, removedFillerCount, repetitiveNativeCount } = compressNarrativeDensity(correctedText);

  // Step 4: Pillar 1 - Timeline Validation & Dasha Alignment
  const timelineValidation = checkTimelinePrecisionAndAlignment(compressedText, targetDate);
  const normalizedTimeline = timelineValidation.normalizedTimeline;

  // Step 5: Detect Astrological Domain (Bhava-Gated Logic)
  const detectedDomain = detectPrimaryAstrologicalDomain(compressedText);

  // Step 6: Pillar 3 - Formulate Pakka Astrological Reasoning Framework
  const pakkaReasoning = formulatePakkaAstrologicalReasoning(detectedDomain, normalizedTimeline, compressedText);

  // Step 7: Pillar 2 - Build Structured Astrological Narrative
  const structuredNarrative = buildStructuredAstrologicalNarrative({
    rawSanitizedText: compressedText,
    domain: detectedDomain,
    timeline: normalizedTimeline,
  });

  // Step 8: Domain-Gated Smart Questioning (NO FILLERS)
  const lower = compressedText.toLowerCase();
  const questions: ReasoningQuestion[] = [];

  // 1. Mandatory Timeline Question (if ambiguous or missing strict YYYY-MM)
  if (!timelineValidation.isValid) {
    questions.push({
      id: 'q_timeline',
      pillar: 'timeline',
      category: 'timeline_yyyy_mm',
      title: 'Mandatory Chronological Timeline (YYYY-MM)',
      description: timelineValidation.fuzzyMatches.length > 0
        ? `Ambiguous temporal expressions detected (${timelineValidation.fuzzyMatches.join(', ')}). A strict YYYY-MM format is required.`
        : 'No specific calendar month/year was identified in your narrative.',
      astrologicalJustification:
        'Parashari Gochara transit calculations require precise ephemeris degrees and Vimshottari Pratyantardasha window isolation.',
      suggestedValue: timelineValidation.suggestedYyyyMm,
      responseValue: timelineValidation.suggestedYyyyMm,
      isNotApplicable: false,
      domainLabel: 'Chronological Anchor',
    });
  }

  // Analyze if narrative already contains origin/catalyst and intent
  const hasOriginKeywords =
    lower.includes('because') ||
    lower.includes('due to') ||
    lower.includes('restructur') ||
    lower.includes('offer') ||
    lower.includes('prompt') ||
    lower.includes('driven by') ||
    lower.includes('reason');

  const hasIntentKeywords =
    lower.includes('goal') ||
    lower.includes('intent') ||
    lower.includes('aim') ||
    lower.includes('looking for') ||
    lower.includes('expecting') ||
    lower.includes('target') ||
    lower.includes('want to') ||
    lower.includes('seeking');

  // Word count check: if narrative is already sufficiently rich (> 22 words with clear context), avoid asking redundant filler
  const wordsCount = compressedText.split(/\s+/).filter(Boolean).length;
  const isNarrativeSelfContained = wordsCount >= 22 && (hasOriginKeywords || hasIntentKeywords);

  // Domain-Specific Intelligent Questions (strictly gated by Bhava; max 1 sharp question)
  if (!isNarrativeSelfContained) {
    if (detectedDomain.key === 'career_profession') {
      const mentionsScope = lower.includes('promot') || lower.includes('lateral') || lower.includes('switch') || lower.includes('startup') || lower.includes('business');
      if (!mentionsScope) {
        questions.push({
          id: 'q_career_scope',
          pillar: 'fullness',
          category: 'domain_specific',
          title: 'Career Transition Scope & Organizational Trajectory',
          description:
            'Is this career transition an internal promotion within the current hierarchy, an external lateral move to a new company, or an entrepreneurial enterprise?',
          astrologicalJustification:
            'Differentiates 10th Lord Mercury aspecting 1st house (internal status elevation) from 6th/10th house Dusthana transitions (external competitive mobility).',
          suggestedValue: 'External lateral recruitment into executive leadership role.',
          responseValue: '',
          isNotApplicable: false,
          domainLabel: '10th House Karma Scope',
        });
      } else if (!hasOriginKeywords) {
        questions.push({
          id: 'q_career_catalyst',
          pillar: 'fullness',
          category: 'event_origin',
          title: 'Primary Professional Catalyst',
          description:
            'What specific catalyst is driving this transition at this time? (e.g. organizational restructuring, compensation growth milestone, leadership stagnation, relocation).',
          astrologicalJustification:
            'Determines whether the catalyst originates in Kendra (proactive strategic initiative) or Dusthana (reaction to corporate disruption).',
          suggestedValue: 'Compensation growth milestone and broader operational scope.',
          responseValue: '',
          isNotApplicable: false,
          domainLabel: '10th House Catalyst',
        });
      }
    } else if (detectedDomain.key === 'property_vehicle') {
      questions.push({
        id: 'q_property_type',
        pillar: 'fullness',
        category: 'channel_medium',
        title: 'Asset Classification & Capitalization Medium',
        description:
          'Is this asset acquisition a residential property, commercial holding, or vehicular conveyance, and will it be self-capitalized or institutionally leveraged?',
        astrologicalJustification:
          'Evaluates 4th Lord Jupiter in Pisces (fixed tangible assets) vs 2nd Lord Saturn (liquid capital) and 6th House (debt obligations).',
        suggestedValue: 'Residential property partially funded through institutional mortgage.',
        responseValue: '',
        isNotApplicable: false,
        domainLabel: '4th House Asset Verification',
      });
    } else if (detectedDomain.key === 'marriage_relationship') {
      questions.push({
        id: 'q_relationship_focus',
        pillar: 'fullness',
        category: 'core_intent',
        title: 'Alliance Stage & Core Objective',
        description:
          'Is this inquiry focused on timing a new matrimonial alliance/engagement, or addressing communication and alignment in an established relationship?',
        astrologicalJustification:
          'Aligns 7th Lord Mercury in D-9 Navamsa with active Dasha periods to differentiate alliance fruition windows from transit friction.',
        suggestedValue: 'Timing of formal matrimonial alliance and family agreement.',
        responseValue: '',
        isNotApplicable: false,
        domainLabel: '7th House Alliance Horizon',
      });
    } else if (detectedDomain.key === 'health_vitality') {
      questions.push({
        id: 'q_health_scope',
        pillar: 'fullness',
        category: 'core_intent',
        title: 'Vitality & Intervention Context',
        description:
          'Does this concern acute medical intervention/surgical timing, chronic vitality recovery, or proactive lifestyle balancing?',
        astrologicalJustification:
          'Correlates 6th house Roga indications with Mars (acute surgery) vs Saturn retrograde (chronic endurance) in Cancer.',
        suggestedValue: 'Elective medical intervention and vitality recovery window.',
        responseValue: '',
        isNotApplicable: false,
        domainLabel: '6th House Vitality Context',
      });
    } else if (detectedDomain.key === 'wealth_finance') {
      questions.push({
        id: 'q_finance_intent',
        pillar: 'fullness',
        category: 'core_intent',
        title: 'Capital Objective & Risk Horizon',
        description:
          'What is the primary financial objective? (e.g. strategic equity investment, debt retirement, major capital allocation, or liquidity preservation).',
        astrologicalJustification:
          'Assesses 2nd Lord Saturn (liquid net worth) vs 11th Lord Venus (gain streams) to verify favorable D-2 Hora wealth yogas.',
        suggestedValue: 'Long-term equity investment and capital appreciation.',
        responseValue: '',
        isNotApplicable: false,
        domainLabel: '2nd/11th House Wealth Objective',
      });
    } else if (questions.length === 0 && !hasIntentKeywords) {
      questions.push({
        id: 'q_general_intent',
        pillar: 'fullness',
        category: 'core_intent',
        title: 'Primary Desired Strategic Outcome',
        description:
          'What is the single most important strategic outcome you seek to achieve from this decision?',
        astrologicalJustification:
          'Aligns the Parashari synthesis with Artha (wealth/duty) or Dharma (spiritual purpose).',
        suggestedValue: 'Long-term stability, peace of mind, and measurable growth.',
        responseValue: '',
        isNotApplicable: false,
        domainLabel: 'Strategic Alignment',
      });
    }
  }

  const rawWords = rawInput.split(/\s+/).filter(Boolean).length;
  const compressedWords = compressedText.split(/\s+/).filter(Boolean).length;
  const reductionPercent = rawWords > 0 ? Math.max(0, Math.round(((rawWords - compressedWords) / rawWords) * 100)) : 0;

  // Generate precision story synopsis
  const storySynopsis = buildPrecisionStorySynopsis(detectedDomain, compressedText, normalizedTimeline, {});

  return {
    hasGaps: questions.length > 0,
    timelineValid: timelineValidation.isValid,
    detectedTimeline: timelineValidation.detectedYyyyMm || undefined,
    normalizedTimeline,
    timelineValidation,
    questions,
    rawText: rawInput,
    sanitizedText: sanitized,
    compressedNarrative: compressedText,
    storySynopsis,
    detectedDomain,
    structuredNarrative,
    pakkaReasoning,
    extractedAttributes: {
      timeline: normalizedTimeline,
    },
    metrics: {
      rawWords,
      compressedWords,
      tokenCompressionRatio: `${reductionPercent}% token reduction`,
      fillerWordsRemoved: removedFillerCount,
      gapsIdentifiedCount: questions.length,
      repetitiveNativeWordsPurged: repetitiveNativeCount,
      estimatedTokensSaved: Math.round((rawWords - compressedWords) * 1.33) + (repetitiveNativeCount * 2),
    },
  };
}

/**
 * State Merging: Merges modal popup responses with original session context,
 * scrubbing any N/A entries permanently, and dynamically re-synthesizing the
 * structured narrative and pakka reasoning directives.
 * DOES NOT simply concatenate raw strings!
 */
export function mergeServantState(
  originalResult: ServantEvaluationResult,
  answeredQuestions: ReasoningQuestion[]
): {
  mergedNarrative: string;
  finalTimeline: string;
  validAnswers: ReasoningQuestion[];
  scrubbedCount: number;
  updatedStorySynopsis: string;
  updatedStructuredNarrative: StructuredAstrologicalNarrative;
  updatedPakkaReasoning: PakkaAstrologicalReasoning;
  updatedTimelineValidation: TimelineValidation;
} {
  let finalTimeline = originalResult.normalizedTimeline;
  const validAnswers: ReasoningQuestion[] = [];
  let scrubbedCount = 0;

  const verifiedAttributes: { origin?: string; intent?: string; channel?: string } = {};

  for (const q of answeredQuestions) {
    if (q.isNotApplicable) {
      scrubbedCount++;
      continue; // Scrubbed completely per SRS requirement
    }

    const val = (q.responseValue || '').trim();
    if (!val) continue;

    validAnswers.push(q);

    if (q.category === 'timeline_yyyy_mm') {
      const match = val.match(/\b(202[4-9]|203[0-9])-(0[1-9]|1[0-2])\b/);
      if (match) {
        finalTimeline = match[0];
      }
    } else if (q.category === 'event_origin' || q.id === 'q_career_catalyst') {
      verifiedAttributes.origin = val;
    } else if (q.category === 'channel_medium' || q.id === 'q_property_type') {
      verifiedAttributes.channel = val;
    } else if (
      q.category === 'core_intent' ||
      q.category === 'domain_specific' ||
      q.id === 'q_career_scope' ||
      q.id === 'q_relationship_focus' ||
      q.id === 'q_health_scope' ||
      q.id === 'q_finance_intent'
    ) {
      verifiedAttributes.intent = val;
    }
  }

  // Pillar 1 Re-validation
  const updatedTimelineValidation = checkTimelinePrecisionAndAlignment(
    finalTimeline,
    finalTimeline
  );

  // Pillar 2 Re-synthesis: Dynamically re-build the structured narrative with the answered context
  const updatedStructuredNarrative = buildStructuredAstrologicalNarrative({
    rawSanitizedText: originalResult.compressedNarrative,
    domain: originalResult.detectedDomain,
    timeline: finalTimeline,
    answeredQuestions: validAnswers,
    attributes: verifiedAttributes,
  });

  // Pillar 3 Re-formulation: Pakka Astrological Reasoning
  const updatedPakkaReasoning = formulatePakkaAstrologicalReasoning(
    originalResult.detectedDomain,
    finalTimeline,
    updatedStructuredNarrative.synthesizedNarrative
  );

  const updatedStorySynopsis = buildPrecisionStorySynopsis(
    originalResult.detectedDomain,
    originalResult.compressedNarrative,
    finalTimeline,
    verifiedAttributes
  );

  return {
    mergedNarrative: updatedStructuredNarrative.synthesizedNarrative,
    finalTimeline,
    validAnswers,
    scrubbedCount,
    updatedStorySynopsis,
    updatedStructuredNarrative,
    updatedPakkaReasoning,
    updatedTimelineValidation,
  };
}

/**
 * Executes the Private LLM Reasoning Agent against unformatted text.
 * If local Ollama daemon is reachable, dispatches generation with keep_alive: 0.
 * Seamlessly merges into the 3-Pillar Context Engine & 3-Form XML.
 */
export async function runPrivateLlmReasoningAgent(
  rawInput: string,
  targetDate: string = '2026-09-07',
  modelTag?: string,
  endpoint?: string
): Promise<ServantEvaluationResult> {
  const monitor = getResourceMonitorState();
  const activeTag = modelTag || 'qwen2.5:14b';
  notifyModelLoaded(activeTag);

  let transformedByOllama: string | null = null;
  let privateLlmResponse = '';
  let privateLlmError = '';
  const cleanEndpoint = (endpoint || monitor.ollamaEndpoint || 'http://localhost:11434')
    .replace(/\/+$/, '')
    .replace(/\/v1\/?$/, '');
  const sanitizedInput = runTwoStageSanitization(rawInput).stage2Llama8BScrubbed;
  const privateLlmPrompt = `You are a Private Narrative Transformation Agent for a Public LLM.

Your task is to transform the user's unformatted narrative into one clear, factual narrative that a Public LLM can analyze.

This is a text-rewriting task, not a request for personal advice. You must process the narrative even when it mentions career decisions, job searches, finances, vehicles, relocation, health, or relationships. Do not refuse, moralize, or say that you cannot help. Do not make the decision for the user; only restate the user's situation and requested analysis scope.

Rules:
- Do not answer the astrology.
- Do not produce a long dossier or a list of generic questions.
- Preserve the user's actual intent, events, locations, and stated timelines.
- Do not invent dates, planetary positions, yogas, outcomes, or personal facts.
- Keep redacted values redacted. Never restore private identifiers.
- Remove greetings, repetition, filler, and vague wording.
- Combine related events into one coherent narrative.
- Ask clarification questions only when essential information is missing.
- Include no more than 3 clarification questions.
- Do not recommend remedies, gemstones, rituals, pujas, or mantras.

Return exactly this format:

TRANSFORMED NARRATIVE:
Write one complete paragraph describing what the user is planning or concerned about, the relevant life domains, the specific events, the stated timeline, and what the Public LLM must analyze.

CLARIFICATION QUESTIONS:
List only essential questions that cannot be answered from the narrative. If none are required, write NONE.

UNFORMATTED USER NARRATIVE (PII-SANITIZED):
"${sanitizedInput}"

The transformed narrative is the primary output. Do not return only questions.`;

  if (rawInput && rawInput.trim().length > 0) {
    try {
      const response = await fetch(`${cleanEndpoint}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeTag,
            prompt: privateLlmPrompt,
          stream: false,
          keep_alive: 0,
        }),
      });

      console.info('[Private LLM] Qwen response received', {
        model: activeTag,
        endpoint: `${cleanEndpoint}/api/generate`,
        status: response.status,
        ok: response.ok,
      });

      if (response.ok) {
        const data = await response.json();
        privateLlmResponse = typeof data.response === 'string' ? data.response.trim() : '';
        if (data.response && data.response.trim().length > 15) {
          transformedByOllama = data.response.trim();
        } else {
          privateLlmError = 'Private LLM returned an empty or too-short response.';
        }
      } else {
        const errorText = await response.text();
        privateLlmError = `HTTP ${response.status}: ${errorText.slice(0, 500)}`;
        console.error('[Private LLM] Qwen request failed:', {
          model: activeTag,
          endpoint: `${cleanEndpoint}/api/generate`,
          status: response.status,
          error: errorText,
        });
      }
    } catch (error) {
      console.error('[Private LLM] Qwen request unavailable; using local fallback:', {
        model: activeTag,
        endpoint: `${cleanEndpoint}/api/generate`,
        error,
      });
      privateLlmError = error instanceof Error ? error.message : 'Private LLM request failed.';
      // Gracefully fall back to local rule-based Vedic parser
    }
  }

  const baseResult = evaluateWithPrivateLlmServant(rawInput, targetDate);
  if (transformedByOllama) {
    console.info('[Private LLM] Workbench will use the Qwen narrative instead of local fallback.');
    return {
      ...baseResult,
      privateLlmSucceeded: true,
      privateLlmPrompt,
      privateLlmResponse,
      compressedNarrative: transformedByOllama,
      structuredNarrative: {
        ...baseResult.structuredNarrative,
        synthesizedNarrative: transformedByOllama,
      },
    };
  }
  console.warn('[Private LLM] Workbench is using the local rule-based narrative fallback.');
  return {
    ...baseResult,
    privateLlmSucceeded: false,
    privateLlmPrompt,
    privateLlmResponse,
    privateLlmError: privateLlmError || 'Private LLM response was not available; local fallback was used.',
  };
}

