import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import initSqlJs, { Database } from 'sql.js';

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

// Database storage file path
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'astrology_bimtree.db');

let serverDb: Database | null = null;

// Initialize Database on server startup
async function initServerDatabase(): Promise<Database> {
  if (serverDb) return serverDb;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();
  let db: Database;

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      db = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Failed to open existing DB file, creating fresh DB:', e);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
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
}

function saveDatabaseToDisk() {
  if (!serverDb) return;
  try {
    const data = serverDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
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

// 3. List All Trees / Querents
app.get('/api/bimtree/trees', async (req: Request, res: Response) => {
  try {
    const db = await initServerDatabase();
    const result = db.exec(`
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

    if (result.length === 0) {
      return res.json({ trees: [] });
    }

    const trees = result[0].values.map((v) => ({
      tree_id: Number(v[0]),
      username: String(v[1]),
      total_periods: Number(v[2]),
      inferred_count: Number(v[3] || 0),
      lived_count: Number(v[4] || 0),
      avg_rating: v[5] !== null ? Number(v[5]) : null,
      earliest_date: String(v[6]),
      latest_date: String(v[7]),
    }));

    res.json({ trees });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list trees' });
  }
});

// 4. Query Periods (with filters: tree_id, md, ad, pd, date, rating, status, search, pagination)
app.get('/api/bimtree/periods', async (req: Request, res: Response) => {
  try {
    const db = await initServerDatabase();
    const { tree_id, md, ad, pd, date, min_rating, status, search, limit = '100', offset = '0' } = req.query;

    const conditions: string[] = [];
    if (tree_id) conditions.push(`tree_id = ${Number(tree_id)}`);
    if (md) conditions.push(`md = '${String(md).replace(/'/g, "''")}'`);
    if (ad) conditions.push(`ad = '${String(ad).replace(/'/g, "''")}'`);
    if (pd) conditions.push(`pd = '${String(pd).replace(/'/g, "''")}'`);
    if (date) {
      const dt = String(date).replace(/'/g, "''");
      conditions.push(`'${dt}' >= start_time AND '${dt}' <= end_time`);
    }
    if (min_rating) conditions.push(`rating >= ${Number(min_rating)}`);

    if (status === 'has_inferred') {
      conditions.push(`inferred_narrative IS NOT NULL AND inferred_narrative != ''`);
    } else if (status === 'has_lived') {
      conditions.push(`lived_narrative IS NOT NULL AND lived_narrative != ''`);
    } else if (status === 'unannotated') {
      conditions.push(`(inferred_narrative IS NULL OR inferred_narrative = '') AND (lived_narrative IS NULL OR lived_narrative = '')`);
    } else if (status === 'rated') {
      conditions.push(`rating IS NOT NULL`);
    }

    if (search) {
      const s = String(search).replace(/'/g, "''");
      conditions.push(`(combination_code LIKE '%${s}%' OR inferred_narrative LIKE '%${s}%' OR lived_narrative LIKE '%${s}%' OR md LIKE '%${s}%' OR ad LIKE '%${s}%' OR pd LIKE '%${s}%')`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = db.exec(`SELECT COUNT(*) FROM bimtree_dasha_periods ${whereClause}`);
    const total = countRes.length > 0 ? Number(countRes[0].values[0][0]) : 0;

    const query = `
      SELECT 
        id, tree_id, row_seq, combination_code, username, md, ad, pd,
        start_time, end_time, duration_days, inferred_narrative, lived_narrative, rating,
        created_at, updated_at
      FROM bimtree_dasha_periods
      ${whereClause}
      ORDER BY tree_id ASC, row_seq ASC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}
    `;

    const resData = db.exec(query);
    const periods = resData.length > 0
      ? resData[0].values.map((v) => ({
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
        }))
      : [];

    res.json({ total, count: periods.length, periods });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Query failed' });
  }
});

// 5. Get Single Combination by Code
app.get('/api/bimtree/periods/:code', async (req: Request, res: Response) => {
  try {
    const db = await initServerDatabase();
    const code = req.params.code.replace(/'/g, "''");
    const result = db.exec(`SELECT * FROM bimtree_dasha_periods WHERE combination_code = '${code}' LIMIT 1`);

    if (result.length === 0 || result[0].values.length === 0) {
      return res.status(404).json({ error: `Combination code ${req.params.code} not found` });
    }

    const cols = result[0].columns;
    const row = result[0].values[0];
    const period: Record<string, any> = {};
    cols.forEach((col, idx) => {
      period[col] = row[idx];
    });

    res.json({ period });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lookup failed' });
  }
});

// 6. Update Narrative & Rating for a Combination Code
app.patch('/api/bimtree/periods/:code', async (req: Request, res: Response) => {
  try {
    const db = await initServerDatabase();
    const code = req.params.code;
    const { inferred_narrative, lived_narrative, rating } = req.body;

    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [];

    if (inferred_narrative !== undefined) {
      updates.push('inferred_narrative = ?');
      params.push(inferred_narrative ? String(inferred_narrative).slice(0, 2000) : null);
    }
    if (lived_narrative !== undefined) {
      updates.push('lived_narrative = ?');
      params.push(lived_narrative ? String(lived_narrative).slice(0, 2000) : null);
    }
    if (rating !== undefined) {
      updates.push('rating = ?');
      params.push(rating === null ? null : Math.max(1, Math.min(5, Number(rating))));
    }

    params.push(code);

    db.run(
      `UPDATE bimtree_dasha_periods SET ${updates.join(', ')} WHERE combination_code = ?`,
      params
    );

    saveDatabaseToDisk();
    res.json({ success: true, message: `Updated combination ${code}`, updated_code: code });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Update failed' });
  }
});

// 7. Bulk Insert / Ingest Periods
app.post('/api/bimtree/periods', async (req: Request, res: Response) => {
  try {
    const db = await initServerDatabase();
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Body must include an array of rows: { rows: [...] }' });
    }

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
            r.inferred_narrative ? String(r.inferred_narrative).slice(0, 2000) : null,
            r.lived_narrative ? String(r.lived_narrative).slice(0, 2000) : null,
            r.rating,
          ]
        );
      }
      db.run('COMMIT;');
      saveDatabaseToDisk();
      res.json({ success: true, count: rows.length, message: `Inserted/Updated ${rows.length} periods` });
    } catch (txErr) {
      db.run('ROLLBACK;');
      throw txErr;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Bulk insert failed' });
  }
});

// 8. RAG Retrieval Endpoint (Contextual retrieval for LLM prompt augmentation)
app.post('/api/bimtree/rag/query', async (req: Request, res: Response) => {
  try {
    const db = await initServerDatabase();
    const { query, tree_id, top_k = 5, min_rating } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Must provide query string' });
    }

    const treeFilter = tree_id ? `AND tree_id = ${Number(tree_id)}` : '';
    const ratingFilter = min_rating ? `AND rating >= ${Number(min_rating)}` : '';

    // Fetch periods that have narratives
    const sql = `
      SELECT combination_code, username, md, ad, pd, start_time, end_time, duration_days, inferred_narrative, lived_narrative, rating
      FROM bimtree_dasha_periods
      WHERE ((inferred_narrative IS NOT NULL AND inferred_narrative != '') OR (lived_narrative IS NOT NULL AND lived_narrative != ''))
      ${treeFilter}
      ${ratingFilter}
      ORDER BY rating DESC NULLS LAST, row_seq ASC
      LIMIT 100
    `;

    const resData = db.exec(sql);
    if (resData.length === 0) {
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

    const scored = resData[0].values.map((v) => {
      const code = String(v[0]);
      const user = String(v[1]);
      const md = String(v[2]);
      const ad = String(v[3]);
      const pd = String(v[4]);
      const start = String(v[5]);
      const end = String(v[6]);
      const duration = Number(v[7]);
      const inferred = v[8] ? String(v[8]) : '';
      const lived = v[9] ? String(v[9]) : '';
      const rating = v[10] !== null ? Number(v[10]) : null;

      const fullText = `${code} ${md} ${ad} ${pd} ${inferred} ${lived}`.toLowerCase();
      let matchScore = 0;
      queryTokens.forEach((t) => {
        if (fullText.includes(t)) matchScore += 1;
      });

      if (rating) matchScore += rating * 0.2;

      return {
        combination_code: code,
        username: user,
        md,
        ad,
        pd,
        start_time: start,
        end_time: end,
        duration_days: duration,
        inferred_narrative: inferred,
        lived_narrative: lived,
        rating,
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

// 9. Database Backup Export (.db binary download)
app.get('/api/bimtree/export/db', async (req: Request, res: Response) => {
  try {
    const db = await initServerDatabase();
    const data = db.export();
    res.setHeader('Content-Type', 'application/x-sqlite3');
    res.setHeader('Content-Disposition', 'attachment; filename="astrology_bimtree.db"');
    res.send(Buffer.from(data));
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
