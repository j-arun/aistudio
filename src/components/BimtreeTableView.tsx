import React, { useState, useEffect, useMemo } from 'react';
import {
  Database as DatabaseIcon,
  Search,
  Filter,
  Download,
  Upload,
  Sparkles,
  Calendar,
  Star,
  FileText,
  Clock,
  CheckCircle2,
  RefreshCw,
  Edit3,
  Layers,
  ChevronRight,
  Terminal,
  Save,
  X,
  Plus,
  ArrowUpDown,
  BookOpen,
  Info,
  Server,
} from 'lucide-react';
import { ApiGatewayModal } from './ApiGatewayModal';
import {
  BimtreeRow,
  TreeSummary,
  VIMSHOTTARI_LORDS,
  getTreeSummaries,
  queryBimtreePeriods,
  findPeriodByDate,
  updateInferredNarrative,
  updateLivedNarrative,
  updatePeriodRating,
  getNextTreeId,
  generateFull729Bimtree,
  insertBimtreeRows,
  generateInferredNarrativeForCombination,
  downloadSqliteDbFile,
  importSqliteDbFile,
  exportSqlScript,
  exportCsvScript,
  getSqliteDatabase,
} from '../utils/sqliteBimtreeEngine';
import { useHoroscope } from '../context/HoroscopeContext';

interface BimtreeTableViewProps {
  onClose?: () => void;
}

