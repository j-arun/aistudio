import React, { useState } from 'react';
import {
  X,
  Terminal,
  Globe,
  Database,
  Sparkles,
  Copy,
  Check,
  Code2,
  Cpu,
  ArrowRight,
  Server,
  Layers,
  Send,
} from 'lucide-react';
import { BimtreeRow } from '../utils/sqliteBimtreeEngine';

interface ApiGatewayModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTreeId: number | null;
  periods: BimtreeRow[];
  onSyncToServer?: () => Promise<void>;
}

export const ApiGatewayModal: React.FC<ApiGatewayModalProps> = ({
  isOpen,
  onClose,
  activeTreeId,
  periods,
  onSyncToServer,
}) => {
  const [activeTab, setActiveTab] = useState<'rest' | 'python' | 'rag' | 'postgres'>('rest');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // RAG tester state
  const [ragQuery, setRagQuery] = useState('financial increase and career promotion');
  const [ragLoading, setRagLoading] = useState(false);
  const [ragResult, setRagResult] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestRag = async () => {
    setRagLoading(true);
    setRagResult(null);
    try {
      const res = await fetch('/api/bimtree/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: ragQuery,
          tree_id: activeTreeId || undefined,
          top_k: 3,
        }),
      });
      const data = await res.json();
      setRagResult(data);
    } catch (err: any) {
      setRagResult({ error: err.message || 'Failed to connect to /api/bimtree/rag/query' });
    } finally {
      setRagLoading(false);
    }
  };

  const handlePushSync = async () => {
    if (periods.length === 0) {
      setSyncStatus('No periods to sync. Please calculate or load a 729 tree first.');
      return;
    }
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/bimtree/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: periods }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncStatus(`Successfully synced ${data.count} periods to the server REST database!`);
      } else {
        setSyncStatus(`Sync failed: ${data.error}`);
      }
    } catch (err: any) {
      setSyncStatus(`Server connection error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const pythonCode = `import requests

# 1. Base URL (Running on Port 3000)
BASE_URL = "http://localhost:3000/api/bimtree"

# 2. Query periods for a specific date (Find Active Period)
def get_active_period(date_str="2026-09-18", tree_id=1001):
    response = requests.get(f"{BASE_URL}/periods", params={
        "tree_id": tree_id,
        "date": date_str
    })
    return response.json()

# 3. Query all high-rated periods (Rating >= 4) with Jupiter MD
def get_promising_periods(md="Jupiter", min_rating=4):
    response = requests.get(f"{BASE_URL}/periods", params={
        "md": md,
        "min_rating": min_rating
    })
    return response.json()

# 4. Update Inferred Narrative, Lived Reality, and Rating from any app
def update_period_notes(combination_code, inferred_text, lived_text, rating):
    response = requests.patch(
        f"{BASE_URL}/periods/{combination_code}",
        json={
            "inferred_narrative": inferred_text,
            "lived_narrative": lived_text,
            "rating": rating
        }
    )
    return response.json()

# 5. RAG Semantic Retrieval for LLM Context Prompt
def rag_search(prompt_question, top_k=5):
    response = requests.post(
        f"{BASE_URL}/rag/query",
        json={"query": prompt_question, "top_k": top_k}
    )
    data = response.json()
    # Feed this directly into your LLM prompt!
    return data.get("rag_context_text")

# Example Usage:
if __name__ == "__main__":
    context = rag_search("When will significant financial expansion happen?")
    print("Retrieved RAG Context for LLM:")
    print(context)
`;

  const curlCode = `# 1. Check Server Health
curl -X GET "http://localhost:3000/api/health"

# 2. Query Active Period on 2026-09-18
curl -X GET "http://localhost:3000/api/bimtree/periods?tree_id=1001&date=2026-09-18"

# 3. Filter by Mahadasha & High Rating
curl -X GET "http://localhost:3000/api/bimtree/periods?tree_id=1001&md=Jupiter&min_rating=4"

# 4. Update Inferred & Lived Narrative for Combination T1001_R0042
curl -X PATCH "http://localhost:3000/api/bimtree/periods/T1001_R0042" \\
  -H "Content-Type: application/json" \\
  -d '{
    "inferred_narrative": "Guru-Sukra period: Strong Dhanakaraka activation in 2nd and 11th houses.",
    "lived_narrative": "Promoted to Senior Architect and received bonus.",
    "rating": 5
  }'

# 5. RAG Retrieval for LLM Prompts
curl -X POST "http://localhost:3000/api/bimtree/rag/query" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "career elevation 2026 10th house", "top_k": 3}'
`;

  const postgresSql = `-- 1. Enable pgvector extension for RAG vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. PostgreSQL Schema for Bimtree
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
  embedding vector(768), -- Vector embeddings for RAG
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tree_id, row_seq)
);

