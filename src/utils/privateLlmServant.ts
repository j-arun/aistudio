// Specification ID: SRS-REQ-1.3-1.4
// Requirements 1.3 & 1.4: Private LLM Intelligent Intake & Reasoning Engine
// Architectural Role: Reasoning Servant to Master Public LLM (Claude/Gemini)
// 3 Core Pillars:
//   Pillar 1: Timeline Validation Engine (Mandatory YYYY-MM)
//   Pillar 2: Narrative Fullness Evaluator (Origin, Channel, Intent)
//   Pillar 3: Reasoning & Payload Efficiency Tuning (No filler, High-Density XML)

import { runTwoStageSanitization } from './piiSanitizer';
import { preprocessAndCorrectText } from './intelligentPromptEngine';

export interface ReasoningQuestion {
  id: string;
  pillar: 'timeline' | 'fullness' | 'efficiency';
  category: 'timeline_yyyy_mm' | 'event_origin' | 'channel_medium' | 'core_intent';
  title: string;
  description: string;
  astrologicalJustification: string;
  suggestedValue?: string;
  responseValue: string;
  isNotApplicable: boolean;
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
 * Pillar 3: Eliminates conversational filler and compresses text into high-density tokens
 */
export function compressNarrativeDensity(text: string): {
  compressedText: string;
  removedFillerCount: number;
} {
  let cleaned = text;
  let count = 0;

  for (const pat of FILLER_PATTERNS) {
    cleaned = cleaned.replace(pat, () => {
      count++;
      return '';
    });
  }

  // Strip excessive spaces, orphan punctuation, and empty lines
  cleaned = cleaned
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/[,\s]{2,}/g, ', ')
    .trim();

  return {
    compressedText: cleaned,
    removedFillerCount: count,
  };
}

/**
 * Main Reasoning Servant Evaluation Engine (Pillars 1, 2, 3)
 */
