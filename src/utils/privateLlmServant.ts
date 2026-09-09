// Specification ID: SRS-REQ-1.3-1.4
// Requirements 1.3 & 1.4: Private LLM Intelligent Intake & Reasoning Engine
// Architectural Role: Reasoning Servant to Master Public LLM (Claude/Gemini)
// Optimized for: DeepSeek 32B (R1-Distill), Qwen 2.5 14B/32B, and Llama 3.1 8B
// 3 Core Pillars:
//   Pillar 1: Timeline Validation Engine (Mandatory YYYY-MM)
//   Pillar 2: Narrative Fullness & Domain-Aware Questioning (Zero Fillers, Domain-Gated)
//   Pillar 3: Context-Window Optimization & Precision Story Formulation (No repetitive "native")

import { runTwoStageSanitization } from './piiSanitizer';
import { preprocessAndCorrectText } from './intelligentPromptEngine';

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

export interface ServantEvaluationResult {
  hasGaps: boolean;
  timelineValid: boolean;
  detectedTimeline?: string;
  normalizedTimeline: string; // strictly YYYY-MM
  questions: ReasoningQuestion[];
  rawText: string;
  sanitizedText: string;
  compressedNarrative: string;
  storySynopsis: string; // High-density precision synopsis, 0% repetitive 'native' jargon
  detectedDomain: AstrologicalDomainInfo;
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
  { regex: /\b(somewhere\s+in\s+winter|in\s+winter)\b/i, label: 'ambiguous winter reference' },
  { regex: /\b(next\s+summer|in\s+summer|summer\s+time)\b/i, label: 'ambiguous summer reference' },
  { regex: /\b(next\s+year|coming\s+year|by\s+next\s+year)\b/i, label: 'relative next year reference' },
  { regex: /\b(a\s+few\s+months|in\s+a\s+few\s+months|coming\s+months)\b/i, label: 'vague future months' },
  { regex: /\b(recently|lately|a\s+few\s+years\s+ago|some\s+time\s+back)\b/i, label: 'vague past period' },
  { regex: /\b(around\s+diwali|last\s+diwali|next\s+diwali)\b/i, label: 'festival calendar offset without year' },
  { regex: /\b(soon|asap|anytime\s+soon)\b/i, label: 'undefined near-term indicator' },
  { regex: /\b(mid\s*2026|mid-2026)\b/i, label: 'mid-year span (needs specific YYYY-MM)' },
];

/**
 * Evaluates narrative for strict YYYY-MM chronological anchors
 */
