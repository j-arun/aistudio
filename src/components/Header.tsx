import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutGrid,
  Sparkles,
  Terminal,
  Activity,
  ChevronDown,
  FileText,
  HelpCircle,
  Cpu,
  ShieldCheck,
} from 'lucide-react';
import {
  ResourceMonitorState,
  getResourceMonitorState,
  subscribeResourceMonitor,
} from '../utils/resourceMonitor';

interface HeaderProps {
  activeTab: 'studio' | 'workbench' | 'config';
  onTabChange: (tab: 'studio' | 'workbench' | 'config') => void;
  onOpenResourceMonitor: () => void;
  isResourceMonitorOpen: boolean;
  onOpenHelpDocs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenResourceMonitor,
  isResourceMonitorOpen,
  onOpenHelpDocs,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isSystemDropdownOpen, setIsSystemDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Subscribe to live hardware resource monitor state
  const [monitorState, setMonitorState] = useState<ResourceMonitorState>(
    getResourceMonitorState()
  );

  useEffect(() => {
    const unsubscribe = subscribeResourceMonitor((newState) => {
      setMonitorState(newState);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSystemDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 border-b border-amber-900/40 backdrop-blur-md transition-all shadow-md">
      <div className="max-w-[1780px] mx-auto px-3 sm:px-5 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Left Hand Side: Official Rooster Emblem Flag (Seval Kodi) & Product Brand */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            {/* Sacred Rooster Banner (Seval Kodi) Emblem */}
            <div
              className="relative cursor-pointer group flex-shrink-0"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onClick={() => setShowTooltip(!showTooltip)}
              title="Rooster Flag (Lord Muruga Seval Kodi) — Sacred Emblem of Astrological Awakening"
            >
              <svg
                viewBox="0 0 100 100"
                className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-[0_0_12px_rgba(245,158,11,0.55)] transition-transform duration-300 group-hover:scale-105"
              >
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef08a" />
                    <stop offset="50%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                  <linearGradient id="flagBg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#991b1b" />
                    <stop offset="60%" stopColor="#7f1d1d" />
                    <stop offset="100%" stopColor="#450a0a" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Flagpole & Finial Speartip (Vel) */}
                <line x1="22" y1="8" x2="22" y2="94" stroke="#d97706" strokeWidth="4" strokeLinecap="round" />
                <path d="M 22 4 L 18 12 L 26 12 Z" fill="#fef08a" />

                {/* Flowing Sacred Crimson Flag */}
                <path
                  d="M 24 12 Q 55 18 88 12 C 82 32 86 44 88 56 Q 55 50 24 56 Z"
                  fill="url(#flagBg)"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                />

                {/* Golden Rooster Silhouette on Flag */}
                <g fill="url(#goldGrad)" transform="translate(42, 28) scale(0.38)">
                  <path d="M 30 50 C 20 40 10 25 2 10 C 15 20 25 28 35 34 C 28 15 22 2 12 -8 C 26 5 36 18 42 30 C 50 15 54 -2 46 -15 C 60 5 62 20 60 32 C 68 28 76 22 84 14 C 80 26 72 36 62 42 C 72 46 82 52 88 62 C 78 62 68 58 58 56 C 54 68 44 76 30 76 C 18 76 22 62 30 50 Z" />
                  <circle cx="68" cy="18" r="10" />
                  <path d="M 66 8 Q 72 0 78 8 Q 84 2 84 10" stroke="#fef08a" strokeWidth="3" fill="none" />
                  <polygon points="76,18 88,22 76,26" fill="#fef08a" />
                </g>

                {/* Solar Radiance Emblem */}
                <circle cx="80" cy="24" r="2.5" fill="#fef08a" />
                <path d="M 80 18 L 80 30 M 74 24 L 86 24" stroke="#fef08a" strokeWidth="1" strokeLinecap="round" />
              </svg>

              {/* Tooltip */}
              {showTooltip && (
                <div className="absolute left-0 top-12 w-64 p-2.5 bg-slate-900/95 border border-amber-500/50 rounded-lg shadow-2xl text-xs text-amber-200 z-50 pointer-events-none backdrop-blur animate-in fade-in zoom-in-95 duration-150">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5 mb-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Lord Muruga Seval Kodi
                  </div>
                  <div className="text-[11px] text-slate-300 leading-snug">
                    Celestial Awakening & Vigilance • Sacred BPHS Emblem
                  </div>
                </div>
              )}
            </div>

            {/* App Title & Clean Subtitle (Removed local rig and 001ME) */}
            <div>
              <h1 className="text-base sm:text-lg md:text-xl font-bold tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent font-sans">
                Rooster Astro Analytical Tool
              </h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                <span className="text-amber-400 font-medium">BPHS Computational Engine</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Zero-Ingress Architecture
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Quick Action for System Dropdown */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={onOpenResourceMonitor}
              className={`p-2 rounded-lg border text-xs font-mono flex items-center gap-1 ${
                monitorState.trafficStatus === 'green'
                  ? 'bg-slate-900 text-emerald-300 border-emerald-700/50'
                  : monitorState.trafficStatus === 'yellow'
                  ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                  : 'bg-red-950 text-red-200 border-red-500 animate-pulse'
              }`}
              title="Monitoring / Optimal Headroom"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center & Right Navigation Bar: 3 Main Menus + 4th System Menu with Dropdown */}
        <nav className="flex items-center bg-slate-900/95 p-1 rounded-xl border border-slate-800 shadow-inner w-full md:w-auto justify-center gap-1">
          
          {/* Menu Item 1: Studio View */}
          <button
            onClick={() => onTabChange('studio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'studio'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Studio View</span>
          </button>

          {/* Menu Item 2: Workbench View */}
          <button
            onClick={() => onTabChange('workbench')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'workbench'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workbench View</span>
          </button>

          {/* Menu Item 3: Configuration (Replaces Configuration & Logs) */}
          <button
            onClick={() => onTabChange('config')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'config'
                ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-bold shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Configuration</span>
          </button>

          {/* Menu Item 4: System (Dropdown with Monitoring & Help) */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsSystemDropdownOpen((prev) => !prev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                isSystemDropdownOpen || isResourceMonitorOpen
                  ? 'bg-slate-800 text-amber-300 border border-amber-500/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
              title="System Menu: Monitoring & Observability, SRS & Design Document"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>System</span>

              {/* Status Indicator Dot for Headroom */}
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  monitorState.trafficStatus === 'green'
                    ? 'bg-emerald-400'
                    : monitorState.trafficStatus === 'yellow'
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-red-400 animate-bounce'
                }`}
              />

              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isSystemDropdownOpen ? 'rotate-180 text-amber-300' : 'text-slate-400'}`} />
            </button>

            {/* System Dropdown Menu */}
            {isSystemDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl bg-slate-900 border border-amber-600/40 shadow-2xl p-2 z-50 backdrop-blur animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[10px] uppercase font-mono tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                  System Utilities
                </div>

                {/* Sub-item A: Monitoring / Observability (Optimal Headroom) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsSystemDropdownOpen(false);
                    onOpenResourceMonitor();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <div className="p-1.5 rounded-md bg-emerald-950/80 border border-emerald-700/50 text-emerald-400 group-hover:scale-105 transition-transform mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                        Monitoring & Observability
                      </span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          monitorState.trafficStatus === 'green'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : monitorState.trafficStatus === 'yellow'
                            ? 'bg-amber-950 text-amber-300 border border-amber-700'
                            : 'bg-red-950 text-red-300 border border-red-700'
                        }`}
                      >
                        {monitorState.ramUtilizationPct}% RAM
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Check optimal headroom, 32B/14B VRAM footprint, & flush model cache.
                    </p>
                  </div>
                </button>

                {/* Sub-item B: Help (SRS & System Design Document) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsSystemDropdownOpen(false);
                    onOpenHelpDocs();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer group mt-1"
                >
                  <div className="p-1.5 rounded-md bg-amber-950/80 border border-amber-700/50 text-amber-400 group-hover:scale-105 transition-transform mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-100 group-hover:text-amber-300 transition-colors">
                        Help & Specifications
                      </span>
                      <span className="text-[9px] font-mono bg-amber-950/80 text-amber-300 px-1.5 py-0.2 rounded border border-amber-700">
                        SRS / SDD
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Review complete product specification, architectural contracts, & export PDF.
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