export function evaluateWithPrivateLlmServant(
  rawInput: string,
  targetDate: string = '2026-09-07'
): ServantEvaluationResult {
  // Step 1: Run local PII sanitization
  const piiResult = runTwoStageSanitization(rawInput);
  const sanitized = piiResult.stage2Llama8BScrubbed;

  // Step 2: Spell/Grammar correction
  const { correctedText } = preprocessAndCorrectText(sanitized);

  // Step 3: Density Tuning (Purge filler)
  const { compressedText, removedFillerCount } = compressNarrativeDensity(correctedText);

  // Step 4: Pillar 1 - Timeline Validation
  const timelineEval = evaluateTimelinePrecision(compressedText, targetDate);

  // Step 5: Pillar 2 - Narrative Fullness Evaluation (Origin, Channel, Intent)
  const lower = compressedText.toLowerCase();
  const questions: ReasoningQuestion[] = [];

  // 1. Timeline Question (if ambiguous or missing strict YYYY-MM)
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
    });
  }

  // 2. Origin of Event Question
  const hasOriginKeywords =
    lower.includes('because') ||
    lower.includes('due to') ||
    lower.includes('offer') ||
    lower.includes('layoff') ||
    lower.includes('relocation') ||
    lower.includes('decision') ||
    lower.includes('need') ||
    lower.includes('initiated') ||
    lower.includes('reason');

  if (!hasOriginKeywords || compressedText.split(/\s+/).length < 8) {
    questions.push({
      id: 'q_origin',
      pillar: 'fullness',
      category: 'event_origin',
      title: 'Origin & Catalyst of Event',
      description:
        'What initiated or prompted this specific event or decision right now? (e.g. corporate restructuring, lease ending, family requirement, sudden opportunity).',
      astrologicalJustification:
        'Identifies the triggering Bhava (house of origination) and assesses whether the trigger is initiated by Kendra (self-will) or Dusthana (external friction).',
      suggestedValue: 'Corporate restructuring and personal career growth milestone.',
      responseValue: '',
      isNotApplicable: false,
    });
  }

  // 3. Channel / Medium Question
  const hasChannelKeywords =
    lower.includes('company') ||
    lower.includes('loan') ||
    lower.includes('cash') ||
    lower.includes('bank') ||
    lower.includes('dealer') ||
    lower.includes('sponsor') ||
    lower.includes('partner') ||
    lower.includes('self-funded') ||
    lower.includes('financed');

  if (!hasChannelKeywords) {
    questions.push({
      id: 'q_channel',
      pillar: 'fullness',
      category: 'channel_medium',
      title: 'Medium, Conveyance or Funding Channel',
      description:
        'What channel or vehicle is executing this transaction? (e.g., self-funded vs bank loan; company-sponsored role vs independent contract; personal conveyance vs commercial fleet).',
      astrologicalJustification:
        'Evaluates 2nd House (accumulated liquid wealth) vs 6th/8th House (Rina/Debt & external encumbrances) to ensure safe financial execution.',
      suggestedValue: 'Bank financing / loan combined with personal savings.',
      responseValue: '',
      isNotApplicable: false,
    });
  }

  // 4. Intent & Desired Outcome
  const hasIntentKeywords =
    lower.includes('goal') ||
    lower.includes('intent') ||
    lower.includes('aim') ||
    lower.includes('looking for') ||
    lower.includes('expecting') ||
    lower.includes('outcome') ||
    lower.includes('target') ||
    lower.includes('want to');

  if (!hasIntentKeywords) {
    questions.push({
      id: 'q_intent',
      pillar: 'fullness',
      category: 'core_intent',
      title: 'Specific Strategic Intent & Outcome Desired',
      description:
        'What is your primary measure of success for this event? (e.g., long-term stability, immediate salary raise, peace of mind, fast resale value).',
      astrologicalJustification:
        'Aligns the Parashari recommendation with either Artha (wealth), Dharma (duty), or Kama (fulfillment) life objectives.',
      suggestedValue: 'Long-term stability and professional elevation.',
      responseValue: '',
      isNotApplicable: false,
    });
  }

  const rawWords = rawInput.split(/\s+/).filter(Boolean).length;
  const compressedWords = compressedText.split(/\s+/).filter(Boolean).length;
  const reductionPercent = rawWords > 0 ? Math.max(0, Math.round(((rawWords - compressedWords) / rawWords) * 100)) : 0;

  return {
    hasGaps: questions.length > 0,
    timelineValid: timelineEval.isValid,
    detectedTimeline: timelineEval.detectedYyyyMm || undefined,
    normalizedTimeline: timelineEval.detectedYyyyMm || timelineEval.suggestedYyyyMm,
    questions,
    rawText: rawInput,
    sanitizedText: sanitized,
    compressedNarrative: compressedText,
    extractedAttributes: {
      timeline: timelineEval.detectedYyyyMm || timelineEval.suggestedYyyyMm,
    },
    metrics: {
      rawWords,
      compressedWords,
      tokenCompressionRatio: `${reductionPercent}% token reduction`,
      fillerWordsRemoved: removedFillerCount,
      gapsIdentifiedCount: questions.length,
    },
  };
}

/**
 * State Merging: Merges modal popup responses with original session context,
 * scrubbing any N/A entries permanently, and generating the consolidated narrative.
 */
export function mergeServantState(
  originalResult: ServantEvaluationResult,
  answeredQuestions: ReasoningQuestion[]
): {
  mergedNarrative: string;
  finalTimeline: string;
  validAnswers: ReasoningQuestion[];
  scrubbedCount: number;
} {
  let finalTimeline = originalResult.normalizedTimeline;
  const validAnswers: ReasoningQuestion[] = [];
  let scrubbedCount = 0;

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
    } else if (q.category === 'event_origin') {
      contextAdditions.push(`Origin/Trigger: ${val}`);
    } else if (q.category === 'channel_medium') {
      contextAdditions.push(`Channel/Medium: ${val}`);
    } else if (q.category === 'core_intent') {
      contextAdditions.push(`Objective/Intent: ${val}`);
    }
  }

  // Combine into high-density validated narrative
  let merged = originalResult.compressedNarrative;
  if (contextAdditions.length > 0) {
    merged = `${merged}. [Servant Verified Context: ${contextAdditions.join(' | ')}]`;
  }

  return {
    mergedNarrative: merged,
    finalTimeline,
    validAnswers,
    scrubbedCount,
  };
}
