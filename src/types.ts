export type DivisionalChartId = 'D1' | 'D2' | 'D3' | 'D4' | 'D7' | 'D9' | 'D10' | 'D12';

export interface GrahaPosition {
  id: string;
  name: string;
  tamilName: string;
  shortName: string;
  glyph: string;
  sign: string;
  tamilSign: string;
  signIndex: number; // 0: Mesham, 1: Rishabam, ..., 8: Dhanusu, ..., 11: Meenam
  degrees: number;
  minutes: number;
  seconds: number;
  formattedLongitude: string;
  nakshatra: string;
  nakshatraTamil: string;
  pada: number;
  isRetrograde: boolean;
  isCombust: boolean;
  houseFromLagna: number;
  karaka?: string;
}

export interface DivisionalChartPlacement {
  signIndex: number; // 0..11
  planets: string[]; // shortNames e.g. ['சூரி', 'புத(வ)']
  hasLagna?: boolean;
}

export interface DivisionalChart {
  id: DivisionalChartId;
  name: string;
  tamilName: string;
  bphsFocus: string;
  placements: Record<number, string[]>; // signIndex -> array of planet names/glyphs
  lagnaSignIndex: number;
}

export interface DashaPeriod {
  planet: string;
  tamilPlanet: string;
  startDate: string; // YYYY-MM-DD or DD.MM.YYYY
  endDate: string;
  level: 'MD' | 'AD' | 'PD';
  isCurrent?: boolean;
  subPeriods?: DashaPeriod[];
}

export interface NativeMetadata {
  regNo: string;
  anonymizedId: string;
  source: string;
  birthPlace: string;
  englishDate: string;
  tamilDate: string;
  nakshatra: string;
  nakshatraTamil: string;
  nakshatraDuration: string;
  pada: number;
  rasi: string;
  rasiTamil: string;
  lagna: string;
  lagnaTamil: string;
  thithi: string;
  yogam: string;
  karanam: string;
  horai: string;
  startingDasha: string;
  startingDashaBalance: string;
}

export interface AshtakavargaSummary {
  sarvashtakavarga: number[]; // 12 signs, 0: Mesham .. 11: Meenam
  rasiPinda: number;
  grahaPinda: number;
  sodhyaPinda: number;
}

export interface ShadbalaSummary {
  planet: string;
  tamilPlanet: string;
  rupa: number;
  ratio: number;
  sthanaBala: number;
  digBala: number;
  kalaBala: number;
  chestaBala: number;
  naisargikaBala: number;
  drikBala: number;
  isStrong: boolean;
}

export interface AstroYoga {
  id: string;
  name: string;
  tamilName: string;
  rule: string;
  description: string;
  isPresent: boolean;
}
