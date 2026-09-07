import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DivisionalChartId, DivisionalChart } from '../types';
import {
  DIVISIONAL_CHARTS,
  GRAHA_COORDINATES,
  ASHTAKAVARGA_DATA,
  INDIVIDUAL_BINDU_POINTS,
  SHADBALA_DATA,
  ASTRO_YOGAS,
  SIGN_NAMES,
} from '../data/canonicalHoroscope';
import { LeftPanel } from './LeftPanel';
import { SouthIndianChart } from './SouthIndianChart';
import {
  calculateGrahaDivisionalSign,
  SIGN_NAMES_EN,
  SIGN_NAMES_TA,
} from '../utils/bphsEngine';
import {
  Grid,
  Sparkles,
  BarChart3,
  Award,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsDown,
  ChevronsUp,
  Calculator,
  GripVertical,
} from 'lucide-react';

export const StudioView: React.FC = () => {
  const [selectedChartId, setSelectedChartId] = useState<DivisionalChartId>('D1');
  const [matrixTab, setMatrixTab] = useState<'sarva' | 'individual' | 'shadbala' | 'yogas'>('sarva');
  const [selectedGrahaBindu, setSelectedGrahaBindu] = useState<string>('Jupiter');

  // Section collapse states for screen efficiency
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [isChartSectionOpen, setIsChartSectionOpen] = useState(true);
  const [isMatrixSectionOpen, setIsMatrixSectionOpen] = useState(true);
  const [showBphsMath, setShowBphsMath] = useState(false);

  // Left Panel Mouse-Driven Resizable Splitter State
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('studio_left_panel_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (val >= 240 && val <= 650) return val;
      }
    } catch (e) {}
    return 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      const minWidth = 240;
      // Allow up to 55% of container or 650px, ensuring right canvas has at least 340px
      const maxWidth = Math.min(650, Math.max(300, containerRect.width - 340));
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setLeftPanelWidth(newWidth);
        try {
          localStorage.setItem('studio_left_panel_width', newWidth.toString());
        } catch (err) {}
      }
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  const currentChart: DivisionalChart =
    DIVISIONAL_CHARTS.find((c) => c.id === selectedChartId) || DIVISIONAL_CHARTS[0];

  const handleExpandAll = () => {
    setIsChartSectionOpen(true);
    setIsMatrixSectionOpen(true);
    setShowLeftPanel(true);
  };

  const handleCollapseAll = () => {
    setIsChartSectionOpen(false);
    setIsMatrixSectionOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-3 sm:py-5">
      {/* Studio Screen Master Efficiency Bar */}
      <div className="mb-3 flex items-center justify-between bg-slate-900/80 px-3.5 py-2 rounded-xl border border-amber-900/30 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <button
            onClick={() => setShowLeftPanel(!showLeftPanel)}
            className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-800/40 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Toggle Left Side-Panel"
          >
            {showLeftPanel ? (
              <>
                <PanelLeftClose className="w-3.5 h-3.5 text-amber-400" />
                <span>Hide Left Panel</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-3.5 h-3.5 text-amber-400" />
                <span>Show Left Panel</span>
              </>
            )}
          </button>

          {showLeftPanel && (
            <div className="hidden lg:flex items-center gap-1.5 text-slate-400 text-[11px]">
              <span className="text-slate-600">•</span>
              <span>
                Panel Width: <strong className="text-amber-300 font-mono">{leftPanelWidth}px</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setLeftPanelWidth(320);
                  try {
                    localStorage.setItem('studio_left_panel_width', '320');
                  } catch (e) {}
                }}
                className="text-[10px] text-slate-400 hover:text-amber-300 underline cursor-pointer ml-0.5"
                title="Reset Left Panel Width to Default (320px)"
              >
                Reset
              </button>
            </div>
          )}

          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">
            Active Chart: <strong className="text-amber-300 font-bold">{currentChart.name} ({currentChart.id})</strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExpandAll}
            className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-[11px] text-amber-300 border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronsDown className="w-3 h-3" />
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronsUp className="w-3 h-3" />
            Collapse All
          </button>
        </div>
      </div>

      {/* Resizable Layout: Mouse-resizable Left Panel and Main Canvas with Splitter */}
      <div
        ref={containerRef}
        className="flex flex-col lg:flex-row items-stretch relative"
      >
        {/* LEFT PANEL: PERSISTENT METADATA */}
        {showLeftPanel && (
          <>
            {/* Desktop fixed-width wrapper & Mobile full-width */}
            <div
              className="w-full lg:shrink-0 overflow-hidden transition-none"
              style={{ width: undefined }}
            >
              {/* Desktop clamped container */}
              <div
                className="hidden lg:block h-full"
                style={{ width: `${leftPanelWidth}px` }}
              >
                <LeftPanel />
              </div>
              {/* Mobile container */}
              <div className="lg:hidden w-full mb-5">
                <LeftPanel />
              </div>
            </div>

            {/* MOUSE-DRIVEN RESIZABLE SPLITTER (AI Studio Style) */}
            <div
              onMouseDown={startResizing}
              onDoubleClick={() => {
                setLeftPanelWidth(320);
                try {
                  localStorage.setItem('studio_left_panel_width', '320');
                } catch (e) {}
              }}
              className={`hidden lg:flex items-center justify-center w-3 hover:w-3.5 mx-1 group cursor-col-resize select-none shrink-0 transition-all z-20 relative ${
                isResizing ? 'bg-amber-500/15' : 'hover:bg-amber-500/10'
              }`}
              title="Drag with mouse to resize left panel (Double-click to reset)"
            >
              {/* Vertical guideline */}
              <div
                className={`w-[2px] h-full transition-colors ${
                  isResizing
                    ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                    : 'bg-slate-800 group-hover:bg-amber-500/70'
                }`}
              />

              {/* Central Grab Handle with grip dots */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 py-3 px-1 rounded-full bg-slate-900 border transition-all shadow-md ${
                  isResizing
                    ? 'border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                    : 'border-slate-700/90 group-hover:border-amber-500/70'
                }`}
              >
                <div className={`w-1 h-1 rounded-full transition-colors ${isResizing ? 'bg-amber-300' : 'bg-slate-400 group-hover:bg-amber-300'}`} />
                <div className={`w-1 h-1 rounded-full transition-colors ${isResizing ? 'bg-amber-300' : 'bg-slate-400 group-hover:bg-amber-300'}`} />
                <div className={`w-1 h-1 rounded-full transition-colors ${isResizing ? 'bg-amber-300' : 'bg-slate-400 group-hover:bg-amber-300'}`} />
              </div>
            </div>
          </>
        )}

        {/* MAIN CANVAS: DIVISIONAL CHART GRID (Flex-1) */}
        <div className={`flex-1 min-w-0 flex flex-col gap-4 ${showLeftPanel ? 'lg:pl-2' : ''}`}>
          {/* SECTION 1: Tabbed Divisional Chart Visualizer (Collapsible) */}
          <div className="bg-slate-900/90 rounded-2xl border border-amber-900/40 shadow-xl backdrop-blur overflow-hidden transition-all">
            {/* Header & Collapse Trigger */}
            <div
              onClick={() => setIsChartSectionOpen(!isChartSectionOpen)}
              className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/30 cursor-pointer select-none bg-slate-900 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-amber-400" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-amber-200 tracking-wide uppercase flex items-center gap-2">
                    Divisional Chart Visualizer (D1 to D12 Scope)
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono">
                    South Indian 4x4 Grid • Fixed Zodiac • Currently viewing [{selectedChartId}] {currentChart.name}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  {currentChart.tamilName}
                </span>
                <button className="text-slate-400 hover:text-amber-300">
                  {isChartSectionOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isChartSectionOpen && (
              <div className="p-3 sm:p-4 flex flex-col gap-3">
                {/* D1 to D12 Tabs */}
                <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1">
                  {DIVISIONAL_CHARTS.map((c) => {
                    const isActive = c.id === selectedChartId;
                    return (
                      <button
                        key={c.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChartId(c.id);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-bold ring-2 ring-amber-400/40'
                            : 'bg-slate-950 text-slate-300 hover:text-amber-200 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        <span className="font-mono font-bold">[{c.id}]</span>
                        <span>{c.name.split(' ')[0]}</span>
                        <span className="text-[10px] opacity-75 hidden sm:inline">
                          ({c.tamilName.split(' ')[0]})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* South Indian Chart Visualizer */}
                <SouthIndianChart
                  chart={currentChart}
                  selectedChartId={selectedChartId}
                  onSelectDivisional={(id) => setSelectedChartId(id)}
                />

                {/* BPHS Mathematical Derivation Audit Bar */}
                <div className="mt-1 bg-slate-950/70 border border-amber-900/30 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300 font-mono">
                        BPHS Mathematical Engine: {currentChart.id} ({currentChart.name})
                      </span>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700/40 font-mono">
                        100% Calculated from Sphutam
                      </span>
                    </div>

                    <button
                      onClick={() => setShowBphsMath(!showBphsMath)}
                      className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-amber-300 border border-slate-800 flex items-center gap-1 transition-colors"
                    >
                      {showBphsMath ? 'Hide Math Derivations' : 'View BPHS Mathematical Proof'}
                      {showBphsMath ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {showBphsMath && (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full text-[11px] font-mono border-collapse text-left">
                        <thead>
                          <tr className="border-b border-amber-900/40 text-slate-400">
                            <th className="py-1.5 px-2">Graha</th>
                            <th className="py-1.5 px-2">D1 Longitude</th>
                            <th className="py-1.5 px-2">Nakshatra Pada</th>
                            <th className="py-1.5 px-2">BPHS Mathematical Rule</th>
                            <th className="py-1.5 px-2">Result Sign ({currentChart.id})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {GRAHA_COORDINATES.map((graha) => {
                            const { signIndex, rule } = calculateGrahaDivisionalSign(graha, selectedChartId);
                            const signTa = SIGN_NAMES_TA[signIndex];
                            const signEn = SIGN_NAMES_EN[signIndex];
                            return (
                              <tr key={graha.id} className="hover:bg-slate-900/50">
                                <td className="py-1.5 px-2 font-bold text-amber-300">
                                  {graha.tamilName} ({graha.shortName})
                                </td>
                                <td className="py-1.5 px-2 text-slate-300">
                                  {graha.tamilSign} {graha.formattedLongitude}
                                </td>
                                <td className="py-1.5 px-2 text-slate-400">
                                  {graha.nakshatraTamil} - {graha.pada}
                                </td>
                                <td className="py-1.5 px-2 text-amber-200/90 text-[10px]">
                                  {rule}
                                </td>
                                <td className="py-1.5 px-2 font-bold text-emerald-400">
                                  {signTa} ({signEn})
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Planetary Strength / Ashtakavarga Matrix / Yogas (Collapsible) */}
          <div className="bg-slate-900/90 rounded-2xl border border-amber-900/40 shadow-xl backdrop-blur overflow-hidden transition-all">
            {/* Header & Collapse Trigger */}
            <div
              onClick={() => setIsMatrixSectionOpen(!isMatrixSectionOpen)}
              className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/30 cursor-pointer select-none bg-slate-900 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-amber-200 uppercase tracking-wide">
                    Planetary Strength, Ashtakavarga Matrix & Yogas
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Sarvashtakavarga (339 Bindus) • Shadbala Rupa analysis • 7 BPHS Yogas
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {!isMatrixSectionOpen && (
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                    Sarva: 339 • Strong: Guru, Sukran
                  </span>
                )}
                <button className="text-slate-400 hover:text-amber-300">
                  {isMatrixSectionOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isMatrixSectionOpen && (
              <div className="p-3 sm:p-4">
                {/* Matrix Sub-Tabs */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4 overflow-x-auto">
                  <button
                    onClick={() => setMatrixTab('sarva')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      matrixTab === 'sarva'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sarvashtakavarga (339)
                  </button>
                  <button
                    onClick={() => setMatrixTab('individual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      matrixTab === 'individual'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Bhinnashtakavarga
                  </button>
                  <button
                    onClick={() => setMatrixTab('shadbala')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      matrixTab === 'shadbala'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Shadbala (6-fold Strength)
                  </button>
                  <button
                    onClick={() => setMatrixTab('yogas')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      matrixTab === 'yogas'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Auspicious Yogas (7 Active)
                  </button>
                </div>

                {/* TAB 1: Sarvashtakavarga Grid */}
                {matrixTab === 'sarva' && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 text-xs">
                      <span className="text-slate-400">
                        Total Auspicious Bindu Points (Page 8 of Jothidar PDF):
                      </span>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <span>
                          Rasi Pinda: <strong className="text-amber-300">{ASHTAKAVARGA_DATA.rasiPinda}</strong>
                        </span>
                        <span>
                          Graha Pinda: <strong className="text-amber-300">{ASHTAKAVARGA_DATA.grahaPinda}</strong>
                        </span>
                        <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                          Sodhya Pinda: <strong>{ASHTAKAVARGA_DATA.sodhyaPinda}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 font-mono">
                      {SIGN_NAMES.map((sign, idx) => {
                        const bindus = ASHTAKAVARGA_DATA.sarvashtakavarga[idx];
                        const isHigh = bindus >= 30;
                        const isLow = bindus < 25;

                        return (
                          <div
                            key={sign.index}
                            className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                              isHigh
                                ? 'bg-amber-950/30 border-amber-600/50 shadow-sm'
                                : isLow
                                ? 'bg-slate-950/60 border-slate-800'
                                : 'bg-slate-900/80 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-bold text-amber-300">{sign.tamilName}</span>
                              <span className="text-[10px] text-slate-500">{sign.symbol}</span>
                            </div>
                            <div className="mt-1 flex items-baseline justify-between">
                              <span className="text-xs text-slate-400">{sign.name.slice(0, 3)}</span>
                              <span
                                className={`text-lg font-extrabold ${
                                  isHigh
                                    ? 'text-emerald-400'
                                    : isLow
                                    ? 'text-amber-600'
                                    : 'text-amber-300'
                                }`}
                              >
                                {bindus}
                              </span>
                            </div>
                            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isHigh ? 'bg-emerald-400' : isLow ? 'bg-amber-600' : 'bg-amber-400'
                                }`}
                                style={{ width: `${Math.min(100, (bindus / 38) * 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: Individual Bhinnashtakavarga */}
                {matrixTab === 'individual' && (
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      <span className="text-xs text-slate-400 mr-2">Select Planet:</span>
                      {Object.keys(INDIVIDUAL_BINDU_POINTS).map((planet) => (
                        <button
                          key={planet}
                          onClick={() => setSelectedGrahaBindu(planet)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                            selectedGrahaBindu === planet
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {planet}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 font-mono">
                      {SIGN_NAMES.map((sign, idx) => {
                        const bindus = INDIVIDUAL_BINDU_POINTS[selectedGrahaBindu]?.[idx] ?? 0;
                        return (
                          <div
                            key={sign.index}
                            className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 flex flex-col justify-between"
                          >
                            <div className="text-[11px] text-slate-400 flex items-center justify-between">
                              <span className="text-amber-300 font-medium">{sign.tamilName}</span>
                              <span className="text-[10px] text-slate-500">{sign.name.slice(0, 3)}</span>
                            </div>
                            <div className="mt-1 text-right">
                              <span className="text-lg font-bold text-amber-200">{bindus}</span>
                              <span className="text-[10px] text-slate-500 ml-1">/ 8</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: Shadbala 6-Fold Strength */}
                {matrixTab === 'shadbala' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                          <th className="py-2 px-2">Graha</th>
                          <th className="py-2 px-2">Total Rupa</th>
                          <th className="py-2 px-2">Strength Ratio</th>
                          <th className="py-2 px-2">Sthana Bala</th>
                          <th className="py-2 px-2">Dig Bala</th>
                          <th className="py-2 px-2">Kala Bala</th>
                          <th className="py-2 px-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {SHADBALA_DATA.map((s) => (
                          <tr key={s.planet} className="hover:bg-slate-800/40">
                            <td className="py-2 px-2 font-semibold text-amber-300">
                              {s.tamilPlanet} <span className="text-slate-400 font-normal">({s.planet.split(' ')[0]})</span>
                            </td>
                            <td className="py-2 px-2 text-slate-200">{s.rupa.toFixed(2)}</td>
                            <td className="py-2 px-2 font-bold text-amber-400">{s.ratio.toFixed(2)}</td>
                            <td className="py-2 px-2 text-slate-400">{s.sthanaBala.toFixed(1)}</td>
                            <td className="py-2 px-2 text-slate-400">{s.digBala.toFixed(1)}</td>
                            <td className="py-2 px-2 text-slate-400">{s.kalaBala.toFixed(1)}</td>
                            <td className="py-2 px-2">
                              {s.isStrong ? (
                                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                                  <CheckCircle2 className="w-3 h-3" /> Strong
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-500 bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-800/40">
                                  Moderate
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 4: Yogas Present in Horoscope */}
                {matrixTab === 'yogas' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ASTRO_YOGAS.map((y) => (
                      <div
                        key={y.id}
                        className="p-3 rounded-xl border border-amber-800/40 bg-slate-950/70 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              {y.name} ({y.tamilName})
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
                              Active
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-amber-200/80 mb-1.5">
                            <strong className="text-slate-400">Rule:</strong> {y.rule}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{y.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