-- 3. High-Performance Indexing
CREATE INDEX IF NOT EXISTS idx_bimtree_timeline ON bimtree_dasha_periods(tree_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bimtree_planets ON bimtree_dasha_periods(md, ad, pd);
CREATE INDEX IF NOT EXISTS idx_bimtree_rating ON bimtree_dasha_periods(rating);

-- 4. Fast Vector Cosine Index for RAG queries
CREATE INDEX IF NOT EXISTS idx_bimtree_rag_vector 
  ON bimtree_dasha_periods 
  USING ivfflat (embedding vector_cosine_ops) 
  WITH (lists = 100);

-- 5. RAG Cosine Distance Query Example:
-- Find top 5 periods matching query vector:
-- SELECT combination_code, md, ad, pd, inferred_narrative, lived_narrative
-- FROM bimtree_dasha_periods
-- ORDER BY embedding <=> '[0.012, -0.045, ...]'::vector
-- LIMIT 5;
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="bg-slate-950 border border-amber-500/50 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 border-b border-amber-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-amber-200">
                  Universal REST API & RAG Gateway (Port 3000)
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700">
                  Online • Port 3000
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                  CORS Enabled
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Accessible across all your apps (Python, CLI, other Web frontends) to read, write, and analyze periods.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Action Banner */}
        <div className="px-4 py-2.5 bg-amber-950/20 border-b border-amber-900/20 flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300">
              Active Browser Tree:{' '}
              <strong className="text-amber-300">#{activeTreeId || '1001'}</strong> ({periods.length} periods in memory)
            </span>
            {syncStatus && <span className="text-emerald-400 font-bold ml-2">✓ {syncStatus}</span>}
          </div>

          <button
            type="button"
            onClick={handlePushSync}
            disabled={isSyncing}
            className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
            title="Push memory periods to server's persistent disk database"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isSyncing ? 'Syncing...' : 'Sync All Periods to Server REST DB'}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-800 bg-slate-900/60">
          <button
            onClick={() => setActiveTab('rest')}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'rest'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>REST Endpoints (cURL)</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'python'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python SDK Client</span>
          </button>

          <button
            onClick={() => setActiveTab('rag')}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'rag'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive RAG Tester</span>
          </button>

          <button
            onClick={() => setActiveTab('postgres')}
            className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'postgres'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>PostgreSQL 5432 & pgvector</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {activeTab === 'rest' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-300 font-bold">
                  Standard HTTP Endpoints on Port 3000
                </div>
                <button
                  onClick={() => copyToClipboard(curlCode, 'curl')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedKey === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'curl' ? 'Copied!' : 'Copy cURL Snippets'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-emerald-400 font-bold">GET</span>{' '}
                  <code className="text-slate-200">/api/bimtree/periods</code>
                  <p className="text-slate-400 text-[10px] mt-1">
                    Filters: <code>?tree_id=1001&md=Venus&date=2026-09-18&min_rating=4</code>
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-amber-400 font-bold">PATCH</span>{' '}
                  <code className="text-slate-200">/api/bimtree/periods/:code</code>
                  <p className="text-slate-400 text-[10px] mt-1">
                    Updates <code>inferred_narrative</code>, <code>lived_narrative</code>, <code>rating</code>.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-cyan-400 font-bold">POST</span>{' '}
                  <code className="text-slate-200">/api/bimtree/rag/query</code>
                  <p className="text-slate-400 text-[10px] mt-1">
                    Contextual RAG retrieval: takes a question and returns formatted context for LLMs.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="text-emerald-400 font-bold">GET</span>{' '}
                  <code className="text-slate-200">/api/bimtree/export/db</code>
                  <p className="text-slate-400 text-[10px] mt-1">
                    Streams direct binary <code>.db</code> SQLite file download.
                  </p>
                </div>
              </div>

              <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-300 text-[11px] overflow-x-auto">
                {curlCode}
              </pre>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-300 font-bold">
                  Python Integration (Jupyter, Pandas, Microservices)
                </div>
                <button
                  onClick={() => copyToClipboard(pythonCode, 'python')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedKey === 'python' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'python' ? 'Copied!' : 'Copy Python Code'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-emerald-300 text-[11px] overflow-x-auto">
                {pythonCode}
              </pre>
            </div>
          )}

          {activeTab === 'rag' && (
            <div className="space-y-3">
              <div className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Test RAG Context Retrieval Live</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Type an inquiry (e.g. &quot;wealth 2nd house&quot;, &quot;career elevation 2026&quot;, or &quot;Saturn Ketu challenges&quot;) to query the database and generate a prompt-ready context block.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={ragQuery}
                  onChange={(e) => setRagQuery(e.target.value)}
                  placeholder="Enter RAG search query..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleTestRag}
                  disabled={ragLoading}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{ragLoading ? 'Searching...' : 'Run RAG Query'}</span>
                </button>
              </div>

              {ragResult && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Retrieved {ragResult.top_k || 0} matched periods for query: &quot;{ragResult.query}&quot;
                    </span>
                    {ragResult.rag_context_text && (
                      <button
                        onClick={() => copyToClipboard(ragResult.rag_context_text, 'rag_context')}
                        className="text-amber-400 hover:underline flex items-center gap-1"
                      >
                        {copiedKey === 'rag_context' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>Copy Formatted Context</span>
                      </button>
                    )}
                  </div>

                  <pre className="p-3 bg-slate-900 rounded-xl border border-amber-900/30 text-amber-200 text-[11px] overflow-x-auto whitespace-pre-wrap max-h-64">
                    {ragResult.rag_context_text || JSON.stringify(ragResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {activeTab === 'postgres' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-300 font-bold">
                    PostgreSQL 5432 & pgvector Schema Specification
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Run this DDL inside your standalone PostgreSQL instance (port 5432) to support embeddings and RAG.
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(postgresSql, 'postgres')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedKey === 'postgres' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'postgres' ? 'Copied!' : 'Copy SQL DDL'}</span>
                </button>
              </div>

              <pre className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-amber-300 text-[11px] overflow-x-auto">
                {postgresSql}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Port 3000 Ready for External Application Requests</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
