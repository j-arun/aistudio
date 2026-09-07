import { GrahaPosition, DivisionalChart, DivisionalChartId } from '../types';

/**
 * Brihat Parashara Hora Shastra (BPHS) Mathematical Calculation Engine
 * 
 * Replaces error-prone visual OCR grids with exact, deterministic astronomical
 * projections derived directly from Graha Sphutam (Planetary Longitudes).
 */

export interface DivisionalMathResult {
  chartId: DivisionalChartId;
  planetId: string;
  signIndex: number;
  partIndex: number;
  explanation: string;
}

export const SIGN_NAMES_EN = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

export const SIGN_NAMES_TA = [
  'மேஷம்',
  'ரிஷபம்',
  'மிதுனம்',
  'கடகம்',
  'சிம்மம்',
  'கன்னி',
  'துலாம்',
  'விருச்சிகம்',
  'தனுசு',
  'மகரம்',
  'கும்பம்',
  'மீனம்',
];

/**
 * Convert degree, minute, second to decimal degrees within a sign [0, 30)
 */
export function getDecimalDegreesInSign(graha: GrahaPosition): number {
  const deg = graha.degrees + graha.minutes / 60 + (graha.seconds || 0) / 3600;
  return Math.min(Math.max(deg, 0), 29.999999);
}

/**
 * Total absolute zodiacal longitude [0, 360)
 */
export function getTotalAbsoluteLongitude(graha: GrahaPosition): number {
  return graha.signIndex * 30 + getDecimalDegreesInSign(graha);
}

/**
 * Helper to test if a sign is Odd in traditional 1-based zodiac counting
 * 0 (Aries) = 1st = Odd
 * 1 (Taurus) = 2nd = Even
 */
export function isOddSign(signIndex: number): boolean {
  return signIndex % 2 === 0;
}

/**
 * Get sign mobility type:
 * 0 = Movable (Chara): Aries, Cancer, Libra, Capricorn
 * 1 = Fixed (Sthira): Taurus, Leo, Scorpio, Aquarius
 * 2 = Dual (Dwisvabhava): Gemini, Virgo, Sagittarius, Pisces
 */
export function getSignMobility(signIndex: number): 'movable' | 'fixed' | 'dual' {
  const mod = signIndex % 3;
  if (mod === 0) return 'movable';
  if (mod === 1) return 'fixed';
  return 'dual';
}

/**
 * Calculate the exact divisional sign index for any Graha according to BPHS rules
 */
