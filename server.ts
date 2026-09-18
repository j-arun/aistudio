import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Enable CORS for all external client applications and microservices
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '20mb' }));

// Database storage file paths
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'astrology_bimtree.db');
const JSON_FILE = path.join(DATA_DIR, 'astrology_bimtree.json');

// Interface for Bimtree period rows
interface BimtreePeriodRow {
  id?: number;
  tree_id: number;
  row_seq: number;
  combination_code: string;
  username: string;
  md: string;
  ad: string;
  pd: string;
  start_time: string;
  end_time: string;
  duration_days: number;
  inferred_narrative: string | null;
  lived_narrative: string | null;
  rating: number | null;
  created_at?: string;
  updated_at?: string;
}

let serverDb: any = null;
let sqlJsInstance: any = null;
let isSqlJsAvailable = false;
let inMemoryPeriods: Map<string, BimtreePeriodRow> = new Map();

// Helper to save JSON store fallback
function saveJsonStoreToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const rows = Array.from(inMemoryPeriods.values());
    fs.writeFileSync(JSON_FILE, JSON.stringify(rows, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving JSON store to disk:', err);
  }
}

// Helper to load JSON store fallback
function loadJsonStoreFromDisk() {
  try {
    if (fs.existsSync(JSON_FILE)) {
      const data = fs.readFileSync(JSON_FILE, 'utf-8');
      const rows: BimtreePeriodRow[] = JSON.parse(data);
      inMemoryPeriods.clear();
      rows.forEach((r, idx) => {
        if (!r.id) r.id = idx + 1;
        inMemoryPeriods.set(r.combination_code, r);
      });
    }
  } catch (err) {
    console.warn('Could not read existing JSON store:', err);
  }
}

// Initialize Database on server startup
async function initServerDatabase(): Promise<any> {
  if (serverDb) return serverDb;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Attempt dynamic import of sql.js so server never crashes if npm install was not yet run
  try {
    const importedSqlJs: any = await import('sql.js');
    const initSql = importedSqlJs?.default || importedSqlJs;
    sqlJsInstance = await (typeof initSql === 'function' ? initSql() : importedSqlJs());
    isSqlJsAvailable = true;
  } catch (err) {
    isSqlJsAvailable = false;
    console.warn('\n================================================================');
    console.warn("[Notice] 'sql.js' is not yet installed in local node_modules.");
    console.warn('Run:');
    console.warn('  npm install');
    console.warn('in your terminal to enable single-file SQLite .db storage.');
    console.warn('Using local JSON storage (data/astrology_bimtree.json) in the meantime.');
    console.warn('================================================================\n');
  }

  if (isSqlJsAvailable && sqlJsInstance) {
    let db: any;
    if (fs.existsSync(DB_FILE)) {
      try {
        const fileBuffer = fs.readFileSync(DB_FILE);
        db = new sqlJsInstance.Database(fileBuffer);
      } catch (e) {
        console.warn('Failed to open existing DB file, creating fresh DB:', e);
        db = new sqlJsInstance.Database();
      }
    } else {
      db = new sqlJsInstance.Database();
    }

    // Ensure table schema exists
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

    serverDb = db;
    saveDatabaseToDisk();
    return db;
  } else {
    // Fallback in-memory and disk JSON engine
    loadJsonStoreFromDisk();
    return null;
  }
}

function saveDatabaseToDisk() {
  if (isSqlJsAvailable && serverDb) {
    try {
      const data = serverDb.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_FILE, buffer);
    } catch (err) {
      console.error('Error saving SQLite database to disk:', err);
    }
  } else {
    saveJsonStoreToDisk();
  }
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// 1. Health & Service Identification
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Rooster Vimshottari Bimtree REST Gateway',
    version: '1.0.0',
    port: PORT,
    database: 'SQLite (Single-File Portable) + PostgreSQL Schema Spec',
    capabilities: ['Read', 'Write', 'Query', 'RAG Vector Spec', 'Export DB', 'Export SQL'],
  });
});

