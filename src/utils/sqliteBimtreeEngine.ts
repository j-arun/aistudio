import initSqlJs, { Database } from 'sql.js';
import { DashaPeriod, GrahaPosition, NativeMetadata } from '../types';

export interface BimtreeRow {
  id?: number;
  tree_id: number;
  row_seq: number;
  combination_code: string; // e.g. "T1001_R0042"
  username: string;
  md: string;
  ad: string;
  pd: string;
  start_time: string; // ISO format: YYYY-MM-DD HH:mm:ss
  end_time: string;
  duration_days: number;
  inferred_narrative: string | null;
  lived_narrative: string | null;
  rating: number | null; // 1 to 5
  created_at?: string;
  updated_at?: string;
}

export interface TreeSummary {
  tree_id: number;
  username: string;
  total_periods: number;
  inferred_count: number;
  lived_count: number;
  avg_rating: number | null;
  earliest_date: string;
  latest_date: string;
}

// Canonical Vimshottari Planetary order and full duration in solar years (Total: 120 Years)
export const VIMSHOTTARI_LORDS: { name: string; tamil: string; years: number }[] = [
  { name: 'Ketu', tamil: 'கேது', years: 7 },
  { name: 'Venus', tamil: 'சுக்கிரன்', years: 20 },
  { name: 'Sun', tamil: 'சூரியன்', years: 6 },
  { name: 'Moon', tamil: 'சந்திரன்', years: 10 },
  { name: 'Mars', tamil: 'செவ்வாய்', years: 7 },
  { name: 'Rahu', tamil: 'ராகு', years: 18 },
  { name: 'Jupiter', tamil: 'குரு', years: 16 },
  { name: 'Saturn', tamil: 'சனி', years: 19 },
  { name: 'Mercury', tamil: 'புதன்', years: 17 },
];

const LOCAL_STORAGE_DB_KEY = 'rooster_bimtree_sqlite_buffer_v1';
const LOCAL_STORAGE_ACTIVE_TREE_KEY = 'rooster_bimtree_active_tree_id';

let sqlPromise: Promise<Database> | null = null;
let activeDb: Database | null = null;

/**
 * Initializes or restores the SQLite Database in-memory.
 */
export async function getSqliteDatabase(): Promise<Database> {
  if (activeDb) return activeDb;

  if (!sqlPromise) {
    sqlPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: () => '/sql-wasm.wasm',
      });

      // Attempt to restore saved database binary from localStorage
      const savedBase64 = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
      let db: Database;

      if (savedBase64) {
        try {
          const binaryString = atob(savedBase64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          db = new SQL.Database(bytes);
        } catch (e) {
          console.warn('Failed to restore SQLite buffer from localStorage, creating fresh DB:', e);
          db = new SQL.Database();
        }
      } else {
        db = new SQL.Database();
      }

      initSchema(db);
      activeDb = db;
      return db;
    })();
  }

  return sqlPromise;
}

/**
 * Ensures table and indexes exist per BPHS SQLite Specification.
 */
