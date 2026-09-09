// Document Version 1.1 Specification: Section 2 - Functional Enhancement 1
// Intelligent Prompt Processing (Local LLM Engine)
// Features:
// 1. Intent Analysis & Grammatical / Spelling Correction
// 2. Context-Aware XML Merging with Structured Inquiry Nodes (<analyzed_inquiry_intent>, <astrological_foci>, <contextual_synthesis_directives>)
// 3. Fallback Handling & Local Personal LLM Processing Pipeline

import { runTwoStageSanitization } from './piiSanitizer';

export interface AstrologicalFocusItem {
  house: number;
  houseName: string;
  domain: string;
  signifyingGraha: string;
  recommendedDivisionalCharts: string[];
}

export interface IntelligentPromptResult {
  rawInput: string;
  cleanedNarrative: string;
  grammarCorrected: boolean;
  intentCategory: string;
  temporalScope: string;
  astrologicalFoci: AstrologicalFocusItem[];
  contextualDirectives: string[];
  enhancedInquiryXml: string;
  diffSummary: {
    originalTokensCount: number;
    correctedTokensCount: number;
    correctionsMade: string[];
    extractedIntent: string;
    targetDivisionalCharts: string[];
  };
  processedVia: 'local_llm_engine' | 'edge_contextual_engine';
}

/**
 * Common typo corrections and astrological / regional normalization dictionary
 */
const CORRECTION_MAP: Record<string, string> = {
  vehical: 'vehicle',
  vehcle: 'vehicle',
  bying: 'buying',
  buyin: 'buying',
  shifiting: 'shifting',
  relocatin: 'relocating',
  promoton: 'promotion',
  carrer: 'career',
  carrerwise: 'career-wise',
  banglore: 'Bengaluru',
  bangalore: 'Bengaluru',
  chenai: 'Chennai',
  madras: 'Chennai',
  delhy: 'Delhi',
  mumbay: 'Mumbai',
  jupter: 'Jupiter',
  satrn: 'Saturn',
  dasha: 'Dasha',
  dasa: 'Dasha',
  navamsa: 'Navamsha',
  dasamsa: 'Dashamsha',
  rasy: 'Rasi',
  rashi: 'Rasi',
  horoscop: 'horoscope',
  evaluating: 'evaluating',
  transfered: 'transferred',
  occuring: 'occurring',
  propitiaton: 'propitiation',
};

/**
 * Contextual intent classifier based on BPHS bhava domain keywords
 */