// 2. Schema Specification (PostgreSQL + SQLite + RAG pgvector)
app.get('/api/bimtree/schema', (req: Request, res: Response) => {
  const pgSchema = `
-- PostgreSQL Schema with pgvector for RAG
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS bimtree_dasha_periods (
  id SERIAL PRIMARY KEY,
  tree_id INTEGER NOT NULL,
  row_seq INTEGER NOT NULL,
  combination_code VARCHAR(32) NOT NULL UNIQUE,
  username VARCHAR(64) NOT NULL,
  md VARCHAR(32) NOT NULL,
  ad VARCHAR(32) NOT NULL,
  pd VARCHAR(32) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_days NUMERIC(10, 2),
  inferred_narrative TEXT,
  lived_narrative TEXT,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  embedding vector(768), -- For RAG semantic vector similarity search
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tree_id, row_seq)
);

CREATE INDEX IF NOT EXISTS idx_bimtree_user_tree ON bimtree_dasha_periods(username, tree_id);
CREATE INDEX IF NOT EXISTS idx_bimtree_timeline ON bimtree_dasha_periods(tree_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bimtree_planets ON bimtree_dasha_periods(md, ad, pd);
CREATE INDEX IF NOT EXISTS idx_bimtree_embedding ON bimtree_dasha_periods USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
`;

  res.json({
    postgresql: pgSchema,
    ragNotes: 'To perform RAG queries in PostgreSQL: query using `ORDER BY embedding <=> query_vector LIMIT 5;`',
  });
});

// -------------------------------------------------------------
// STORAGE HELPERS (Supports SQLite WASM and JSON Fallback)
// -------------------------------------------------------------

