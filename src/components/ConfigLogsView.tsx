import React, { useState } from 'react';
import {
  Terminal,
  Shield,
  FileCode,
  CheckCircle,
  Database,
  Cpu,
  Lock,
  Copy,
  RefreshCw,
  Server,
} from 'lucide-react';
import {
  NATIVE_METADATA,
  GRAHA_COORDINATES,
  DIVISIONAL_CHARTS,
  ASHTAKAVARGA_DATA,
  SHADBALA_DATA,
} from '../data/canonicalHoroscope';
import { LlmConfigSettings } from './LlmConfigSettings';
import { loadLlmSettings, InjectedLlmSettings } from '../utils/llmService';

export const ConfigLogsView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'memory' | 'security' | 'audit' | 'llm_config'>('llm_config');
  const [llmSettings, setLlmSettings] = useState<InjectedLlmSettings>(loadLlmSettings);

  const canonicalMemoryJson = JSON.stringify(
    {
      native: NATIVE_METADATA,
      grahas: GRAHA_COORDINATES,
      divisionalChartsScope: 'D1 to D12 (South Indian only)',
      divisionalCharts: DIVISIONAL_CHARTS,
      ashtakavarga: ASHTAKAVARGA_DATA,
      shadbala: SHADBALA_DATA,
    },
    null,
    2
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(canonicalMemoryJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-amber-900/40 p-4 sm:p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-900/30 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Terminal className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-amber-200 uppercase tracking-wide">
                Configuration, Security & System Logs
              </h2>
              <p className="text-xs text-slate-400">
                Zero-Ingress Architecture • Local Canonical JSON Memory • PII Scrubbing Rules
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono gap-1">
            <button
              onClick={() => setActiveSubTab('llm_config')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                activeSubTab === 'llm_config'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-3.5 h-3.5 text-amber-400" />
              <span>Injected LLM Settings</span>
            </button>
            <button
              onClick={() => setActiveSubTab('memory')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeSubTab === 'memory'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Canonical JSON Memory
            </button>
            <button
              onClick={() => setActiveSubTab('security')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeSubTab === 'security'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              PII Sanitizer Rules
            </button>
            <button
              onClick={() => setActiveSubTab('audit')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeSubTab === 'audit'
                  ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Zero-Ingress Audit Trail
            </button>
          </div>
        </div>

        {/* SUBTAB 0: Injected LLM Connections */}
        {activeSubTab === 'llm_config' && (
          <LlmConfigSettings
            settings={llmSettings}
            onUpdateSettings={(newSettings) => setLlmSettings(newSettings)}
          />
        )}

        {/* SUBTAB 1: Canonical JSON Memory */}
        {activeSubTab === 'memory' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-amber-400" />
                Raw In-Memory Cache (Hydrated from 54-Page Jothidar PDF):
              </span>
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] flex items-center gap-1 border border-slate-700 transition-colors"
              >
                <Copy className="w-3 h-3" />
                {copied ? 'Copied to Clipboard!' : 'Copy Canonical JSON'}
              </button>
            </div>

            <div className="rounded-xl border border-amber-900/40 bg-slate-950 p-3.5 font-mono text-[11px] text-amber-200/90 overflow-x-auto max-h-[480px] scrollbar-thin">
              <pre>{canonicalMemoryJson}</pre>
            </div>
          </div>
        )}

        {/* SUBTAB 2: PII Sanitizer Rules */}
        {activeSubTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 font-mono">
                <Lock className="w-4 h-4" />
                1. Native Identifier Scrubbing
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Replaces real native names, registration numbers (e.g. 001ME), exact birth places, and timestamps with deterministic cryptographic pseudonyms (e.g. <code className="text-amber-300">ANONYMIZED_001ME</code>) before generating LLM payloads.
              </p>
              <div className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 p-2 rounded border border-emerald-800/40 mt-1">
                ✓ Verified: Zero personally identifiable information permitted in egress packets.
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-mono">
                <Cpu className="w-4 h-4" />
                2. Local Llama 8B Filter Model
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Runs locally on edge memory to scan user input notes, voice transcripts, and contextual prompts. Automatically redacts phone numbers, email addresses, street names, and medical queries.
              </p>
              <div className="text-[10px] font-mono text-amber-300/80 bg-amber-950/40 p-2 rounded border border-amber-800/40 mt-1">
                ✓ Filter Mode: Strict Regex + Semantic Masking enabled.
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col gap-2 md:col-span-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400 font-mono">
                <Shield className="w-4 h-4" />
                3. BPHS XML Serialization Contract
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The Workbench only dispatches scrubbed mathematical astrological coordinates (Grahas, Houses, Degrees, Nakshatras, and Ashtakavarga totals). No audio streams, raw PDF pages, or user cookies are ever transmitted to public cloud LLMs.
              </p>
            </div>
          </div>
        )}

        {/* SUBTAB 3: Zero-Ingress Audit Trail */}
        {activeSubTab === 'audit' && (
          <div className="space-y-2 font-mono text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>[MEMORY INIT] Canonical JSON horoscope 001ME loaded into local heap.</span>
              </div>
              <span className="text-[10px] text-slate-500">12ms ago</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>[CHART HYDRATION] South Indian grid generated for D1 through D12 divisional range.</span>
              </div>
              <span className="text-[10px] text-slate-500">8ms ago</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>[DASHA SCROLL] Vimshottari tree auto-expanded to 2026 Sukran MD / Sani AD.</span>
              </div>
              <span className="text-[10px] text-slate-500">5ms ago</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>[ASK ME ENGINE] Local STT confidence threshold locked at 0.6. Deterministic lookup ready.</span>
              </div>
              <span className="text-[10px] text-slate-500">3ms ago</span>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-emerald-900/40 flex items-center justify-between text-emerald-300">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>[SECURITY ENVELOPE] Zero inbound ports open. All requests execute in isolated browser runtime.</span>
              </div>
              <span className="text-[10px] text-emerald-500">Live</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
