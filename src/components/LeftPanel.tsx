import React, { useState, useEffect, useRef } from 'react';
import { useHoroscope } from '../context/HoroscopeContext';
import { GrahaPosition, DashaPeriod } from '../types';
import {
  ChevronRight,
  ChevronDown,
  User,
  Sparkles,
  Calendar,
  Clock,
  Compass,
  ChevronsUpDown,
  ChevronsDown,
  ChevronsUp,
} from 'lucide-react';

export const LeftPanel: React.FC = () => {
  const { horoscope } = useHoroscope();
  const NATIVE_METADATA = horoscope.metadata;
  const GRAHA_COORDINATES = horoscope.grahas;
  const DASHA_TIMELINE = horoscope.dashaTimeline;

  // Section collapsible states
  const [isMetadataOpen, setIsMetadataOpen] = useState(true);
  const [isCoordinatesOpen, setIsCoordinatesOpen] = useState(true);
  const [isDashaOpen, setIsDashaOpen] = useState(true);

  // State for expanded accordion nodes inside Dasha
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'Venus': true, // MD
    'Venus-Saturn': true, // AD
  });

  const activeDashaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current Dasha on chart load (Spec 3.2.2)
  useEffect(() => {
    if (activeDashaRef.current) {
      activeDashaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  const toggleNode = (key: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExpandAllSections = () => {
    setIsMetadataOpen(true);
    setIsCoordinatesOpen(true);
    setIsDashaOpen(true);
  };

  const handleCollapseAllSections = () => {
    setIsMetadataOpen(false);
    setIsCoordinatesOpen(false);
    setIsDashaOpen(false);
  };

  return (
    <div className="flex flex-col gap-3 text-slate-200">
      {/* Top Section Efficiency Toolbar */}
      <div className="flex items-center justify-between px-1 py-0.5 text-xs font-mono">
        <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
          Left Panel Controls
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExpandAllSections}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-amber-300 border border-slate-800 flex items-center gap-1 transition-colors"
            title="Expand All Sections"
          >
            <ChevronsDown className="w-3 h-3" />
            Expand All
          </button>
          <button
            onClick={handleCollapseAllSections}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center gap-1 transition-colors"
            title="Collapse All Sections"
          >
            <ChevronsUp className="w-3 h-3" />
            Collapse All
          </button>
        </div>
      </div>

      {/* 1. Native Metadata & Anonymized ID (Collapsible) */}
      <div className="bg-slate-900/90 rounded-xl border border-amber-900/30 shadow-lg overflow-hidden transition-all">
        <div
          onClick={() => setIsMetadataOpen(!isMetadataOpen)}
          className="p-3 flex items-center justify-between cursor-pointer select-none bg-slate-900 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200 uppercase tracking-wide flex items-center gap-1.5">
                Native Metadata
                <span className="text-[10px] text-slate-500 font-mono font-normal">
                  (Reg: {NATIVE_METADATA.regNo})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isMetadataOpen && (
              <span className="text-[10px] font-mono text-amber-300/80 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/30">
                {NATIVE_METADATA.nakshatraTamil.split(' ')[0]} • {NATIVE_METADATA.rasiTamil}
              </span>
            )}
            <button className="text-slate-400 hover:text-amber-300">
              {isMetadataOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isMetadataOpen && (
          <div className="p-3 pt-0 border-t border-amber-900/20">
            <div className="text-[10px] text-slate-400 font-mono mb-2">
              ID: {NATIVE_METADATA.anonymizedId}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  நட்சத்திரம் (Star)
                </div>
                <div className="font-semibold text-amber-300 truncate">
                  {NATIVE_METADATA.nakshatraTamil}
                </div>
                <div className="text-[9px] text-slate-400 truncate">{NATIVE_METADATA.nakshatra}</div>
              </div>

              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Compass className="w-2.5 h-2.5 text-amber-400" />
                  இராசி & லக்னம்
                </div>
                <div className="font-semibold text-amber-300 truncate">
                  {NATIVE_METADATA.rasiTamil} / {NATIVE_METADATA.lagnaTamil.split(' ')[0]}
                </div>
                <div className="text-[9px] text-slate-400 truncate">{NATIVE_METADATA.lagnaTamil}</div>
              </div>

              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5 text-amber-400" />
                  திதி & யோகம்
                </div>
                <div className="font-medium text-slate-300 text-[10px] truncate">
                  {NATIVE_METADATA.thithi.split('-')[0]}
                </div>
                <div className="text-[9px] text-slate-500 truncate">{NATIVE_METADATA.yogam}</div>
              </div>

              <div className="bg-slate-950/60 p-1.5 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5 text-amber-400" />
                  ஹோரை & கரணம்
                </div>
                <div className="font-medium text-slate-300 text-[10px] truncate">
                  {NATIVE_METADATA.horai}
                </div>
                <div className="text-[9px] text-slate-500 truncate">{NATIVE_METADATA.karanam}</div>
              </div>
            </div>

            <div className="mt-2 text-[10px] font-mono text-amber-300/80 bg-amber-950/30 p-1.5 rounded border border-amber-900/30">
              <span className="text-slate-400">தொடக்க இருப்பு:</span> {NATIVE_METADATA.startingDashaBalance}
            </div>
          </div>
        )}
      </div>

      {/* 2. D1 Planetary Coordinates Table (Collapsible) */}
      <div className="bg-slate-900/90 rounded-xl border border-amber-900/30 shadow-lg overflow-hidden transition-all">
        <div
          onClick={() => setIsCoordinatesOpen(!isCoordinatesOpen)}
          className="p-3 flex items-center justify-between cursor-pointer select-none bg-slate-900 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              D1 Planetary Coordinates
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCoordinatesOpen ? (
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                11 Bodies (Lagna + 9 Grahas + Mandi)
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">11 Positions</span>
            )}
            <button className="text-slate-400 hover:text-amber-300">
              {isCoordinatesOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isCoordinatesOpen && (
          <div className="p-3 pt-0 border-t border-amber-900/20 overflow-x-auto">
            <table className="w-full text-left text-[11px] font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                  <th className="py-1 px-1.5 font-medium">Graha</th>
                  <th className="py-1 px-1.5 font-medium">Rasi & Deg</th>
                  <th className="py-1 px-1.5 font-medium">Nakshatra</th>
                  <th className="py-1 px-1 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {GRAHA_COORDINATES.map((g: GrahaPosition) => {
                  const isLagna = g.id === 'lagna';
                  return (
                    <tr
                      key={g.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isLagna ? 'bg-amber-500/10 text-amber-200 font-semibold' : ''
                      }`}
                    >
                      <td className="py-1 px-1.5 flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-amber-400 font-bold w-3 text-center">{g.glyph}</span>
                        <span className="text-slate-200">{g.tamilName}</span>
                        <span className="text-[9px] text-slate-400">({g.name.split(' ')[0]})</span>
                      </td>
                      <td className="py-1 px-1.5 whitespace-nowrap">
                        <div className="text-amber-300/90 font-medium">
                          {g.tamilSign}{' '}
                          <span className="text-slate-300">{g.formattedLongitude}</span>
                        </div>
                      </td>
                      <td className="py-1 px-1.5 whitespace-nowrap">
                        <span className="text-slate-300">{g.nakshatraTamil}</span>
                        <span className="text-amber-400 ml-1 font-bold">P{g.pada}</span>
                      </td>
                      <td className="py-1 px-1 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {g.isRetrograde && (
                            <span
                              className="bg-red-950/80 text-red-400 border border-red-700/60 px-1 rounded text-[9px] font-bold"
                              title="Retrograde (வக்ரம்)"
                            >
                              R
                            </span>
                          )}
                          {g.isCombust && (
                            <span
                              className="bg-orange-950/80 text-orange-400 border border-orange-700/60 px-1 rounded text-[9px] font-bold"
                              title="Combust (அஸ்தங்கம்)"
                            >
                              C
                            </span>
                          )}
                          {!g.isRetrograde && !g.isCombust && (
                            <span className="text-slate-600 text-[10px]">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Vimshottari Dasha Hierarchy Accordion (Collapsible) */}
      <div className="bg-slate-900/90 rounded-xl border border-amber-900/30 shadow-lg overflow-hidden transition-all">
        <div
          onClick={() => setIsDashaOpen(!isDashaOpen)}
          className="p-3 flex items-center justify-between cursor-pointer select-none bg-slate-900 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              Vimshottari Dasha Tree
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
              Active: Sukran MD
            </span>
            <button className="text-slate-400 hover:text-amber-300">
              {isDashaOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isDashaOpen && (
          <div className="p-3 pt-0 border-t border-amber-900/20">
            <div className="text-[10px] text-slate-400 mb-2">
              MD $\rightarrow$ AD $\rightarrow$ PD • Auto-expanded to active 2026 period
            </div>

            <div className="overflow-y-auto max-h-[360px] space-y-1.5 pr-1 font-mono text-[11px] scrollbar-thin scrollbar-thumb-amber-700/40">
              {DASHA_TIMELINE.map((md) => {
                const isMdOpen = !!expandedNodes[md.planet];
                const isMdCurrent = md.isCurrent;

                return (
                  <div
                    key={md.planet}
                    className={`rounded-lg border transition-all ${
                      isMdCurrent
                        ? 'border-amber-500/60 bg-amber-950/20'
                        : 'border-slate-800 bg-slate-950/50'
                    }`}
                  >
                    {/* Mahadasha (Level 1) */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNode(md.planet);
                      }}
                      className={`p-2 flex items-center justify-between cursor-pointer select-none rounded-t-lg transition-colors ${
                        isMdCurrent ? 'bg-amber-900/30 text-amber-200' : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {md.subPeriods ? (
                          isMdOpen ? (
                            <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                          )
                        ) : (
                          <div className="w-3.5" />
                        )}
                        <span className="font-semibold text-xs text-amber-300">
                          {md.tamilPlanet}
                        </span>
                        {isMdCurrent && (
                          <span className="text-[9px] bg-amber-500 text-slate-950 px-1 rounded font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {md.startDate.slice(0, 4)} - {md.endDate.slice(0, 4)}
                      </div>
                    </div>

                    {/* Level 2: Antardasha (AD) */}
                    {isMdOpen && md.subPeriods && (
                      <div className="pl-4 pr-1 pb-1 pt-0.5 space-y-1 border-t border-slate-800/60">
                        {md.subPeriods.map((ad) => {
                          const adKey = `${md.planet}-${ad.planet}`;
                          const isAdOpen = !!expandedNodes[adKey];
                          const isAdCurrent = ad.isCurrent;

                          return (
                            <div
                              key={adKey}
                              className={`rounded border text-[10px] ${
                                isAdCurrent
                                  ? 'border-amber-500/50 bg-amber-950/40'
                                  : 'border-slate-800/70 bg-slate-900/60'
                              }`}
                            >
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleNode(adKey);
                                }}
                                className={`p-1.5 flex items-center justify-between cursor-pointer select-none ${
                                  isAdCurrent ? 'text-amber-200 font-semibold' : 'text-slate-300 hover:bg-slate-800/40'
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  {ad.subPeriods ? (
                                    isAdOpen ? (
                                      <ChevronDown className="w-3 h-3 text-amber-400" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-slate-500" />
                                    )
                                  ) : (
                                    <div className="w-3" />
                                  )}
                                  <span>{ad.tamilPlanet}</span>
                                </div>
                                <div className="text-[9px] text-slate-400">
                                  {ad.startDate} to {ad.endDate}
                                </div>
                              </div>

                              {/* Level 3: Pratyantardasha (PD) */}
                              {isAdOpen && ad.subPeriods && (
                                <div className="pl-4 pr-1 pb-1 pt-0.5 space-y-0.5 border-t border-slate-800/50">
                                  {ad.subPeriods.map((pd, pidx) => {
                                    const isPdCurrent = pd.isCurrent;
                                    return (
                                      <div
                                        key={pidx}
                                        ref={isPdCurrent ? activeDashaRef : undefined}
                                        className={`p-1 rounded flex items-center justify-between text-[9px] ${
                                          isPdCurrent
                                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                                            : 'text-slate-400 hover:bg-slate-800/30'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1">
                                          <span>↳</span>
                                          <span>{pd.tamilPlanet}</span>
                                        </div>
                                        <div className="font-mono">
                                          {pd.startDate} ~ {pd.endDate}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