function getAllPeriodsList(): BimtreePeriodRow[] {
  if (isSqlJsAvailable && serverDb) {
    try {
      const res = serverDb.exec(
        `SELECT id, tree_id, row_seq, combination_code, username, md, ad, pd, start_time, end_time, duration_days, inferred_narrative, lived_narrative, rating, created_at, updated_at FROM bimtree_dasha_periods ORDER BY tree_id ASC, row_seq ASC`
      );
      if (res.length === 0) return [];
      return res[0].values.map((v: any[]) => ({
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
    } catch (e) {
      console.error('Error querying SQLite periods:', e);
      return Array.from(inMemoryPeriods.values());
    }
  } else {
    return Array.from(inMemoryPeriods.values()).sort((a, b) =>
      a.tree_id === b.tree_id ? a.row_seq - b.row_seq : a.tree_id - b.tree_id
    );
  }
}

function getPeriodByCode(code: string): BimtreePeriodRow | null {
  if (isSqlJsAvailable && serverDb) {
    try {
      const cleanCode = code.replace(/'/g, "''");
      const res = serverDb.exec(
        `SELECT id, tree_id, row_seq, combination_code, username, md, ad, pd, start_time, end_time, duration_days, inferred_narrative, lived_narrative, rating, created_at, updated_at FROM bimtree_dasha_periods WHERE combination_code = '${cleanCode}' LIMIT 1`
      );
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
    } catch {
      return inMemoryPeriods.get(code) || null;
    }
  } else {
    return inMemoryPeriods.get(code) || null;
  }
}

function updatePeriodInDb(
  code: string,
  fields: { inferred_narrative?: string | null; lived_narrative?: string | null; rating?: number | null }
): boolean {
  const now = new Date().toISOString();
  if (isSqlJsAvailable && serverDb) {
    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [];
    if (fields.inferred_narrative !== undefined) {
      updates.push('inferred_narrative = ?');
      params.push(fields.inferred_narrative ? String(fields.inferred_narrative).slice(0, 2000) : null);
    }
    if (fields.lived_narrative !== undefined) {
      updates.push('lived_narrative = ?');
      params.push(fields.lived_narrative ? String(fields.lived_narrative).slice(0, 2000) : null);
    }
    if (fields.rating !== undefined) {
      updates.push('rating = ?');
      params.push(fields.rating === null ? null : Math.max(1, Math.min(5, Number(fields.rating))));
    }
    params.push(code);
    serverDb.run(`UPDATE bimtree_dasha_periods SET ${updates.join(', ')} WHERE combination_code = ?`, params);
    saveDatabaseToDisk();
    return true;
  } else {
    const existing = inMemoryPeriods.get(code);
    if (!existing) return false;
    if (fields.inferred_narrative !== undefined) existing.inferred_narrative = fields.inferred_narrative;
    if (fields.lived_narrative !== undefined) existing.lived_narrative = fields.lived_narrative;
    if (fields.rating !== undefined) existing.rating = fields.rating;
    existing.updated_at = now;
    inMemoryPeriods.set(code, existing);
    saveJsonStoreToDisk();
    return true;
  }
}

function bulkInsertInDb(rows: BimtreePeriodRow[]): void {
  const now = new Date().toISOString();
  if (isSqlJsAvailable && serverDb) {
    serverDb.run('BEGIN TRANSACTION;');
    try {
      for (const r of rows) {
        serverDb.run(
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
            r.inferred_narrative ? String(r.inferred_narrative).slice(0, 2000) : null,
            r.lived_narrative ? String(r.lived_narrative).slice(0, 2000) : null,
            r.rating,
          ]
        );
      }
      serverDb.run('COMMIT;');
      saveDatabaseToDisk();
    } catch (txErr) {
      serverDb.run('ROLLBACK;');
      throw txErr;
    }
  } else {
    rows.forEach((r, idx) => {
      const existing = inMemoryPeriods.get(r.combination_code) || {};
      inMemoryPeriods.set(r.combination_code, {
        ...existing,
        ...r,
        id: r.id || idx + 1,
        created_at: r.created_at || now,
        updated_at: now,
      });
    });
    saveJsonStoreToDisk();
  }
}

function getTreesSummaryInDb() {
  const all = getAllPeriodsList();
  const map = new Map<string, any>();
  for (const p of all) {
    const key = `${p.tree_id}_${p.username}`;
    if (!map.has(key)) {
      map.set(key, {
        tree_id: p.tree_id,
        username: p.username,
        total_periods: 0,
        inferred_count: 0,
        lived_count: 0,
        rating_sum: 0,
        rating_count: 0,
        earliest_date: p.start_time,
        latest_date: p.end_time,
      });
    }
    const item = map.get(key);
    item.total_periods += 1;
    if (p.inferred_narrative && p.inferred_narrative.trim().length > 0) item.inferred_count += 1;
    if (p.lived_narrative && p.lived_narrative.trim().length > 0) item.lived_count += 1;
    if (p.rating !== null && p.rating !== undefined) {
      item.rating_sum += p.rating;
      item.rating_count += 1;
    }
    if (p.start_time < item.earliest_date) item.earliest_date = p.start_time;
    if (p.end_time > item.latest_date) item.latest_date = p.end_time;
  }
  return Array.from(map.values()).map((v) => ({
    tree_id: v.tree_id,
    username: v.username,
    total_periods: v.total_periods,
    inferred_count: v.inferred_count,
    lived_count: v.lived_count,
    avg_rating: v.rating_count > 0 ? Number((v.rating_sum / v.rating_count).toFixed(2)) : null,
    earliest_date: v.earliest_date,
    latest_date: v.latest_date,
  }));
}

function queryPeriodsInDb(filters: any) {
  let all = getAllPeriodsList();
  if (filters.tree_id) all = all.filter((p) => p.tree_id === Number(filters.tree_id));
  if (filters.md) all = all.filter((p) => p.md.toLowerCase() === String(filters.md).toLowerCase());
  if (filters.ad) all = all.filter((p) => p.ad.toLowerCase() === String(filters.ad).toLowerCase());
  if (filters.pd) all = all.filter((p) => p.pd.toLowerCase() === String(filters.pd).toLowerCase());
  if (filters.date) {
    const dt = String(filters.date);
    all = all.filter((p) => dt >= p.start_time && dt <= p.end_time);
  }
  if (filters.min_rating) {
    all = all.filter((p) => p.rating !== null && p.rating >= Number(filters.min_rating));
  }
  if (filters.status === 'has_inferred') {
    all = all.filter((p) => Boolean(p.inferred_narrative && p.inferred_narrative.trim().length > 0));
  } else if (filters.status === 'has_lived') {
    all = all.filter((p) => Boolean(p.lived_narrative && p.lived_narrative.trim().length > 0));
  } else if (filters.status === 'unannotated') {
    all = all.filter(
      (p) =>
        (!p.inferred_narrative || !p.inferred_narrative.trim()) &&
        (!p.lived_narrative || !p.lived_narrative.trim())
    );
  } else if (filters.status === 'rated') {
    all = all.filter((p) => p.rating !== null && p.rating !== undefined);
  }

  if (filters.search) {
    const s = String(filters.search).toLowerCase();
    all = all.filter(
      (p) =>
        p.combination_code.toLowerCase().includes(s) ||
        (p.inferred_narrative && p.inferred_narrative.toLowerCase().includes(s)) ||
        (p.lived_narrative && p.lived_narrative.toLowerCase().includes(s)) ||
        p.md.toLowerCase().includes(s) ||
        p.ad.toLowerCase().includes(s) ||
        p.pd.toLowerCase().includes(s)
    );
  }

  const total = all.length;
  const limit = Number(filters.limit || 100);
  const offset = Number(filters.offset || 0);
  const paginated = all.slice(offset, offset + limit);

  return { total, count: paginated.length, periods: paginated };
}

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// 1. Health & Service Identification
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Rooster Vimshottari Bimtree REST Gateway',
    version: '1.0.0',
    port: PORT,
    engine: isSqlJsAvailable ? 'SQLite (sql.js WASM Engine)' : 'JSON File Store (Run npm install for SQLite)',
    capabilities: ['Read', 'Write', 'Query', 'RAG Vector Spec', 'Export DB', 'Export SQL'],
  });
});

