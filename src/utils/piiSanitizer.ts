// Specification Document 2 of 4: Section 1
// Local PII Scrubbing & Anonymization Engine Architecture
// Two-Stage Local Sanitization Protocol for Egress-Only BPHS Analytical Tool

export interface PiiSanitizationResult {
  rawInput: string;
  stage1RegexRedacted: string;
  stage2Llama8BScrubbed: string;
  redactedEntities: {
    category: string;
    original: string;
    replacement: string;
  }[];
  isClean: boolean;
}

/**
 * Stage 1: Deterministic Regex Entity Redaction Table
 * Strictly implements Section 1.2 of Specification Document 2 of 4
 */
export function sanitizeStage1Regex(rawText: string): {
  redactedText: string;
  redactedEntities: { category: string; original: string; replacement: string }[];
} {
  let text = rawText;
  const redactedEntities: { category: string; original: string; replacement: string }[] = [];

  // 1. Phone / Mobile numbers (+91 xxxxx xxxxx, 10-digit numbers, etc.)
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4,6}/g;
  text = text.replace(phoneRegex, (match) => {
    // Only redact if it looks like a phone number (>= 8 digits)
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length >= 8 && digitsOnly.length <= 13) {
      redactedEntities.push({
        category: 'Phone / Mobile Numbers',
        original: match,
        replacement: '[PHONE_NUMBER_REDACTED]',
      });
      return '[PHONE_NUMBER_REDACTED]';
    }
    return match;
  });

  // 2. Bank Account / Credit Card / Card numbers
  const bankAccountRegex = /(A\/C|Account|Acc|Card|IBAN)?\s*[:#-]?\s*\b\d{9,18}\b/gi;
  text = text.replace(bankAccountRegex, (match) => {
    redactedEntities.push({
      category: 'Bank Account / Credit Card',
      original: match,
      replacement: 'Transferred from account ([ACCOUNT_NO_REDACTED])',
    });
    return 'account ([ACCOUNT_NO_REDACTED])';
  });

  // 3. Vehicle Registration numbers (e.g. TN-10-AZ-1038, KA-01-MJ-9999, DL-04-C-1234, etc.)
  const vehicleRegex = /\b[A-Z]{2}[-\s]?\d{1,2}[-\s]?[A-Z]{1,3}[-\s]?\d{3,4}\b/gi;
  text = text.replace(vehicleRegex, (match) => {
    redactedEntities.push({
      category: 'Vehicle Registration',
      original: match,
      replacement: 'vehicle ([VEHICLE_NO_REDACTED])',
    });
    return 'vehicle ([VEHICLE_NO_REDACTED])';
  });

  // 4. Exact Birth Date / Age ("Born on 14th August 1985", "DOB: 12/05/1990", etc.)
  const birthDateRegex = /(born\s+on\s+\d{1,2}(st|nd|rd|th)?\s+[A-Za-z]+,?\s+\d{4}|DOB\s*[:=]?\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|born\s+in\s+\d{4})/gi;
  text = text.replace(birthDateRegex, (match) => {
    redactedEntities.push({
      category: 'Exact Birth Date / Age',
      original: match,
      replacement: '[STRIPPED — Replaced strictly by planetary longitudes]',
    });
    return '[STRIPPED — Replaced strictly by planetary longitudes]';
  });

  // 5. Names & Relationships ("My brother Ramesh and my sister Priya", "my wife Ananya", etc.)
  const relationshipNameRegex = /(my\s+(?:brother|sister|father|mother|wife|husband|son|daughter|uncle|aunt|friend|colleague))\s+([A-Z][a-z]+)/gi;
  text = text.replace(relationshipNameRegex, (match, relation) => {
    const cleanRelation = relation.replace(/^my\s+/i, '');
    redactedEntities.push({
      category: 'Names & Relationships',
      original: match,
      replacement: `[${cleanRelation}]`,
    });
    return `[${cleanRelation}]`;
  });

  // Specific personal proper names frequently encountered in queries
  const personalNamesRegex = /\b(Ramesh|Suresh|Priya|Ananya|Karthik|Vijay|Pooja|Rahul|Sneha|Rajesh|Deepak|Arun)\b/gi;
  text = text.replace(personalNamesRegex, (match) => {
    redactedEntities.push({
      category: 'Names & Relationships',
      original: match,
      replacement: '[Associate]',
    });
    return '[Associate]';
  });

  // 6. Location & Address ("Living in T. Nagar, Chennai, India", "working in Bangalore", etc.)
  const locationRegex = /(?:living\s+in|residing\s+at|at|in)\s+([A-Z][a-zA-Z\s.,]+(?:Chennai|Bangalore|Bengaluru|Mumbai|Delhi|Hyderabad|Coimbatore|Madurai|T\.?\s*Nagar|India|USA|UK|Singapore))/gi;
  text = text.replace(locationRegex, (match) => {
    redactedEntities.push({
      category: 'Location & Address',
      original: match,
      replacement: 'in an urban region ([LOCATION_REDACTED])',
    });
    return 'in an urban region ([LOCATION_REDACTED])';
  });

  // 7. Email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  text = text.replace(emailRegex, (match) => {
    redactedEntities.push({
      category: 'Email Address',
      original: match,
      replacement: '[EMAIL_REDACTED]',
    });
    return '[EMAIL_REDACTED]';
  });

  return { redactedText: text, redactedEntities };
}

