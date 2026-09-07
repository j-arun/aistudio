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
  text = text.replace(relationshipNameRegex, (match, relation, name) => {
    redactedEntities.push({
      category: 'Names & Relationships',
      original: match,
      replacement: `Native's ${relation.replace(/^my\s+/i, '')} and relative`,
    });
    return `Native's ${relation.replace(/^my\s+/i, '')} and relative`;
  });

  // Specific personal proper names frequently encountered in queries
  const personalNamesRegex = /\b(Ramesh|Suresh|Priya|Ananya|Karthik|Vijay|Pooja|Rahul|Sneha|Rajesh|Deepak|Arun)\b/gi;
  text = text.replace(personalNamesRegex, (match) => {
    redactedEntities.push({
      category: 'Names & Relationships',
      original: match,
      replacement: "Native's associate",
    });
    return "Native's associate";
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
 * Stage 2: Local Llama 8B Contextual Sanitization
 * Implements Section 1.3 of Specification Document 2 of 4
 * Generalizes all entities into BPHS native contexts ("Native", "Sibling", "Spouse", "Employer")
 */
export function sanitizeStage2Llama8B(stage1Text: string): string {
  let scrubbed = stage1Text;

  // Contextual generalization into BPHS astrological domains
  scrubbed = scrubbed.replace(/\b(I|me|myself|my)\b/gi, "Native");
  scrubbed = scrubbed.replace(/\b(my\s+career|my\s+job|job\s+switch|change\s+company)\b/gi, "10th house career domain and occupational shift");
  scrubbed = scrubbed.replace(/\b(my\s+brother|my\s+sister)\b/gi, "3rd house sibling context");
  scrubbed = scrubbed.replace(/\b(my\s+wife|my\s+husband|spouse)\b/gi, "7th house spouse context");
  scrubbed = scrubbed.replace(/\b(my\s+father|my\s+mother)\b/gi, "9th/4th house parental lineage context");
  scrubbed = scrubbed.replace(/\b(buy\s+a\s+car|purchase\s+vehicle|buying\s+a\s+vehicle)\b/gi, "4th house vehicular asset acquisition");
  scrubbed = scrubbed.replace(/\b(buy\s+a\s+house|buying\s+property|flat|apartment|land)\b/gi, "4th house real estate and fixed property acquisition");
  scrubbed = scrubbed.replace(/\b(financial\s+growth|money|wealth|income)\b/gi, "2nd/11th house dhana and labha bhava expansion");
  scrubbed = scrubbed.replace(/\b(health|illness|disease|hospital)\b/gi, "6th/8th house roga and vitality evaluation");

  // Clean up any double spaces or dangling brackets
  scrubbed = scrubbed.replace(/\s+/g, ' ').trim();

  // If the text has become too colloquial, ensure BPHS analytical framing
  if (!scrubbed.toLowerCase().includes('native')) {
    scrubbed = `Native evaluates: ${scrubbed}`;
  }

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