function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS bimtree_dasha_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tree_id INTEGER NOT NULL,
      row_seq INTEGER NOT NULL,
      combination_code TEXT NOT NULL,
      username TEXT NOT NULL,
      md TEXT NOT NULL,
      ad TEXT NOT NULL,
      pd TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_days REAL,
      inferred_narrative TEXT,
      lived_narrative TEXT,
      rating INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(tree_id, row_seq),
      UNIQUE(combination_code)
    );

    CREATE INDEX IF NOT EXISTS idx_bimtree_user_tree ON bimtree_dasha_periods(username, tree_id);
    CREATE INDEX IF NOT EXISTS idx_bimtree_timeline ON bimtree_dasha_periods(tree_id, start_time, end_time);
    CREATE INDEX IF NOT EXISTS idx_bimtree_planets ON bimtree_dasha_periods(md, ad, pd);
    CREATE INDEX IF NOT EXISTS idx_bimtree_rating ON bimtree_dasha_periods(rating);
  `);
}

/**
 * Persists the SQLite binary state to localStorage for offline reload safety.
 */
export function persistDatabaseLocally(): void {
  if (!activeDb) return;
  try {
    const bytes = activeDb.export();
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    localStorage.setItem(LOCAL_STORAGE_DB_KEY, base64);
  } catch (err) {
    console.warn('Could not persist SQLite buffer to localStorage (likely quota limit for large files):', err);
  }
}

/**
 * Exports current database as a downloadable .db SQLite file.
 */
export async function downloadSqliteDbFile(filename: string = 'astrology_bimtree.db'): Promise<void> {
  const db = await getSqliteDatabase();
  const binaryData = db.export();
  const blob = new Blob([binaryData], { type: 'application/x-sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Restores database from an uploaded .db file.
 */
export async function importSqliteDbFile(file: File): Promise<void> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm',
  });
  const db = new SQL.Database(bytes);
  initSchema(db);
  activeDb = db;
  persistDatabaseLocally();
}

/**
 * Exports database records as SQL INSERT script.
 */
export async function exportSqlScript(treeId?: number): Promise<string> {
  const db = await getSqliteDatabase();
  const filterClause = treeId ? `WHERE tree_id = ${treeId}` : '';
  const result = db.exec(`SELECT * FROM bimtree_dasha_periods ${filterClause} ORDER BY tree_id, row_seq ASC`);

  let sql = `-- BPHS Bimtree SQLite Export\n-- Generated on: ${new Date().toISOString()}\n\n`;
  sql += `CREATE TABLE IF NOT EXISTS bimtree_dasha_periods (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  tree_id INTEGER NOT NULL,\n  row_seq INTEGER NOT NULL,\n  combination_code TEXT NOT NULL,\n  username TEXT NOT NULL,\n  md TEXT NOT NULL,\n  ad TEXT NOT NULL,\n  pd TEXT NOT NULL,\n  start_time TEXT NOT NULL,\n  end_time TEXT NOT NULL,\n  duration_days REAL,\n  inferred_narrative TEXT,\n  lived_narrative TEXT,\n  rating INTEGER,\n  created_at TEXT DEFAULT CURRENT_TIMESTAMP,\n  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,\n  UNIQUE(tree_id, row_seq),\n  UNIQUE(combination_code)\n);\n\n`;

  if (result.length > 0) {
    const { columns, values } = result[0];
    for (const row of values) {
      const escaped = row.map((v) => {
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return v;
        return `'${String(v).replace(/'/g, "''")}'`;
      });
      sql += `INSERT OR REPLACE INTO bimtree_dasha_periods (${columns.join(', ')}) VALUES (${escaped.join(', ')});\n`;
    }
  }

  return sql;
}

/**
 * Exports database records as CSV.
 */