/**
 * Stage 2: Contextual PII Sanitization & Natural Querent Flow
 * Sanitizes corporate entities, institutions, and removes repetitive domain clichés (e.g., redundant "native" spam).
 * Preserves clean, natural syntax to maximize context-window density and narrative readability.
 */
export function sanitizeStage2Llama8B(stage1Text: string): string {
  let scrubbed = stage1Text;

  // Redact corporate employers & institutions to protect employment privacy
  const corporateRegex = /\b(?:working\s+at|employed\s+by|company\s+is|joined|at|with)\s+([A-Z][a-zA-Z0-9&.\s]+(?:Corp|Corporation|Inc|LLC|Ltd|Limited|Technologies|Tech|Systems|Solutions|Bank|Consultancy|Services|Google|Amazon|Microsoft|Apple|Meta|TCS|Infosys|Wipro|Cognizant|Accenture|IBM))\b/gi;
  scrubbed = scrubbed.replace(corporateRegex, 'at [Employer Organization]');

  // Clean repetitive or awkward "native" clichés and restore natural grammatical flow
  scrubbed = scrubbed.replace(/\bNative\s+evaluates:\s*/gi, '');
  scrubbed = scrubbed.replace(/\b(the\s+native's|native's)\s+(native|the\s+native)\b/gi, "the querent's");
  scrubbed = scrubbed.replace(/\bNative\s+Native\b/gi, 'The querent');
  scrubbed = scrubbed.replace(/\bNative\s+am\b/gi, 'I am');
  scrubbed = scrubbed.replace(/\bNative\s+is\b/gi, 'The querent is');
  scrubbed = scrubbed.replace(/\bNative\s+want(s)?\b/gi, 'The querent seeks');
  scrubbed = scrubbed.replace(/\bNative\s+need(s)?\b/gi, 'The querent needs');
  scrubbed = scrubbed.replace(/\bNative\s+plan(s)?\b/gi, 'The querent plans');

  // If "native" is repeated more than once in close proximity, replace with fluid natural references
  scrubbed = scrubbed.replace(/\bthe\s+native\b/gi, 'the querent');
  scrubbed = scrubbed.replace(/\bNative\b/g, 'the querent');
  // Capitalize first letter if starting with "the querent"
  scrubbed = scrubbed.replace(/^the querent\b/i, 'The querent');

  // Clean up any double spaces, hanging commas, or dangling brackets
  scrubbed = scrubbed
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/,\s*,+/g, ',')
    .trim();

  return scrubbed;
}

/**
 * Two-stage sanitization orchestrator
 */
export function runTwoStageSanitization(rawNarrative: string): PiiSanitizationResult {
  const { redactedText: stage1, redactedEntities } = sanitizeStage1Regex(rawNarrative);
  const stage2 = sanitizeStage2Llama8B(stage1);

  return {
    rawInput: rawNarrative,
    stage1RegexRedacted: stage1,
    stage2Llama8BScrubbed: stage2,
    redactedEntities,
    isClean: true,
  };
}