export function calculateGrahaDivisionalSign(
  graha: GrahaPosition,
  chartId: DivisionalChartId
): { signIndex: number; partIndex: number; rule: string } {
  const deg = getDecimalDegreesInSign(graha);
  const S = graha.signIndex;

  switch (chartId) {
    case 'D1': {
      return {
        signIndex: S,
        partIndex: 0,
        rule: `D1 (Rasi): Placed in birth sign ${SIGN_NAMES_TA[S]} (${SIGN_NAMES_EN[S]}).`,
      };
    }

    case 'D2': {
      // Hora: 2 divisions of 15° each
      // Odd sign: 0-15° Sun (Leo / 4), 15-30° Moon (Cancer / 3)
      // Even sign: 0-15° Moon (Cancer / 3), 15-30° Sun (Leo / 4)
      const part = Math.floor(deg / 15); // 0 or 1
      const odd = isOddSign(S);
      let targetSign: number;
      if (odd) {
        targetSign = part === 0 ? 4 : 3;
      } else {
        targetSign = part === 0 ? 3 : 4;
      }
      return {
        signIndex: targetSign,
        partIndex: part,
        rule: `D2 (Hora): ${odd ? 'Odd' : 'Even'} sign at ${deg.toFixed(2)}° (part ${part + 1}) → ${
          targetSign === 4 ? 'Surya Hora (Leo / சிம்மம்)' : 'Chandra Hora (Cancer / கடகம்)'
        }.`,
      };
    }

    case 'D3': {
      // Drekkana: 3 divisions of 10° each
      // 0-10°: 1st (self, S)
      // 10-20°: 2nd (5th from S)
      // 20-30°: 3rd (9th from S)
      const part = Math.floor(deg / 10); // 0, 1, 2
      const targetSign = (S + part * 4) % 12;
      return {
        signIndex: targetSign,
        partIndex: part,
        rule: `D3 (Drekkana): Part ${part + 1} (${part * 10}°-${(part + 1) * 10}°) → ${(part === 0 ? 'Self' : part === 1 ? '5th from self' : '9th from self')} = ${SIGN_NAMES_TA[targetSign]} (${SIGN_NAMES_EN[targetSign]}).`,
      };
    }

    case 'D4': {
      // Chaturthamsa: 4 divisions of 7°30' (7.5°) each
      // Count Kendra from self: 1st, 4th, 7th, 10th
      const part = Math.floor(deg / 7.5); // 0, 1, 2, 3
      const targetSign = (S + part * 3) % 12;
      return {
        signIndex: targetSign,
        partIndex: part,
        rule: `D4 (Chaturthamsa): Part ${part + 1} (${(part * 7.5).toFixed(1)}°-${((part + 1) * 7.5).toFixed(1)}°) → ${part * 3 + 1}th from self = ${SIGN_NAMES_TA[targetSign]} (${SIGN_NAMES_EN[targetSign]}).`,
      };
    }

    case 'D7': {
      // Saptamsa: 7 divisions of 30/7° (~4.2857°) each
      // Odd sign: starts from self (S)
      // Even sign: starts from 7th from self ((S + 6) % 12)
      const part = Math.min(Math.floor(deg / (30 / 7)), 6); // 0..6
      const odd = isOddSign(S);
      const startSign = odd ? S : (S + 6) % 12;
      const targetSign = (startSign + part) % 12;
      return {
        signIndex: targetSign,
        partIndex: part,
        rule: `D7 (Saptamsa): ${odd ? 'Odd sign (starts from self)' : 'Even sign (starts from 7th)'} part ${part + 1} → ${SIGN_NAMES_TA[targetSign]} (${SIGN_NAMES_EN[targetSign]}).`,
      };
    }

    case 'D9': {
      // Navamsa: 9 divisions of 3°20' (10/3°) each
      // Movable (Chara): starts from self (S)
      // Fixed (Sthira): starts from 9th from self ((S + 8) % 12)
      // Dual (Dwisvabhava): starts from 5th from self ((S + 4) % 12)
      const part = Math.min(Math.floor(deg / (10 / 3)), 8); // 0..8
      const mobility = getSignMobility(S);
      let startSign = S;
      if (mobility === 'fixed') {
        startSign = (S + 8) % 12;
      } else if (mobility === 'dual') {
        startSign = (S + 4) % 12;
      }
      const targetSign = (startSign + part) % 12;
      return {
        signIndex: targetSign,
        partIndex: part,
        rule: `D9 (Navamsa): ${mobility} sign (${mobility === 'movable' ? 'starts from self' : mobility === 'fixed' ? 'starts from 9th' : 'starts from 5th'}), Pada/Part ${part + 1} → ${SIGN_NAMES_TA[targetSign]} (${SIGN_NAMES_EN[targetSign]}).`,
      };
    }

    case 'D10': {
      // Dasamsa: 10 divisions of 3° each
      // Odd sign: starts from self (S)
      // Even sign: starts from 9th from self ((S + 8) % 12)
      const part = Math.min(Math.floor(deg / 3), 9); // 0..9
      const odd = isOddSign(S);
      const startSign = odd ? S : (S + 8) % 12;
      const targetSign = (startSign + part) % 12;
      return {
        signIndex: targetSign,
        partIndex: part,
        rule: `D10 (Dasamsa): ${odd ? 'Odd sign (starts from self)' : 'Even sign (starts from 9th)'}, part ${part + 1} → ${SIGN_NAMES_TA[targetSign]} (${SIGN_NAMES_EN[targetSign]}).`,
      };
    }

    case 'D12': {
      // Dwadasamsa: 12 divisions of 2°30' (2.5°) each
      // Starts from self for all signs
      const part = Math.min(Math.floor(deg / 2.5), 11); // 0..11
      const targetSign = (S + part) % 12;
      return {
        signIndex: targetSign,
        partIndex: part,
        rule: `D12 (Dwadasamsa): Starts from self, part ${part + 1} (${(part * 2.5).toFixed(1)}°-${((part + 1) * 2.5).toFixed(1)}°) → ${SIGN_NAMES_TA[targetSign]} (${SIGN_NAMES_EN[targetSign]}).`,
      };
    }

    default:
      return {
        signIndex: S,
        partIndex: 0,
        rule: `Default: ${SIGN_NAMES_TA[S]}`,
      };
  }
}

