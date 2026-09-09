import React, { useState, useEffect } from 'react';
import { Upload, Mic, MicOff, ShieldCheck, Sparkles, SlidersHorizontal, LayoutGrid, Terminal, Activity, Zap } from 'lucide-react';
import {
  ResourceMonitorState,
  getResourceMonitorState,
  subscribeResourceMonitor,
} from '../utils/resourceMonitor';

interface HeaderProps {
  activeTab: 'studio' | 'workbench' | 'config';
  onTabChange: (tab: 'studio' | 'workbench' | 'config') => void;
  onOpenPdfModal: () => void;
  onOpenAskMeModal: () => void;
  onToggleResourceMonitor: () => void;
  isResourceMonitorOpen: boolean;
  isListening: boolean;
  isIngestingPdf: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenPdfModal,
  onOpenAskMeModal,
  onToggleResourceMonitor,
  isResourceMonitorOpen,
  isListening,
  isIngestingPdf,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [monitorState, setMonitorState] = useState<ResourceMonitorState>(getResourceMonitorState());

  useEffect(() => {
    const unsub = subscribeResourceMonitor((state) => {
      setMonitorState(state);
    });
    return () => unsub();
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-amber-900/30 backdrop-blur-md px-4 lg:px-6 py-2.5 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Emblem & Application Title */}
        <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            {/* HDR-01: Seval Kodi Emblem SVG */}
            <div
              className="relative w-10 h-10 flex-shrink-0 cursor-pointer rounded-lg bg-gradient-to-br from-amber-500/20 via-red-950/40 to-slate-900 border border-amber-500/40 p-1 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:border-amber-400 transition-all"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              aria-label="Lord Muruga Seval Kodi Emblem"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <linearGradient id="flagCrimson" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#991b1b" />
                    <stop offset="70%" stopColor="#b91c1c" />
                    <stop offset="100%" stopColor="#7f1d1d" />
                  </linearGradient>
                </defs>

                {/* Vel / Spear Staff */}
                <line x1="28" y1="12" x2="28" y2="92" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
                {/* Spear Tip / Vel Leaf */}
                <path d="M 28 6 Q 24 16 28 20 Q 32 16 28 6 Z" fill="url(#goldGrad)" stroke="#fef08a" strokeWidth="1" />

                {/* Flying Banner Flag */}
                <path
                  d="M 28 20 C 50 16, 68 28, 88 22 C 78 38, 88 54, 86 60 C 65 52, 45 64, 28 58 Z"
                  fill="url(#flagCrimson)"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />

                {/* Golden Rooster Silhouette on Flag */}
                <g fill="url(#goldGrad)" transform="translate(42, 28) scale(0.38)">
                  {/* Rooster Body & Tail feathers */}
                  <path d="M 30 50 C 20 40 10 25 2 10 C 15 20 25 28 35 34 C 28 15 22 2 12 -8 C 26 5 36 18 42 30 C 50 15 54 -2 46 -15 C 60 5 62 20 60 32 C 68 28 76 22 84 14 C 80 26 72 36 62 42 C 72 46 82 52 88 62 C 78 62 68 58 58 56 C 54 68 44 76 30 76 C 18 76 22 62 30 50 Z" />
                  {/* Head & Comb */}
                  <circle cx="68" cy="18" r="10" />
                  <path d="M 66 8 Q 72 0 78 8 Q 84 2 84 10" stroke="#fef08a" strokeWidth="3" fill="none" />
                  <polygon points="76,18 88,22 76,26" fill="#fef08a" />
                </g>

                {/* Solar Radiance / Star Emblem */}
                <circle cx="80" cy="24" r="2.5" fill="#fef08a" />
                <path d="M 80 18 L 80 30 M 74 24 L 86 24" stroke="#fef08a" strokeWidth="1" strokeLinecap="round" />
              </svg>

              {/* Tooltip */}
              {showTooltip && (
                <div className="absolute left-0 top-12 w-64 p-2 bg-slate-900/95 border border-amber-500/50 rounded-md shadow-2xl text-xs text-amber-200 z-50 pointer-events-none backdrop-blur animate-in fade-in zoom-in-95 duration-150">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Lord Muruga Seval Kodi
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Celestial Awakening & Vigilance • Sacred BPHS Emblem
                  </div>
                </div>
              )}
            </div>

            {/* HDR-02: App Title & Subtitle */}
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent font-sans">
                Rooster Astro Analytical Tool
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="text-amber-500 font-medium">BPHS Engine</span>
                <span className="text-slate-600">•</span>
                <span className="inline-flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Local Privacy Protection
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="hidden sm:inline text-amber-300/80 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-800/40 text-[10px]">
                  Reg: 001ME
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Action Buttons Trigger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onToggleResourceMonitor}
              className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1 ${
                monitorState.trafficStatus === 'green'
                  ? 'bg-slate-900 text-emerald-300 border-emerald-700/50'
                  : monitorState.trafficStatus === 'yellow'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                  : 'bg-red-950 text-red-200 border-red-500 animate-pulse'
              }`}
              title="32B Resource Monitor"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenAskMeModal}
              className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all ${
                isListening
                  ? 'bg-red-500 text-white border-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.7)]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-amber-700/50'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onOpenPdfModal}
              className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: HDR-05 Main Navigation Bar */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner w-full md:w-auto justify-center">
          <button
            onClick={() => onTabChange('studio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'studio'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Studio View
          </button>
          <button
            onClick={() => onTabChange('workbench')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'workbench'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Workbench View
          </button>
          <button
            onClick={() => onTabChange('config')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'config'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-semibold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Configuration & Logs
          </button>
        </nav>

        {/* Right: 32B Monitor, HDR-03 PDF Ingest & HDR-04 Ask Me Voice Trigger */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* 32B Private LLM Resource & VRAM Monitor Trigger Pill */}
          <button
            type="button"
            onClick={onToggleResourceMonitor}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
              monitorState.trafficStatus === 'green'
                ? isResourceMonitorOpen
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-emerald-300 border-emerald-700/50'
                : monitorState.trafficStatus === 'yellow'
                ? isResourceMonitorOpen
                  ? 'bg-amber-950/90 text-amber-300 border-amber-500 ring-1 ring-amber-500/50 animate-pulse'
                  : 'bg-amber-950/70 hover:bg-amber-900/70 text-amber-300 border-amber-500/60'
                : isResourceMonitorOpen
                ? 'bg-red-950 text-red-200 border-red-500 ring-1 ring-red-500 animate-bounce'
                : 'bg-red-950/80 hover:bg-red-900 text-red-200 border-red-500/80 animate-pulse'
            }`}
            title="32B Model Resource Monitor (VRAM Footprint & keep_alive: 0 Memory Flush)"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                monitorState.trafficStatus === 'green'
                  ? 'bg-emerald-400'
                  : monitorState.trafficStatus === 'yellow'
                  ? 'bg-amber-400'
                  : 'bg-red-400'
              }`}
            />
            <span className="font-bold">
              {monitorState.trafficStatus === 'green'
                ? '32B Offloaded'
                : monitorState.trafficStatus === 'yellow'
                ? '32B Active'
                : '32B High Load'}
            </span>
            <span className="text-[10px] text-slate-400 border-l border-slate-700 pl-1">
              {monitorState.ramUtilizationPct}% RAM
            </span>
          </button>

          {/* HDR-03 PDF Ingest Trigger Button */}
          <button
            onClick={onOpenPdfModal}
            disabled={isIngestingPdf}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-b from-slate-900 to-slate-950 hover:from-slate-800 hover:to-slate-900 text-amber-200 border border-amber-600/40 hover:border-amber-500/70 text-xs font-medium flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
            title="Inspect or Ingest Tamil Jathagam Horoscope PDF"
          >
            {isIngestingPdf ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span className="font-mono text-[11px]">Parsing PDF...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Ingest PDF</span>
                <span className="text-[10px] text-amber-400/70 bg-amber-950/60 px-1 py-0.5 rounded border border-amber-800/40">
                  54p Loaded
                </span>
              </>
            )}
          </button>

          {/* HDR-04 Ask Me Voice Trigger */}
          <button
            onClick={onOpenAskMeModal}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md ${
              isListening
                ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.7)]'
                : 'bg-gradient-to-r from-red-950 via-red-900 to-amber-950 hover:from-red-900 hover:to-amber-900 text-amber-100 border border-red-700/60 hover:border-amber-500/60'
            }`}
            title="Deterministic Local STT & Ephemeris Engine (Page 6)"
          >
            {isListening ? (
              <>
                <MicOff className="w-3.5 h-3.5 animate-bounce text-white" />
                <span>Listening...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5 text-red-400" />
                <span>Ask Me</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