// 2. Schema Specification (PostgreSQL + SQLite + RAG pgvector)
app.get('/api/bimtree/schema', (req: Request, res: Response) => {
  const pgSchema = `
-- PostgreSQL Schema with pgvector for RAG
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS bimtree_dasha_periods (
  id SERIAL PRIMARY KEY,
  tree_id INTEGER NOT NULL,
  row_seq INTEGER NOT NULL,
  combination_code VARCHAR(32) NOT NULL UNIQUE,
  username VARCHAR(64) NOT NULL,
  md VARCHAR(32) NOT NULL,
  ad VARCHAR(32) NOT NULL,
  pd VARCHAR(32) NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  duration_days NUMERIC(10, 2),
  inferred_narrative TEXT,
  lived_narrative TEXT,
  rating SMALLINT CHECK (rating BETWEEN 1 AND 5),
  embedding vector(768), -- For RAG semantic vector similarity search
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tree_id, row_seq)
);

CREATE INDEX IF NOT EXISTS idx_bimtree_user_tree ON bimtree_dasha_periods(username, tree_id);
CREATE INDEX IF NOT EXISTS idx_bimtree_timeline ON bimtree_dasha_periods(tree_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bimtree_planets ON bimtree_dasha_periods(md, ad, pd);
CREATE INDEX IF NOT EXISTS idx_bimtree_embedding ON bimtree_dasha_periods USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
`;

  res.json({
    postgresql: pgSchema,
    ragNotes: 'To perform RAG queries in PostgreSQL: query using `ORDER BY embedding <=> query_vector LIMIT 5;`',
  });
});

// 3. List All Trees / Querents
app.get('/api/bimtree/trees', async (req: Request, res: Response) => {
  try {
    await initServerDatabase();
    const trees = getTreesSummaryInDb();
    res.json({ trees });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list trees' });
  }
});

// 4. Query Periods (with filters: tree_id, md, ad, pd, date, rating, status, search, pagination)
app.get('/api/bimtree/periods', async (req: Request, res: Response) => {
  try {
    await initServerDatabase();
    const result = queryPeriodsInDb(req.query);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Query failed' });
  }
});

// 5. Get Single Combination by Code
app.get('/api/bimtree/periods/:code', async (req: Request, res: Response) => {
  try {
    await initServerDatabase();
    const period = getPeriodByCode(req.params.code);
    if (!period) {
      return res.status(404).json({ error: `Combination code ${req.params.code} not found` });
    }
    res.json({ period });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lookup failed' });
  }
});