export function evaluateTimelinePrecision(text: string, fallbackAnchorDate: string = '2026-09-07'): {
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
  for (const item of FUZZY_TIMELINE_PATTERNS) {
    if (item.regex.test(text)) {
      fuzzyMatches.push(item.label);
    }
  }

  // Derive suggestion from fallback anchor date
  const anchorYyyyMm = fallbackAnchorDate.slice(0, 7) || '2026-09';

  return {
    isValid: false,
    detectedYyyyMm: null,
    fuzzyMatches,
    suggestedYyyyMm: anchorYyyyMm,
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
    // Keep first instance as "the querent", replace subsequent repetitive mentions with natural pronouns
    let first = true;
    cleaned = cleaned.replace(/\b(the\s+native|native)\b/gi, (match) => {
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
 * Prevents asking irrelevant questions (e.g. asking for vehicle financing in career/marriage queries)
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
 * Main Reasoning Servant Evaluation Engine (Pillars 1, 2, 3)
 * Operates as local servant to Claude/Gemini, enforcing:
 * 1. Mandatory YYYY-MM timeline precision
 * 2. Intelligent, domain-aware questions (no generic filler questions)
 * 3. Context window optimization & clean querent narrative synthesis
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

  // Step 4: Pillar 1 - Timeline Validation
  const timelineEval = evaluateTimelinePrecision(compressedText, targetDate);

  // Step 5: Detect Astrological Domain (Bhava-Gated Logic)
  const detectedDomain = detectPrimaryAstrologicalDomain(compressedText);

  // Step 6: Pillar 2 - Domain-Gated Smart Questioning (NO FILLERS)
  const lower = compressedText.toLowerCase();
  const questions: ReasoningQuestion[] = [];

  // 1. Mandatory Timeline Question (if ambiguous or missing strict YYYY-MM)
  if (!timelineEval.isValid) {
    questions.push({
      id: 'q_timeline',
      pillar: 'timeline',
      category: 'timeline_yyyy_mm',
      title: 'Mandatory Chronological Timeline (YYYY-MM)',
      description: timelineEval.fuzzyMatches.length > 0
        ? `Ambiguous temporal expressions detected (${timelineEval.fuzzyMatches.join(', ')}). A strict YYYY-MM format is required.`
        : 'No specific calendar month/year was identified in your narrative.',
      astrologicalJustification:
        'Parashari Gochara transit calculations require precise ephemeris degrees and Vimshottari Pratyantardasha window isolation.',
      suggestedValue: timelineEval.suggestedYyyyMm,
      responseValue: timelineEval.suggestedYyyyMm,
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

  // Word count check: if narrative is already sufficiently rich (> 20 words with clear context), avoid asking redundant filler
  const wordsCount = compressedText.split(/\s+/).filter(Boolean).length;
  const isNarrativeSelfContained = wordsCount >= 22 && (hasOriginKeywords || hasIntentKeywords);

  // 2. Domain-Specific Intelligent Questions (strictly gated by Bhava; max 1 sharp question)
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
      // General inquiry fallback (at most 1 question)
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
  const normalizedTimeline = timelineEval.detectedYyyyMm || timelineEval.suggestedYyyyMm;

  // Generate precision story synopsis
  const storySynopsis = buildPrecisionStorySynopsis(detectedDomain, compressedText, normalizedTimeline, {});

  return {
    hasGaps: questions.length > 0,
    timelineValid: timelineEval.isValid,
    detectedTimeline: timelineEval.detectedYyyyMm || undefined,
    normalizedTimeline,
    questions,
    rawText: rawInput,
    sanitizedText: sanitized,
    compressedNarrative: compressedText,
    storySynopsis,
    detectedDomain,
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
 * scrubbing any N/A entries permanently, and generating the consolidated, token-dense narrative.
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
} {
  let finalTimeline = originalResult.normalizedTimeline;
  const validAnswers: ReasoningQuestion[] = [];
  let scrubbedCount = 0;

  const verifiedAttributes: { origin?: string; intent?: string; channel?: string } = {};
  const contextAdditions: string[] = [];

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
      contextAdditions.push(`Trigger: ${val}`);
    } else if (q.category === 'channel_medium' || q.id === 'q_property_type') {
      verifiedAttributes.channel = val;
      contextAdditions.push(`Channel: ${val}`);
    } else if (q.category === 'core_intent' || q.category === 'domain_specific' || q.id === 'q_career_scope' || q.id === 'q_relationship_focus' || q.id === 'q_health_scope' || q.id === 'q_finance_intent') {
      verifiedAttributes.intent = val;
      contextAdditions.push(`Focus: ${val}`);
    }
  }

  // Combine into clean, high-density validated narrative with 0% repetitive 'native' jargon
  let merged = originalResult.compressedNarrative;
  if (contextAdditions.length > 0) {
    merged = `${merged}. [Context Verified: ${contextAdditions.join(' | ')}]`;
  }

  const updatedStorySynopsis = buildPrecisionStorySynopsis(
    originalResult.detectedDomain,
    originalResult.compressedNarrative,
    finalTimeline,
    verifiedAttributes
  );

  return {
    mergedNarrative: merged,
    finalTimeline,
    validAnswers,
    scrubbedCount,
    updatedStorySynopsis,
  };
}