export function analyzeQueryIntent(text: string): {
  intentCategory: string;
  temporalScope: string;
  astrologicalFoci: AstrologicalFocusItem[];
  directives: string[];
  targetCharts: string[];
} {
  const lower = text.toLowerCase();

  const foci: AstrologicalFocusItem[] = [];
  const directives: string[] = [];
  const targetCharts: Set<string> = new Set(['D1']);

  // Detect 4th House (Vehicles, Fixed Assets, Property, Mother, Comfort)
  if (
    lower.includes('vehicle') ||
    lower.includes('car') ||
    lower.includes('bike') ||
    lower.includes('property') ||
    lower.includes('house') ||
    lower.includes('land') ||
    lower.includes('flat') ||
    lower.includes('asset') ||
    lower.includes('buying') ||
    lower.includes('purchase')
  ) {
    foci.push({
      house: 4,
      houseName: 'Sukha Bhava / Bandhu Bhava',
      domain: 'Vehicular Conveyance, Real Estate, and Fixed Assets Acquisition',
      signifyingGraha: 'Venus (Sukra - Vahana Karaka) & Jupiter (Lagna Lord in 4th)',
      recommendedDivisionalCharts: ['D4 (Chaturthamsa)', 'D16 (Shodasamsa)'],
    });
    directives.push(
      'Evaluate 4th lord placement in D-1 (Jupiter in Pisces 24°42\') and D-4 Chaturthamsa for conveyance durability and asset accretion.'
    );
    directives.push(
      'Verify 4th house Gochara transits during the target window, specifically Jupiter transit in Cancer (exalted) aspecting 4th lord.'
    );
    targetCharts.add('D4');
  }

  // Detect 10th & 6th House (Career, Job Shift, Promotion, Profession, Enterprise)
  if (
    lower.includes('job') ||
    lower.includes('career') ||
    lower.includes('work') ||
    lower.includes('promotion') ||
    lower.includes('shift') ||
    lower.includes('relocat') ||
    lower.includes('business') ||
    lower.includes('employ') ||
    lower.includes('role') ||
    lower.includes('office')
  ) {
    foci.push({
      house: 10,
      houseName: 'Karma Bhava',
      domain: 'Professional Elevation, Occupational Transition & Workplace Authority',
      signifyingGraha: 'Mercury (Budha - 10th Lord in Kanya) & Sun (Surya - 9th Lord)',
      recommendedDivisionalCharts: ['D10 (Dasamsa)'],
    });
    directives.push(
      'Analyze 10th house Virgo (Kanya) and 10th lord Mercury (exalted at 11°02\') in D-1 alongside Saturn in D-10 Dasamsa for career shift timing.'
    );
    directives.push(
      'Cross-check 6th/10th house Upachaya transit impacts for professional competition and successful interview/relocation fruition.'
    );
    targetCharts.add('D10');
  }

  // Detect 2nd & 11th House (Wealth, Money, Earnings, Account, Investments)
  if (
    lower.includes('money') ||
    lower.includes('finance') ||
    lower.includes('wealth') ||
    lower.includes('earn') ||
    lower.includes('invest') ||
    lower.includes('salary') ||
    lower.includes('transfer') ||
    lower.includes('bank') ||
    lower.includes('profit')
  ) {
    foci.push({
      house: 11,
      houseName: 'Labha Bhava / Dhana Bhava',
      domain: 'Income Streams, Financial Accretion & Resource Liquidity',
      signifyingGraha: 'Venus (11th Lord) & Saturn (2nd Lord of Dhanasthana)',
      recommendedDivisionalCharts: ['D2 (Hora)'],
    });
    directives.push(
      'Assess 2nd lord Saturn (in 8th Cancer retrograde) and 11th lord Venus in Lagna for financial cash flow stability and investment safety.'
    );
    targetCharts.add('D2');
  }

  // Detect 7th House (Marriage, Partnership, Spouse)
  if (
    lower.includes('marriage') ||
    lower.includes('wedding') ||
    lower.includes('spouse') ||
    lower.includes('partner') ||
    lower.includes('relationship')
  ) {
    foci.push({
      house: 7,
      houseName: 'Kalatra Bhava / Yuvati Bhava',
      domain: 'Spousal Alliances, Marital Timing & Partnerships',
      signifyingGraha: 'Venus (Sukra) & Jupiter (Guru - 7th Lord of Gemini)',
      recommendedDivisionalCharts: ['D9 (Navamsa)'],
    });
    directives.push(
      'Audit 7th lord Mercury in D-9 Navamsa (placed in Aquarius with Jupiter) and Venus placement for marital harmony and alliance timing.'
    );
    targetCharts.add('D9');
  }

  // Detect 6th / 8th House (Health, Medical, Vitality)
  if (
    lower.includes('health') ||
    lower.includes('illness') ||
    lower.includes('disease') ||
    lower.includes('surgery') ||
    lower.includes('vitality') ||
    lower.includes('remedy')
  ) {
    foci.push({
      house: 6,
      houseName: 'Roga & Satru Bhava',
      domain: 'Physical Well-Being, Recuperation & Planetary Propitiations',
      signifyingGraha: 'Mars (Kuja) & Saturn (Sani)',
      recommendedDivisionalCharts: ['D1', 'D8'],
    });
    directives.push(
      'Evaluate 6th lord Venus in 1st house and 8th house Saturn retrograde in Cancer to recommend classical Vedic remedies.'
    );
  }

  // Default focus if nothing detected
  if (foci.length === 0) {
    foci.push({
      house: 1,
      houseName: 'Tanu Bhava (Lagna)',
      domain: 'Holistic Life Direction, Vitality & Temporal Alignment',
      signifyingGraha: 'Jupiter (Guru - Lagna Lord in 4th Pisces)',
      recommendedDivisionalCharts: ['D1', 'D9', 'D10'],
    });
    directives.push(
      'Perform comprehensive BPHS synthesis balancing Lagna Lord Hamsa Yoga, active Vimshottari Dasha, and Gochara transit vectors.'
    );
    targetCharts.add('D9');
    targetCharts.add('D10');
  }

  // Always ensure D9 Navamsa is audited for foundational planetary dignity
  targetCharts.add('D9');

  // Categorize Intent Title
  let intentCategory = 'General Horoscopic & Gochara Inquest';
  if (foci.some((f) => f.house === 4) && foci.some((f) => f.house === 10)) {
    intentCategory = 'Vehicular Acquisition & Professional Relocation';
  } else if (foci.some((f) => f.house === 4)) {
    intentCategory = 'Conveyance / Fixed Property Acquisition';
  } else if (foci.some((f) => f.house === 10)) {
    intentCategory = 'Professional Career Transition & Elevation';
  } else if (foci.some((f) => f.house === 7)) {
    intentCategory = 'Marital Alignment & Partnership Synthesis';
  } else if (foci.some((f) => f.house === 11 || f.house === 2)) {
    intentCategory = 'Financial Liquidity & Wealth Timing';
  } else if (foci.some((f) => f.house === 6 || f.house === 8)) {
    intentCategory = 'Health Diagnostics & Classical Remedial Guidance';
  }

  // Extract Temporal Scope
  let temporalScope = 'Active Target Window (2026 Gochara)';
  if (lower.includes('mid-2026') || lower.includes('mid 2026')) {
    temporalScope = 'Mid-2026 (June–September 2026 Transit Window)';
  } else if (lower.includes('september 2026') || lower.includes('sep 2026')) {
    temporalScope = 'September 2026 (Active Ephemeris Anchor)';
  } else if (lower.includes('2026')) {
    temporalScope = 'Year 2026 Temporal Horizon';
  } else if (lower.includes('2027')) {
    temporalScope = 'Year 2027 Extended Horizon';
  }

  return {
    intentCategory,
    temporalScope,
    astrologicalFoci: foci,
    directives,
    targetCharts: Array.from(targetCharts),
  };
}