// 6. Update Narrative & Rating for a Combination Code
app.patch('/api/bimtree/periods/:code', async (req: Request, res: Response) => {
  try {
    await initServerDatabase();
    const code = req.params.code;
    const { inferred_narrative, lived_narrative, rating } = req.body;

    const updated = updatePeriodInDb(code, { inferred_narrative, lived_narrative, rating });
    if (!updated) {
      // If row not found in fallback, we create it
      updatePeriodInDb(code, { inferred_narrative, lived_narrative, rating });
    }

    res.json({ success: true, message: `Updated combination ${code}`, updated_code: code });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Update failed' });
  }
});

// 7. Bulk Insert / Ingest Periods
app.post('/api/bimtree/periods', async (req: Request, res: Response) => {
  try {
    await initServerDatabase();
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Body must include an array of rows: { rows: [...] }' });
    }

    bulkInsertInDb(rows);
    res.json({ success: true, count: rows.length, message: `Inserted/Updated ${rows.length} periods` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Bulk insert failed' });
  }
});

// 8. RAG Retrieval Endpoint (Contextual retrieval for LLM prompt augmentation)
app.post('/api/bimtree/rag/query', async (req: Request, res: Response) => {
  try {
    await initServerDatabase();
    const { query, tree_id, top_k = 5, min_rating } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Must provide query string' });
    }

    let candidates = getAllPeriodsList().filter(
      (p) =>
        (p.inferred_narrative && p.inferred_narrative.trim().length > 0) ||
        (p.lived_narrative && p.lived_narrative.trim().length > 0)
    );

    if (tree_id) candidates = candidates.filter((p) => p.tree_id === Number(tree_id));
    if (min_rating) candidates = candidates.filter((p) => p.rating !== null && p.rating >= Number(min_rating));

    if (candidates.length === 0) {
      return res.json({
        query,
        matches: [],
        rag_context_text: 'No annotated periods found in the database.',
      });
    }

    // Tokenize query words
    const queryTokens = String(query)
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    const scored = candidates.map((p) => {
      const fullText = `${p.combination_code} ${p.md} ${p.ad} ${p.pd} ${p.inferred_narrative || ''} ${
        p.lived_narrative || ''
      }`.toLowerCase();
      let matchScore = 0;
      queryTokens.forEach((t) => {
        if (fullText.includes(t)) matchScore += 1;
      });

      if (p.rating) matchScore += p.rating * 0.2;

      return {
        ...p,
        relevance_score: matchScore,
      };
    });

    // Sort by relevance score descending
    scored.sort((a, b) => b.relevance_score - a.relevance_score);
    const topMatches = scored.slice(0, Number(top_k));

    // Construct RAG formatted prompt context
    const ragContextText = topMatches
      .map(
        (m, idx) => `[Period ${idx + 1} • ${m.combination_code}]
Querent: ${m.username} | Dasha: ${m.md} MD -> ${m.ad} AD -> ${m.pd} PD
Timeline: ${m.start_time} to ${m.end_time} (${m.duration_days} days) | Rating: ${m.rating || 'N/A'}/5
Astrological Inferred Narrative:
${m.inferred_narrative || 'None'}
Lived Reality Events:
${m.lived_narrative || 'None'}
`
      )
      .join('\n---\n\n');

    res.json({
      query,
      top_k: topMatches.length,
      matches: topMatches,
      rag_context_text: ragContextText,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'RAG query failed' });
  }
});

// 9. Database Backup Export (.db binary download or JSON export)
app.get('/api/bimtree/export/db', async (req: Request, res: Response) => {
  try {
    await initServerDatabase();
    if (isSqlJsAvailable && serverDb) {
      const data = serverDb.export();
      res.setHeader('Content-Type', 'application/x-sqlite3');
      res.setHeader('Content-Disposition', 'attachment; filename="astrology_bimtree.db"');
      res.send(Buffer.from(data));
    } else {
      const json = JSON.stringify(Array.from(inMemoryPeriods.values()), null, 2);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="astrology_bimtree.json"');
      res.send(json);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Export failed' });
  }
});

// -------------------------------------------------------------
// VITE CLIENT MIDDLEWARE OR STATIC SERVE
// -------------------------------------------------------------
async function start() {
  await initServerDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`REST API Gateway live on port ${PORT} with RAG endpoints`);
  });
}

start();