export async function exportCsvScript(treeId?: number): Promise<string> {
  const db = await getSqliteDatabase();
  const filterClause = treeId ? `WHERE tree_id = ${treeId}` : '';
  const result = db.exec(`SELECT tree_id, row_seq, combination_code, username, md, ad, pd, start_time, end_time, duration_days, inferred_narrative, lived_narrative, rating FROM bimtree_dasha_periods ${filterClause} ORDER BY tree_id, row_seq ASC`);

  if (result.length === 0) return 'tree_id,row_seq,combination_code,username,md,ad,pd,start_time,end_time,duration_days,inferred_narrative,lived_narrative,rating\n';

  const { columns, values } = result[0];
  const header = columns.join(',');
  const lines = values.map((row) =>
    row
      .map((val) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(',')
  );

  return [header, ...lines].join('\n');
}

/**
 * Retrieves summary of all ingested trees.
 */
export async function getTreeSummaries(): Promise<TreeSummary[]> {
  const db = await getSqliteDatabase();
  const res = db.exec(`
    SELECT 
      tree_id,
      username,
      COUNT(*) as total_periods,
      SUM(CASE WHEN inferred_narrative IS NOT NULL AND inferred_narrative != '' THEN 1 ELSE 0 END) as inferred_count,
      SUM(CASE WHEN lived_narrative IS NOT NULL AND lived_narrative != '' THEN 1 ELSE 0 END) as lived_count,
      ROUND(AVG(rating), 2) as avg_rating,
      MIN(start_time) as earliest_date,
      MAX(end_time) as latest_date
    FROM bimtree_dasha_periods
    GROUP BY tree_id, username
    ORDER BY tree_id ASC
  `);

  if (res.length === 0) return [];

  return res[0].values.map((v) => ({
    tree_id: Number(v[0]),
    username: String(v[1]),
    total_periods: Number(v[2]),
    inferred_count: Number(v[3] || 0),
    lived_count: Number(v[4] || 0),
    avg_rating: v[5] !== null ? Number(v[5]) : null,
    earliest_date: String(v[6]),
    latest_date: String(v[7]),
  }));
}

/**
 * Queries periods for a specific tree with optional filtering.
 */
export async function queryBimtreePeriods(params: {
  treeId: number;
  md?: string;
  ad?: string;
  pd?: string;
  search?: string;
  filterStatus?: 'all' | 'has_inferred' | 'has_lived' | 'unannotated' | 'rated';
  minRating?: number;
  limit?: number;
  offset?: number;
}): Promise<{ rows: BimtreeRow[]; totalCount: number }> {
  const db = await getSqliteDatabase();
  const conditions: string[] = [`tree_id = ${params.treeId}`];

  if (params.md) conditions.push(`md = '${params.md.replace(/'/g, "''")}'`);
  if (params.ad) conditions.push(`ad = '${params.ad.replace(/'/g, "''")}'`);
  if (params.pd) conditions.push(`pd = '${params.pd.replace(/'/g, "''")}'`);

  if (params.filterStatus === 'has_inferred') {
    conditions.push(`inferred_narrative IS NOT NULL AND inferred_narrative != ''`);
  } else if (params.filterStatus === 'has_lived') {
    conditions.push(`lived_narrative IS NOT NULL AND lived_narrative != ''`);
  } else if (params.filterStatus === 'unannotated') {
    conditions.push(`(inferred_narrative IS NULL OR inferred_narrative = '') AND (lived_narrative IS NULL OR lived_narrative = '')`);
  } else if (params.filterStatus === 'rated') {
    conditions.push(`rating IS NOT NULL`);
  }

  if (params.minRating && params.minRating > 0) {
    conditions.push(`rating >= ${params.minRating}`);
  }

  if (params.search && params.search.trim()) {
    const s = params.search.trim().replace(/'/g, "''");
    conditions.push(`(combination_code LIKE '%${s}%' OR inferred_narrative LIKE '%${s}%' OR lived_narrative LIKE '%${s}%' OR md LIKE '%${s}%' OR ad LIKE '%${s}%' OR pd LIKE '%${s}%')`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countRes = db.exec(`SELECT COUNT(*) FROM bimtree_dasha_periods ${whereClause}`);
  const totalCount = countRes.length > 0 ? Number(countRes[0].values[0][0]) : 0;

  // Get rows
  const limit = params.limit || 100;
  const offset = params.offset || 0;
  const query = `
    SELECT 
      id, tree_id, row_seq, combination_code, username, md, ad, pd, 
      start_time, end_time, duration_days, inferred_narrative, lived_narrative, rating,
      created_at, updated_at
    FROM bimtree_dasha_periods
    ${whereClause}
    ORDER BY row_seq ASC
    LIMIT ${limit} OFFSET ${offset}
  `;

  const res = db.exec(query);
  if (res.length === 0) return { rows: [], totalCount };

  const rows: BimtreeRow[] = res[0].values.map((v) => ({
    id: Number(v[0]),
    tree_id: Number(v[1]),
    row_seq: Number(v[2]),
    combination_code: String(v[3]),
    username: String(v[4]),
    md: String(v[5]),
    ad: String(v[6]),
    pd: String(v[7]),
    start_time: String(v[8]),
    end_time: String(v[9]),
    duration_days: Number(v[10]),
    inferred_narrative: v[11] ? String(v[11]) : null,
    lived_narrative: v[12] ? String(v[12]) : null,
    rating: v[13] !== null ? Number(v[13]) : null,
    created_at: String(v[14]),
    updated_at: String(v[15]),
  }));

  return { rows, totalCount };
}

/**
 * Finds the specific period running on a target date/time for a given tree.
 */
export async function findPeriodByDate(treeId: number, targetDate: string): Promise<BimtreeRow | null> {
  const db = await getSqliteDatabase();
  const formatted = targetDate.includes('T') ? targetDate.replace('T', ' ') : targetDate;
  const query = `
    SELECT 
      id, tree_id, row_seq, combination_code, username, md, ad, pd, 
      start_time, end_time, duration_days, inferred_narrative, lived_narrative, rating,
      created_at, updated_at
    FROM bimtree_dasha_periods
    WHERE tree_id = ${treeId}
      AND '${formatted.replace(/'/g, "''")}' >= start_time 
      AND '${formatted.replace(/'/g, "''")}' <= end_time
    LIMIT 1
  `;
  const res = db.exec(query);
  if (res.length === 0 || res[0].values.length === 0) return null;

  const v = res[0].values[0];
  return {
    id: Number(v[0]),
    tree_id: Number(v[1]),
    row_seq: Number(v[2]),
    combination_code: String(v[3]),
    username: String(v[4]),
    md: String(v[5]),
    ad: String(v[6]),
    pd: String(v[7]),
    start_time: String(v[8]),
    end_time: String(v[9]),
    duration_days: Number(v[10]),
    inferred_narrative: v[11] ? String(v[11]) : null,
    lived_narrative: v[12] ? String(v[12]) : null,
    rating: v[13] !== null ? Number(v[13]) : null,
    created_at: String(v[14]),
    updated_at: String(v[15]),
  };
}

/**
 * Updates the inferred narrative and optional rating for a combination code (constrained <= 2000 characters).
 */
export async function updateInferredNarrative(
  combinationCode: string,
  narrative: string,
  rating?: number | null
): Promise<boolean> {
  const db = await getSqliteDatabase();
  const truncated = narrative.slice(0, 2000);
  const ratingClause = rating !== undefined ? `, rating = ${rating === null ? 'NULL' : rating}` : '';

  db.run(
    `UPDATE bimtree_dasha_periods 
     SET inferred_narrative = ?, updated_at = CURRENT_TIMESTAMP ${ratingClause}
     WHERE combination_code = ?`,
    [truncated, combinationCode]
  );

  persistDatabaseLocally();
  return true;
}

/**
 * Updates the lived narrative and optional rating for a combination code (constrained <= 2000 characters).
 */
export async function updateLivedNarrative(
  combinationCode: string,
  narrative: string,
  rating?: number | null
): Promise<boolean> {
  const db = await getSqliteDatabase();
  const truncated = narrative.slice(0, 2000);
  const ratingClause = rating !== undefined ? `, rating = ${rating === null ? 'NULL' : rating}` : '';

  db.run(
    `UPDATE bimtree_dasha_periods 
     SET lived_narrative = ?, updated_at = CURRENT_TIMESTAMP ${ratingClause}
     WHERE combination_code = ?`,
    [truncated, combinationCode]
  );

  persistDatabaseLocally();
  return true;
}

/**
 * Updates the 1-5 rating directly.
 */
export async function updatePeriodRating(combinationCode: string, rating: number | null): Promise<boolean> {
  const db = await getSqliteDatabase();
  db.run(
    `UPDATE bimtree_dasha_periods 
     SET rating = ?, updated_at = CURRENT_TIMESTAMP
     WHERE combination_code = ?`,
    [rating, combinationCode]
  );
  persistDatabaseLocally();
  return true;
}

/**
 * Calculates next unique tree_id.
 */
export async function getNextTreeId(): Promise<number> {
  const db = await getSqliteDatabase();
  const res = db.exec(`SELECT MAX(tree_id) FROM bimtree_dasha_periods`);
  if (res.length > 0 && res[0].values.length > 0 && res[0].values[0][0] !== null) {
    return Number(res[0].values[0][0]) + 1;
  }
  return 1001;
}

/**
 * Standard BPHS Vimshottari Dasha Math:
 * Calculates all 729 sequential MD -> AD -> PD windows starting from birth date and start balance.
 */
export function generateFull729Bimtree(
  username: string,
  treeId: number,
  birthDateStr: string = '1976-01-26',
  startingDashaName: string = 'Saturn',
  balanceYearsFraction: number = 13.18
): BimtreeRow[] {
  const rows: BimtreeRow[] = [];
  const TOTAL_CYCLE_YEARS = 120;
  const DAYS_PER_YEAR = 365.2425;

  // Find starting lord index
  const startIdx = VIMSHOTTARI_LORDS.findIndex(
    (l) => l.name.toLowerCase() === startingDashaName.toLowerCase()
  );
  const actualStartIdx = startIdx >= 0 ? startIdx : 0;

  // Compute base start epoch in milliseconds
  let currentStartTime = new Date(birthDateStr).getTime();
  let rowSeq = 1;

  for (let m = 0; m < 9; m++) {
    const mdLord = VIMSHOTTARI_LORDS[(actualStartIdx + m) % 9];
    // If it's the very first dasha, apply the remaining balance
    const mdTotalYears = m === 0 && balanceYearsFraction > 0 ? balanceYearsFraction : mdLord.years;

    for (let a = 0; a < 9; a++) {
      const adLord = VIMSHOTTARI_LORDS[((actualStartIdx + m) % 9 + a) % 9];
      // Proportion of AD in this MD
      const adRatio = adLord.years / TOTAL_CYCLE_YEARS;
      const adTotalDays = mdTotalYears * adRatio * DAYS_PER_YEAR;

      for (let p = 0; p < 9; p++) {
        const pdLord = VIMSHOTTARI_LORDS[(((actualStartIdx + m) % 9 + a) % 9 + p) % 9];
        // Proportion of PD in this AD
        const pdRatio = pdLord.years / TOTAL_CYCLE_YEARS;
        const pdTotalDays = adTotalDays * pdRatio;

        const periodStart = new Date(currentStartTime);
        const periodEnd = new Date(currentStartTime + pdTotalDays * 24 * 60 * 60 * 1000);

        const formatDate = (d: Date) => {
          const y = d.getUTCFullYear();
          const mStr = String(d.getUTCMonth() + 1).padStart(2, '0');
          const dayStr = String(d.getUTCDate()).padStart(2, '0');
          const hStr = String(d.getUTCHours()).padStart(2, '0');
          const minStr = String(d.getUTCMinutes()).padStart(2, '0');
          const secStr = String(d.getUTCSeconds()).padStart(2, '0');
          return `${y}-${mStr}-${dayStr} ${hStr}:${minStr}:${secStr}`;
        };

        const combination_code = `T${treeId}_R${String(rowSeq).padStart(4, '0')}`;

        rows.push({
          tree_id: treeId,
          row_seq: rowSeq,
          combination_code,
          username,
          md: mdLord.name,
          ad: adLord.name,
          pd: pdLord.name,
          start_time: formatDate(periodStart),
          end_time: formatDate(periodEnd),
          duration_days: Math.round(pdTotalDays * 100) / 100,
          inferred_narrative: null,
          lived_narrative: null,
          rating: null,
        });

        currentStartTime = periodEnd.getTime();
        rowSeq++;
      }
    }
  }

  return rows;
}

/**
 * Ingests and saves a full Bimtree set into SQLite table.
 */
export async function insertBimtreeRows(rows: BimtreeRow[]): Promise<void> {
  const db = await getSqliteDatabase();
  db.run('BEGIN TRANSACTION;');

  try {
    for (const r of rows) {
      db.run(
        `INSERT OR REPLACE INTO bimtree_dasha_periods 
         (tree_id, row_seq, combination_code, username, md, ad, pd, start_time, end_time, duration_days, inferred_narrative, lived_narrative, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r.tree_id,
          r.row_seq,
          r.combination_code,
          r.username,
          r.md,
          r.ad,
          r.pd,
          r.start_time,
          r.end_time,
          r.duration_days,
          r.inferred_narrative,
          r.lived_narrative,
          r.rating,
        ]
      );
    }
    db.run('COMMIT;');
    persistDatabaseLocally();
  } catch (err) {
    db.run('ROLLBACK;');
    throw err;
  }
}

/**
 * On-Demand Astrological Narrative Generator:
 * Evaluates the specific MD, AD, PD lords, house activations, Kendra/Trikona rulerships,
 * and synthesizes an authoritative inferred narrative (max 2000 chars) + 1-5 rating.
 */
export async function generateInferredNarrativeForCombination(
  row: BimtreeRow,
  grahas: GrahaPosition[],
  nativeMetadata?: NativeMetadata
): Promise<{ narrative: string; rating: number }> {
  const findPlanet = (name: string) =>
    grahas.find(
      (g) =>
        g.name.toLowerCase().includes(name.toLowerCase()) ||
        g.id.toLowerCase() === name.toLowerCase()
    );

  const mdGraha = findPlanet(row.md);
  const adGraha = findPlanet(row.ad);
  const pdGraha = findPlanet(row.pd);

  const mdHouse = mdGraha?.houseFromLagna || 1;
  const adHouse = adGraha?.houseFromLagna || 1;
  const pdHouse = pdGraha?.houseFromLagna || 1;

  const lagnaName = nativeMetadata?.lagna || 'Dhanusu';

  // Determine houses of focus
  const housesOfFocus = Array.from(new Set([mdHouse, adHouse, pdHouse])).sort((a, b) => a - b);
  const housesStr = housesOfFocus.map((h) => `${h}th`).join(', ');

  // Assess Dhana / Raja Yoga potential
  const isWealthHouse = (h: number) => [2, 5, 9, 11].includes(h);
  const isKendra = (h: number) => [1, 4, 7, 10].includes(h);
  const isTrika = (h: number) => [6, 8, 12].includes(h);

  let score = 3;
  let yogaDesc = '';

  const wealthCount = [mdHouse, adHouse, pdHouse].filter(isWealthHouse).length;
  const kendraCount = [mdHouse, adHouse, pdHouse].filter(isKendra).length;
  const trikaCount = [mdHouse, adHouse, pdHouse].filter(isTrika).length;

  if (wealthCount >= 2) {
    score = 5;
    yogaDesc = 'Dhana Yoga activation is pronounced. Financial accumulation, liquid assets appreciation, and commercial fruition are powerfully triggered.';
  } else if (kendraCount >= 2 && trikaCount === 0) {
    score = 4;
    yogaDesc = 'Kendra Sthana resonance promotes professional elevation, authoritative recognition, and structural expansion in career endeavors.';
  } else if (trikaCount >= 2) {
    score = 2;
    yogaDesc = 'Trika sthana (dusthana) influence mandates strict risk mitigation, conservative debt management, and health vigilance against stress-induced fatigue.';
  } else {
    score = 3;
    yogaDesc = 'Balanced epoch featuring moderate progress with routine operational responsibilities and steady developmental trajectory.';
  }

  // Check specific planetary relationships (e.g., Guru-Shukra)
  let planetSpecifics = '';
  const lords = [row.md.toLowerCase(), row.ad.toLowerCase(), row.pd.toLowerCase()];
  if (lords.includes('jupiter') && lords.includes('venus')) {
    planetSpecifics = 'The mutual energy of Jupiter (Brihaspati) and Venus (Shukra) brings combined wisdom and material prosperity, creating strong avenues for financial expansion, real estate dealings, and elevated status.';
  } else if (lords.includes('saturn') && lords.includes('mercury')) {
    planetSpecifics = 'Saturn-Mercury synergy demands analytical precision, disciplined accounting, and patient commercial negotiations. Technical projects and long-term contracts find solid grounding.';
  } else if (lords.includes('sun') && lords.includes('mars')) {
    planetSpecifics = 'Sun-Mars dynamism provides decisive executive initiative, courageous decision-making, and administrative leadership.';
  } else if (lords.includes('rahu')) {
    planetSpecifics = 'Rahu sub-period injects unconventional avenues, foreign linkages, or sudden shifts that require rigorous verification of credentials and contractual clarity.';
  } else {
    planetSpecifics = `${row.md} Mahadasha provides the foundational overarching baseline, ${row.ad} Antardasha sets the operational medium, while ${row.pd} Pratyantardasha triggers the immediate timing mechanism.`;
  }

  const narrative = `[BPHS Inferred Synthesis • ${row.combination_code}]
Period: ${row.md} MD $\\rightarrow$ ${row.ad} AD $\\rightarrow$ ${row.pd} PD (${row.start_time.slice(0, 10)} to ${row.end_time.slice(0, 10)}).
Lagna Reference: ${lagnaName} (Houses Activated: ${housesStr}).

1. Astrological Architecture & House Activations:
${row.md} occupies house ${mdHouse}, ${row.ad} is placed in house ${adHouse}, and ${row.pd} operates through house ${pdHouse}. ${yogaDesc}

2. Planetary Vibrations & Synergy:
${planetSpecifics}

3. Strategic Inferences & Timing Guidance:
During this ${Math.round(row.duration_days)} day sub-window, primary outcomes align with houses ${housesStr}. Auspicious for capitalizing on planetary rulerships while ensuring prudent contingency buffers against transit friction.
Rating Assessment: ${score} / 5 (Auspiciousness & Opportunity Index).`.slice(0, 2000);

  return { narrative, rating: score };
}