/**
 * Format the label for a graha inside the chart box
 */
export function formatGrahaLabel(graha: GrahaPosition, chartId: DivisionalChartId): string {
  if (chartId === 'D1') {
    // In D1, keep the formatted longitude and glyph for clarity
    if (graha.id === 'lagna') {
      return `லக்னம் (${graha.glyph} ${String(graha.degrees).padStart(2, '0')}°${String(graha.minutes).padStart(2, '0')}')`;
    }
    return `${graha.shortName} (${graha.glyph} ${String(graha.degrees).padStart(2, '0')}°${String(graha.minutes).padStart(2, '0')}')`;
  }
  // In D2..D12 divisional charts, clean short tamil names are traditional and legible
  return graha.shortName;
}

export interface ChartMetadataDef {
  id: DivisionalChartId;
  name: string;
  tamilName: string;
  bphsFocus: string;
}

export const DIVISIONAL_METADATA: ChartMetadataDef[] = [
  {
    id: 'D1',
    name: 'Rasi Chart',
    tamilName: 'இராசி சக்கரம்',
    bphsFocus: 'Primary Existence, General Fortune, Physical Body & Longevity',
  },
  {
    id: 'D2',
    name: 'Hora Chart',
    tamilName: 'ஹோரை சக்கரம்',
    bphsFocus: 'Wealth, Financial Assets, Liquid Resources, Family Prosperity',
  },
  {
    id: 'D3',
    name: 'Drekkana Chart',
    tamilName: 'திரிகோணம் / திரேதாம்சம்',
    bphsFocus: 'Siblings, Courage, Energy, Vitality, Third House Matters',
  },
  {
    id: 'D4',
    name: 'Chaturthamsa Chart',
    tamilName: 'சதுர்த்தாம்சம்',
    bphsFocus: 'Fixed Assets, Property, Home, Vehicles, Real Estate & Luck',
  },
  {
    id: 'D7',
    name: 'Saptamsa Chart',
    tamilName: 'சப்தாம்சம்',
    bphsFocus: 'Children, Progeny, Lineage, Creative Output, Grandchildren',
  },
  {
    id: 'D9',
    name: 'Navamsa Chart',
    tamilName: 'நவாம்சம்',
    bphsFocus: 'Spouse, Marriage, Dharma, Inner Soul Purpose & Fortune in Later Life',
  },
  {
    id: 'D10',
    name: 'Dasamsa Chart',
    tamilName: 'தசாம்சம்',
    bphsFocus: 'Career, Profession, Fame, Social Status, Leadership & Power',
  },
  {
    id: 'D12',
    name: 'Dwadasamsa Chart',
    tamilName: 'துவாதசாம்சம்',
    bphsFocus: 'Parents, Paternal & Maternal Lineage, Past Karmic Heritage',
  },
];

/**
 * Generate all 8 canonical divisional charts (D1..D12) strictly using BPHS mathematical calculations
 */
export function generateAllDivisionalCharts(grahas: GrahaPosition[]): DivisionalChart[] {
  const lagnaGraha = grahas.find((g) => g.id === 'lagna');

  return DIVISIONAL_METADATA.map((meta) => {
    // Initialize 12 empty signs
    const placements: Record<number, string[]> = {
      0: [],
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
      9: [],
      10: [],
      11: [],
    };

    // Calculate Lagna position for this chart
    let lagnaSignIndex = 0;
    if (lagnaGraha) {
      lagnaSignIndex = calculateGrahaDivisionalSign(lagnaGraha, meta.id).signIndex;
    }

    // Distribute grahas into the signs
    grahas.forEach((graha) => {
      const { signIndex } = calculateGrahaDivisionalSign(graha, meta.id);
      const label = formatGrahaLabel(graha, meta.id);
      placements[signIndex].push(label);
    });

    return {
      id: meta.id,
      name: meta.name,
      tamilName: meta.tamilName,
      bphsFocus: meta.bphsFocus,
      lagnaSignIndex,
      placements,
    };
  });
}