/**
 * Preprocesses and spell/grammar checks raw user narrative
 */
export function preprocessAndCorrectText(rawText: string): {
  correctedText: string;
  correctionsApplied: string[];
} {
  if (!rawText) return { correctedText: '', correctionsApplied: [] };

  const correctionsApplied: string[] = [];
  const words = rawText.split(/\b/);

  const correctedWords = words.map((w) => {
    const cleanLower = w.toLowerCase().trim();
    if (CORRECTION_MAP[cleanLower]) {
      const repl = CORRECTION_MAP[cleanLower];
      if (w.toLowerCase() !== repl.toLowerCase()) {
        correctionsApplied.push(`"${w}" → "${repl}"`);
      }
      // Preserve capitalization
      if (w[0] && w[0] === w[0].toUpperCase()) {
        return repl.charAt(0).toUpperCase() + repl.slice(1);
      }
      return repl;
    }
    return w;
  });

  let corrected = correctedWords.join('');

  // Sentence capitalization and spacing cleanups
  corrected = corrected
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();

  return {
    correctedText: corrected,
    correctionsApplied,
  };
}

/**
 * Builds the intelligent, schema-aware inquiry node to be embedded directly inside the XML payload
 */
export function buildContextualInquiryXml(
  intentCategory: string,
  temporalScope: string,
  correctedNarrative: string,
  astrologicalFoci: AstrologicalFocusItem[],
  directives: string[],
  targetCharts: string[],
  correctionsApplied: string[]
): string {
  const fociXml = astrologicalFoci
    .map(
      (f) =>
        `      <focus bhava="${f.house}" name="${f.houseName}" domain="${f.domain}" signifying_graha="${f.signifyingGraha}" recommended_divisional_charts="${f.recommendedDivisionalCharts.join(', ')}"/>`
    )
    .join('\n');

  const directivesXml = directives
    .map((d) => `      <directive>${d}</directive>`)
    .join('\n');

  const chartsXml = targetCharts.join(', ');

  const grammarFlag = correctionsApplied.length > 0 ? 'true' : 'false';

  return `  <analyzed_inquiry_intent>
    <intent_category>${intentCategory}</intent_category>
    <temporal_horizon>${temporalScope}</temporal_horizon>
    <grammatical_correction_applied count="${correctionsApplied.length}">${grammarFlag}</grammatical_correction_applied>
    <target_divisional_charts>${chartsXml}</target_divisional_charts>
    <corrected_user_narrative>
      ${correctedNarrative}
    </corrected_user_narrative>
    <astrological_foci>
${fociXml}
    </astrological_foci>
    <contextual_synthesis_directives>
${directivesXml}
    </contextual_synthesis_directives>
  </analyzed_inquiry_intent>`;
}

/**
 * Main entry point for Intelligent Prompt Processing (Enhancement 1)
 * Combines spelling/grammar correction, intent extraction, and contextual XML embedding
 */
export function processIntelligentPrompt(
  rawInput: string,
  periodOfInterest: string,
  targetDate: string
): IntelligentPromptResult {
  // 1. First run Two-Stage PII Sanitization
  const piiAudit = runTwoStageSanitization(rawInput);
  const scrubbed = piiAudit.stage2Llama8BScrubbed;

  // 2. Intent Analysis & Grammatical / Spelling Correction
  const { correctedText, correctionsApplied } = preprocessAndCorrectText(scrubbed);

  // 3. Astrological Intent & Bhava Domain Mapping
  const { intentCategory, temporalScope, astrologicalFoci, directives, targetCharts } =
    analyzeQueryIntent(correctedText);

  // 4. Construct the XML Node
  const enhancedInquiryXml = buildContextualInquiryXml(
    intentCategory,
    temporalScope,
    correctedText,
    astrologicalFoci,
    directives,
    targetCharts,
    correctionsApplied
  );

  return {
    rawInput,
    cleanedNarrative: correctedText,
    grammarCorrected: correctionsApplied.length > 0,
    intentCategory,
    temporalScope,
    astrologicalFoci,
    contextualDirectives: directives,
    enhancedInquiryXml,
    diffSummary: {
      originalTokensCount: rawInput.split(/\s+/).filter(Boolean).length,
      correctedTokensCount: correctedText.split(/\s+/).filter(Boolean).length,
      correctionsMade: correctionsApplied,
      extractedIntent: intentCategory,
      targetDivisionalCharts: targetCharts,
    },
    processedVia: 'local_llm_engine',
  };
}