export const BimtreeTableView: React.FC<BimtreeTableViewProps> = ({ onClose }) => {
  const { horoscope } = useHoroscope();
  const nativeMetadata = horoscope?.metadata;
  const grahaCoordinates = horoscope?.grahas || [];

  // State
  const [trees, setTrees] = useState<TreeSummary[]>([]);
  const [activeTreeId, setActiveTreeId] = useState<number | null>(null);
  const [periods, setPeriods] = useState<BimtreeRow[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMd, setFilterMd] = useState<string>('');
  const [filterAd, setFilterAd] = useState<string>('');
  const [filterPd, setFilterPd] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'has_inferred' | 'has_lived' | 'unannotated' | 'rated'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [targetDateSearch, setTargetDateSearch] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  // Edit Modal / Drawer
  const [editingRow, setEditingRow] = useState<BimtreeRow | null>(null);
  const [editInferred, setEditInferred] = useState<string>('');
  const [editLived, setEditLived] = useState<string>('');
  const [editRating, setEditRating] = useState<number | null>(null);
  const [isGeneratingNarrative, setIsGeneratingNarrative] = useState<boolean>(false);

  // SQL Console Drawer
  const [isSqlConsoleOpen, setIsSqlConsoleOpen] = useState<boolean>(false);
  const [isApiGatewayOpen, setIsApiGatewayOpen] = useState<boolean>(false);
  const [sqlInput, setSqlInput] = useState<string>(
    'SELECT combination_code, md, ad, pd, start_time, end_time, rating FROM bimtree_dasha_periods WHERE md = "Jupiter" LIMIT 10;'
  );
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);

  // Load initial summaries
  useEffect(() => {
    loadTreesAndInit();
  }, []);

  const loadTreesAndInit = async () => {
    setLoading(true);
    try {
      const summaryList = await getTreeSummaries();
      setTrees(summaryList);

      if (summaryList.length > 0) {
        // Default to first tree if none selected
        setActiveTreeId((prev) => (prev && summaryList.some((t) => t.tree_id === prev) ? prev : summaryList[0].tree_id));
      } else {
        // If DB is empty, auto-generate initial 729-row tree for benchmark native
        await handleSyncCurrentChart();
      }
    } catch (err: any) {
      setStatusMessage(`Initialization Notice: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  // Reload rows when activeTreeId, filters, or page changes
  useEffect(() => {
    if (activeTreeId) {
      loadPeriods();
    }
  }, [activeTreeId, filterMd, filterAd, filterPd, filterStatus, minRating, searchQuery, currentPage]);

  const loadPeriods = async () => {
    if (!activeTreeId) return;
    setLoading(true);
    try {
      const { rows, totalCount: count } = await queryBimtreePeriods({
        treeId: activeTreeId,
        md: filterMd || undefined,
        ad: filterAd || undefined,
        pd: filterPd || undefined,
        search: searchQuery || undefined,
        filterStatus,
        minRating: minRating > 0 ? minRating : undefined,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      });

      setPeriods(rows);
      setTotalCount(count);
    } catch (err: any) {
      setStatusMessage(`Error loading periods: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCurrentChart = async () => {
    setLoading(true);
    setStatusMessage('Synthesizing 729-row BPHS Vimshottari Bimtree into SQLite...');
    try {
      const nextId = await getNextTreeId();
      const username = nativeMetadata?.regNo || 'Native_001ME';
      const birthDate = '1976-01-26';
      const startDasha = 'Saturn';
      const balance = 13.18;

      const rows = generateFull729Bimtree(username, nextId, birthDate, startDasha, balance);
      await insertBimtreeRows(rows);

      const summaries = await getTreeSummaries();
      setTrees(summaries);
      setActiveTreeId(nextId);
      setCurrentPage(1);
      setStatusMessage(`Successfully created Tree #${nextId} (${rows.length} sequential periods) in SQLite!`);
    } catch (err: any) {
      setStatusMessage(`Failed to generate Bimtree: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFindPeriodByDate = async () => {
    if (!activeTreeId || !targetDateSearch) return;
    setLoading(true);
    try {
      const found = await findPeriodByDate(activeTreeId, `${targetDateSearch} 12:00:00`);
      if (found) {
        setEditingRow(found);
        setEditInferred(found.inferred_narrative || '');
        setEditLived(found.lived_narrative || '');
        setEditRating(found.rating);
        setStatusMessage(`Located active period on ${targetDateSearch}: ${found.combination_code} (${found.md}-${found.ad}-${found.pd})`);
      } else {
        setStatusMessage(`No active period found within Tree #${activeTreeId} for date ${targetDateSearch}.`);
      }
    } catch (err: any) {
      setStatusMessage(`Lookup error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (row: BimtreeRow) => {
    setEditingRow(row);
    setEditInferred(row.inferred_narrative || '');
    setEditLived(row.lived_narrative || '');
    setEditRating(row.rating);
  };

  const handleSaveEdit = async () => {
    if (!editingRow) return;
    try {
      await updateInferredNarrative(editingRow.combination_code, editInferred, editRating);
      await updateLivedNarrative(editingRow.combination_code, editLived, editRating);

      // Also sync to server REST DB in background so external apps see the update immediately
      fetch(`/api/bimtree/periods/${editingRow.combination_code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inferred_narrative: editInferred,
          lived_narrative: editLived,
          rating: editRating,
        }),
      }).catch(() => {});

      setStatusMessage(`Saved narratives and rating for ${editingRow.combination_code} to SQLite & REST API.`);
      setEditingRow(null);

      // Refresh list & summaries
      await loadPeriods();
      const summaries = await getTreeSummaries();
      setTrees(summaries);
    } catch (err: any) {
      setStatusMessage(`Failed to save: ${err.message}`);
    }
  };

  const handleGenerateInferred = async () => {
    if (!editingRow) return;
    setIsGeneratingNarrative(true);
    try {
      const { narrative, rating } = await generateInferredNarrativeForCombination(
        editingRow,
        grahaCoordinates,
        nativeMetadata
      );
      setEditInferred(narrative);
      if (editRating === null) {
        setEditRating(rating);
      }
      setStatusMessage(`Astrological inferred synthesis generated for ${editingRow.combination_code}.`);
    } catch (err: any) {
      setStatusMessage(`Error generating narrative: ${err.message}`);
    } finally {
      setIsGeneratingNarrative(false);
    }
  };

  const handleRatingClick = async (combinationCode: string, rating: number) => {
    try {
      await updatePeriodRating(combinationCode, rating);
      setPeriods((prev) =>
        prev.map((r) => (r.combination_code === combinationCode ? { ...r, rating } : r))
      );
    } catch (err: any) {
      setStatusMessage(`Error updating rating: ${err.message}`);
    }
  };

  const handleDownloadDb = async () => {
    try {
      await downloadSqliteDbFile(`bimtree_database_tree_${activeTreeId || 'all'}.db`);
      setStatusMessage('SQLite .db file generated and downloaded successfully!');
    } catch (err: any) {
      setStatusMessage(`Download error: ${err.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setStatusMessage(`Importing SQLite database from ${file.name}...`);
    try {
      await importSqliteDbFile(file);
      const summaries = await getTreeSummaries();
      setTrees(summaries);
      if (summaries.length > 0) {
        setActiveTreeId(summaries[0].tree_id);
      }
      setStatusMessage(`Successfully restored SQLite database from ${file.name}!`);
    } catch (err: any) {
      setStatusMessage(`Import failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const csv = await exportCsvScript(activeTreeId || undefined);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bimtree_export_tree_${activeTreeId || 'all'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage('CSV export ready!');
    } catch (err: any) {
      setStatusMessage(`CSV export error: ${err.message}`);
    }
  };

  const handleExportSql = async () => {
    try {
      const sql = await exportSqlScript(activeTreeId || undefined);
      const blob = new Blob([sql], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bimtree_export_tree_${activeTreeId || 'all'}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage('SQL Dump exported successfully!');
    } catch (err: any) {
      setStatusMessage(`SQL export error: ${err.message}`);
    }
  };

  const handleExecuteSql = async () => {
    setSqlError(null);
    try {
      const db = await getSqliteDatabase();
      const res = db.exec(sqlInput);
      if (res.length > 0) {
        setSqlResult(res[0]);
      } else {
        setSqlResult(null);
        setStatusMessage('Query executed successfully. (0 rows returned / DDL executed)');
      }
    } catch (err: any) {
      setSqlError(err.message || String(err));
    }
  };

  const activeTreeSummary = useMemo(
    () => trees.find((t) => t.tree_id === activeTreeId),
    [trees, activeTreeId]
  );

  return (
    <div className="w-full max-w-[1780px] mx-auto px-3 sm:px-5 py-4 flex flex-col gap-4 font-mono text-xs">
      {/* Top Banner: SQLite Database Management & Master Actions */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border border-amber-500/50 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <DatabaseIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold text-amber-200 tracking-wide">
                Vimshottari Dasha SQLite Database Explorer
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 border border-amber-700 text-amber-300">
                Single-File Portable DB
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-800 text-emerald-300">
                Max 2000 Chars Narratives
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Query, annotate, and evaluate chronological periods (MD $\rightarrow$ AD $\rightarrow$ PD) with Inferred Astrological Deductions and Lived Reality.
            </p>
          </div>
        </div>

        {/* Action Buttons: Export DB, Upload DB, SQL Terminal, Add Tree */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadDb}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            title="Download the actual .db SQLite file (open in DBeaver or SQLite Studio)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .db File</span>
          </button>

          <label className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Restore .db</span>
            <input type="file" accept=".db,.sqlite,.sqlite3" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportSql}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1 cursor-pointer"
          >
            <span>SQL Dump</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSqlConsoleOpen(!isSqlConsoleOpen)}
            className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-1 cursor-pointer ${
              isSqlConsoleOpen ? 'bg-amber-500 text-slate-950 font-bold border-amber-400' : 'bg-slate-900 text-amber-300 border-amber-600/40 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SQL Console</span>
          </button>

          <button
            type="button"
            onClick={() => setIsApiGatewayOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 flex items-center gap-1.5 cursor-pointer shadow transition-colors"
            title="REST API over port 3000 & RAG Gateway for all external apps"
          >
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>REST API & RAG Gateway</span>
          </button>

          <button
            type="button"
            onClick={handleSyncCurrentChart}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            title="Calculate and insert 729 periods for current active chart"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ New 729 Tree</span>
          </button>
        </div>
      </div>

      {/* Notification status bar */}
      {statusMessage && (
        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-200 flex items-center justify-between gap-2 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-200 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Raw SQL Terminal Console (Collapsible) */}
      {isSqlConsoleOpen && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 flex flex-col gap-2.5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-amber-400" />
              Direct SQLite Query Console
            </span>
            <span className="text-[10px] text-slate-400">
              Read & Write directly onto in-memory SQLite table
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <textarea
              value={sqlInput}
              onChange={(e) => setSqlInput(e.target.value)}
              rows={3}
              className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-amber-200 font-mono text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
              placeholder="SELECT * FROM bimtree_dasha_periods..."
            />
            <button
              type="button"
              onClick={handleExecuteSql}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg self-end sm:self-auto cursor-pointer"
            >
              Run Query
            </button>
          </div>

          {sqlError && (
            <div className="p-2 rounded bg-red-950/60 border border-red-800 text-red-300 text-xs">
              Error: {sqlError}
            </div>
          )}

          {sqlResult && (
            <div className="overflow-x-auto max-h-60 border border-slate-800 rounded-lg bg-slate-900/90 scrollbar-thin">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-950 text-amber-300 uppercase sticky top-0 border-b border-slate-800">
                  <tr>
                    {sqlResult.columns.map((col, idx) => (
                      <th key={idx} className="p-2 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {sqlResult.values.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 whitespace-nowrap">
                          {cell === null ? <span className="text-slate-500">NULL</span> : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Control Strip: Active Tree Selector + Stats + Jump to Date */}
      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Select Tree:</span>
            <select
              value={activeTreeId || ''}
              onChange={(e) => {
                setActiveTreeId(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 border border-amber-600/40 text-amber-200 font-bold focus:outline-none cursor-pointer"
            >
              {trees.map((t) => (
                <option key={t.tree_id} value={t.tree_id}>
                  Tree #{t.tree_id} • {t.username} ({t.total_periods} rows)
                </option>
              ))}
            </select>
          </div>

          {activeTreeSummary && (
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                Periods: <strong className="text-amber-300">{activeTreeSummary.total_periods}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                Inferred: <strong className="text-indigo-300">{activeTreeSummary.inferred_count}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                Lived: <strong className="text-emerald-300">{activeTreeSummary.lived_count}</strong>
              </span>
              {activeTreeSummary.avg_rating && (
                <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  Avg: {activeTreeSummary.avg_rating} / 5
                </span>
              )}
            </div>
          )}
        </div>

        {/* Date Jump tool */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] hidden sm:inline">Active on Date:</span>
          <input
            type="date"
            value={targetDateSearch}
            onChange={(e) => setTargetDateSearch(e.target.value)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-amber-200 text-xs focus:outline-none"
          />
          <button
            type="button"
            onClick={handleFindPeriodByDate}
            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer flex items-center gap-1"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Find Period</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search code, text, lord..."
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Planetary Lord Selectors */}
          <select
            value={filterMd}
            onChange={(e) => {
              setFilterMd(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="">All MD</option>
            {VIMSHOTTARI_LORDS.map((l) => (
              <option key={l.name} value={l.name}>
                MD: {l.name} ({l.tamil})
              </option>
            ))}
          </select>

          <select
            value={filterAd}
            onChange={(e) => {
              setFilterAd(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="">All AD</option>
            {VIMSHOTTARI_LORDS.map((l) => (
              <option key={l.name} value={l.name}>
                AD: {l.name}
              </option>
            ))}
          </select>

          <select
            value={filterPd}
            onChange={(e) => {
              setFilterPd(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="">All PD</option>
            {VIMSHOTTARI_LORDS.map((l) => (
              <option key={l.name} value={l.name}>
                PD: {l.name}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e: any) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="all">Status: All Rows</option>
            <option value="has_inferred">Has Inferred Narrative</option>
            <option value="has_lived">Has Lived Events</option>
            <option value="rated">Has 1-5 Rating</option>
            <option value="unannotated">Unannotated</option>
          </select>

          {/* Rating filter */}
          <select
            value={minRating}
            onChange={(e) => {
              setMinRating(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 text-xs focus:outline-none cursor-pointer"
          >
            <option value="0">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Only)</option>
            <option value="4">⭐⭐⭐⭐ (4+ Stars)</option>
            <option value="3">⭐⭐⭐ (3+ Stars)</option>
            <option value="2">⭐⭐ (2+ Stars)</option>
            <option value="1">⭐ (1+ Stars)</option>
          </select>
        </div>

        {/* Total matches count */}
        <div className="text-slate-400 text-xs font-mono">
          Showing {periods.length} of {totalCount} matching combinations
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto max-h-[620px] scrollbar-thin scrollbar-thumb-amber-700/40">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gradient-to-r from-slate-900 to-amber-950/40 text-amber-200 uppercase tracking-wider sticky top-0 z-10 border-b border-amber-900/40 shadow-sm">
              <tr>
                <th className="p-3 w-28 font-semibold">Code / Seq</th>
                <th className="p-3 w-48 font-semibold">MD $\rightarrow$ AD $\rightarrow$ PD</th>
                <th className="p-3 w-56 font-semibold">Chronological Window</th>
                <th className="p-3 w-28 font-semibold">Rating</th>
                <th className="p-3 min-w-[280px] font-semibold">Inferred Narrative (Astro)</th>
                <th className="p-3 min-w-[260px] font-semibold">Lived Narrative (Reality)</th>
                <th className="p-3 w-20 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-400 mb-2" />
                    Loading Bimtree table from SQLite...
                  </td>
                </tr>
              ) : periods.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No periods matching your filter criteria. Try resetting filters or clicking "+ New 729 Tree".
                  </td>
                </tr>
              ) : (
                periods.map((row) => (
                  <tr
                    key={row.combination_code}
                    className="hover:bg-slate-900/70 transition-colors group cursor-pointer"
                    onClick={() => handleOpenEdit(row)}
                  >
                    {/* Combination Code & Sequence */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-bold text-amber-300">{row.combination_code}</div>
                      <span className="text-[10px] text-slate-500 font-mono">Seq #{row.row_seq}</span>
                    </td>

                    {/* MD -> AD -> PD */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 text-[11px]">
                          {row.md}
                        </span>
                        <span className="text-slate-500">→</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-[11px]">
                          {row.ad}
                        </span>
                        <span className="text-slate-500">→</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px]">
                          {row.pd}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        User: {row.username}
                      </span>
                    </td>

                    {/* Window & Duration */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="text-slate-200 font-mono text-[11px]">
                        {row.start_time.slice(0, 10)}
                      </div>
                      <div className="text-slate-400 font-mono text-[10px]">
                        to {row.end_time.slice(0, 10)}
                      </div>
                      <span className="text-[10px] text-amber-400/80 font-mono">
                        {row.duration_days} days
                      </span>
                    </td>

                    {/* Rating Stars (Interactive) */}
                    <td
                      className="p-3 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              handleRatingClick(
                                row.combination_code,
                                row.rating === star ? 0 : star
                              )
                            }
                            className="text-slate-600 hover:text-amber-400 transition-colors cursor-pointer"
                            title={`Set rating: ${star} / 5`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                row.rating && row.rating >= star
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      {row.rating ? (
                        <span className="text-[10px] text-amber-300 font-bold block mt-1">
                          Score: {row.rating}/5
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-600 block mt-1">Unrated</span>
                      )}
                    </td>

                    {/* Inferred Astrological Narrative Preview */}
                    <td className="p-3">
                      {row.inferred_narrative ? (
                        <div className="space-y-1">
                          <p className="text-slate-300 line-clamp-2 text-[11px] leading-relaxed">
                            {row.inferred_narrative}
                          </p>
                          <span className="text-[9px] text-indigo-400 bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-800">
                            {row.inferred_narrative.length}/2000 chars
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic text-[11px]">
                          Pending synthesis (Click edit to generate)
                        </span>
                      )}
                    </td>

                    {/* Lived Reality Narrative Preview */}
                    <td className="p-3">
                      {row.lived_narrative ? (
                        <div className="space-y-1">
                          <p className="text-emerald-300/90 line-clamp-2 text-[11px] leading-relaxed">
                            {row.lived_narrative}
                          </p>
                          <span className="text-[9px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                            {row.lived_narrative.length}/2000 chars
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic text-[11px]">
                          No events logged
                        </span>
                      )}
                    </td>

                    {/* Action button */}
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(row)}
                        className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                        title="Edit Narratives & Rating"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-slate-400 text-xs">
            Page {currentPage} of {Math.max(1, Math.ceil(totalCount / pageSize))} ({totalCount} total periods)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-700 cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 text-amber-300 font-bold">{currentPage}</span>
            <button
              type="button"
              disabled={currentPage >= Math.ceil(totalCount / pageSize)}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-700 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit Drawer / Modal for Combination */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-950 border-b border-amber-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-200">
                    Period Editor: {editingRow.combination_code}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingRow.md} MD $\rightarrow$ {editingRow.ad} AD $\rightarrow$ {editingRow.pd} PD ({editingRow.start_time.slice(0, 10)} to {editingRow.end_time.slice(0, 10)})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Rating Selector */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-300 block text-xs">Auspiciousness & Opportunity Rating:</span>
                  <span className="text-[10px] text-slate-500">1 (Severe Friction) to 5 (Peak Dhana / Raja Yoga)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(editRating === star ? null : star)}
                      className="p-1 rounded hover:bg-slate-800 cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          editRating && editRating >= star
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-amber-300 text-xs ml-2">
                    {editRating ? `${editRating}/5` : 'None'}
                  </span>
                </div>
              </div>

              {/* Inferred Narrative Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-indigo-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      Inferred Astrological Narrative (Column 1)
                    </span>
                    <span className="text-[10px] text-indigo-400 bg-indigo-950 px-1.5 py-0.2 rounded border border-indigo-800">
                      {editInferred.length} / 2000 chars
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateInferred}
                    disabled={isGeneratingNarrative}
                    className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isGeneratingNarrative ? 'Synthesizing...' : 'Synthesize Inferred Narrative'}</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-400">
                  Pure astrological deductions based on 2nd, 5th, 7th, 9th, 10th, 11th houses, Raja/Dhana yogas, and planetary alignments.
                </p>

                <textarea
                  value={editInferred}
                  maxLength={2000}
                  onChange={(e) => setEditInferred(e.target.value)}
                  rows={6}
                  placeholder="Enter or synthesize astrological inference for this period (max 2000 characters)..."
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Lived Narrative Card */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Lived Reality Narrative (Column 2)
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">
                      {editLived.length} / 2000 chars
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400">
                  Record actual ground-truth events, career promotions, relocations, purchases, or personal outcomes experienced during this period.
                </p>

                <textarea
                  value={editLived}
                  maxLength={2000}
                  onChange={(e) => setEditLived(e.target.value)}
                  rows={5}
                  placeholder="Log empirical events that actually took place during this window (max 2000 characters)..."
                  className="w-full p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setEditingRow(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save to SQLite Table</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REST API & RAG Gateway Modal */}
      <ApiGatewayModal
        isOpen={isApiGatewayOpen}
        onClose={() => setIsApiGatewayOpen(false)}
        activeTreeId={activeTreeId}
        periods={periods}
      />
    </div>
  );
};
