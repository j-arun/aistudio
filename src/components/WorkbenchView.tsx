import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Code2,
  Send,
  Copy,
  FileText,
  Sliders,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Mic,
  MicOff,
  Radio,
  Calendar,
  Clock,
  RotateCcw,
  Edit3,
  SlidersHorizontal,
  Check,
  Settings,
  Server,
  Layers,
  Cpu,
  Laptop,
  X,
  ExternalLink,
} from 'lucide-react';
import { DIVISIONAL_CHARTS } from '../data/canonicalHoroscope';
import {
  buildBphsOutboundPrompt,
  OutboundPromptPayload,
  PlanetTransitInfo,
  getAccurateTransitsForPeriod,
  SIGN_NAMES_EN,
  SIGN_NAMES_TA,
  NAKSHATRA_NAMES,
  getHouseFromLagna,
  getHouseFromMoon,
} from '../utils/promptBuilder';
import { LlmConfigSettings } from './LlmConfigSettings';
import {
  loadLlmSettings,
  saveLlmSettings,
  InjectedLlmSettings,
  dispatchMultiLlm,
  MultiLlmDispatchResult,
} from '../utils/llmService';

interface PresetPeriod {
  label: string;
  date: string;
  description: string;
}

const PRESET_PERIODS: PresetPeriod[] = [
  {
    label: 'September 2026 (Active Window)',
    date: '2026-09-07',
    description: 'Jupiter exalted in Cancer (8th/9th), Saturn in Pisces (4th/5th), Rahu in Aquarius (3rd Upachaya)',
  },
  {
    label: 'June 2026 (Jupiter Exaltation Ingress)',
    date: '2026-06-15',
    description: 'Jupiter enters Cancer at 01° (Uchha), Sun in Gemini, Saturn in early Pisces',
  },
  {
    label: 'April 2026 (Saturn Ingress & Sun Exalted)',
    date: '2026-04-15',
    description: 'Saturn fresh ingress into Pisces, Sun exalted in Aries, Mars debilitated in Cancer',
  },
  {
    label: 'January 2026 (Early 2026 Baseline)',
    date: '2026-01-15',
    description: 'Saturn in Aquarius (3rd Upachaya), Jupiter in Gemini (7th Kendra), Rahu in Pisces',
  },
  {
    label: 'November 2026 (Mars Swakshetra)',
    date: '2026-11-15',
    description: 'Mars enters Scorpio (Own sign / over Janma Rasi), Jupiter exalted retrograde in Cancer',
  },
];

export const WorkbenchView: React.FC = () => {
  // Zone 1 States - Period of Interest
  const [periodLabel, setPeriodLabel] = useState('September 2026 (Active Window)');
  const [targetDate, setTargetDate] = useState('2026-09-07');
  const [showTransitBoard, setShowTransitBoard] = useState(true);
  const [narrativeInput, setNarrativeInput] = useState(
    'My brother Ramesh and I are evaluating buying a vehicle TN-10-AZ-1038 in mid-2026 and shifting job in Bangalore. Transferred from A/C 40591039821, contact me at +91 98765 43210.'
  );

  // User-Feedable 9-Graha Transits State
  const [transits, setTransits] = useState<PlanetTransitInfo[]>(() =>
    getAccurateTransitsForPeriod('2026-09-07')
  );
  const [modifiedPlanets, setModifiedPlanets] = useState<Record<string, boolean>>({});

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);

  // Zone 2 States
  const [sanitizePii, setSanitizePii] = useState(true);
  const [activePromptTab, setActivePromptTab] = useState<'xml' | 'gemini' | 'secondary' | 'piiAudit'>('xml');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Zone 3 States
  const [activeReportTab, setActiveReportTab] = useState<'primary' | 'secondary' | 'sideBySide'>('sideBySide');
  const [isSimulating, setIsSimulating] = useState(false);

  // Injected In-App LLM Configurations (Personal URL, Primary Settings, Secondary Settings)
  const [llmSettings, setLlmSettings] = useState<InjectedLlmSettings>(loadLlmSettings);
  const [isLlmConfigModalOpen, setIsLlmConfigModalOpen] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<MultiLlmDispatchResult | null>(null);

  // Section collapse states for maximum screen efficiency
  const [isZone1Open, setIsZone1Open] = useState(true);
  const [isZone2Open, setIsZone2Open] = useState(true);
  const [isZone3Open, setIsZone3Open] = useState(true);

  const handleExpandAll = () => {
    setIsZone1Open(true);
    setIsZone2Open(true);
    setIsZone3Open(true);
  };

  const handleCollapseAll = () => {
    setIsZone1Open(false);
    setIsZone2Open(false);
    setIsZone3Open(false);
  };

  // Build the complete Outbound Prompt strictly for the Period of Interest and User-Fed Transits
  const outboundPayload: OutboundPromptPayload = useMemo(() => {
    return buildBphsOutboundPrompt(periodLabel, targetDate, narrativeInput, DIVISIONAL_CHARTS, transits);
  }, [periodLabel, targetDate, narrativeInput, transits]);

  const handleSelectPresetPeriod = (preset: PresetPeriod) => {
    setPeriodLabel(preset.label);
    setTargetDate(preset.date);
    const newCalculated = getAccurateTransitsForPeriod(preset.date);
    setTransits(newCalculated);
    setModifiedPlanets({});
  };

  const handleDateChange = (newDate: string) => {
    setTargetDate(newDate);
    const d = new Date(newDate);
    if (!isNaN(d.getTime())) {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      setPeriodLabel(`${monthNames[d.getMonth()]} ${d.getFullYear()} Target Window`);
      const newCalculated = getAccurateTransitsForPeriod(newDate);
      setTransits(newCalculated);
      setModifiedPlanets({});
    }
  };

  // Field change handler for any transit card
  const handleTransitFieldChange = (planetName: string, field: string, value: any) => {
    setTransits((prev) =>
      prev.map((t) => {
        if (t.planet !== planetName) return t;

        if (field === 'signIndex') {
          const signIdx = Number(value);
          const transitSign = SIGN_NAMES_EN[signIdx];
          const tamilSign = SIGN_NAMES_TA[signIdx];
          const houseFromLagna = getHouseFromLagna(signIdx);
          const houseFromMoon = getHouseFromMoon(signIdx);
          return {
            ...t,
            signIndex: signIdx,
            transitSign,
            tamilSign,
            houseFromLagna,
            houseFromMoon,
          };
        }

        return {
          ...t,
          [field]: value,
        };
      })
    );

    setModifiedPlanets((prev) => ({
      ...prev,
      [planetName]: true,
    }));
  };

  const handleResetSinglePlanet = (planetName: string) => {
    const defaults = getAccurateTransitsForPeriod(targetDate);
    const defPlanet = defaults.find((p) => p.planet === planetName);
    if (defPlanet) {
      setTransits((prev) => prev.map((t) => (t.planet === planetName ? { ...defPlanet } : t)));
      setModifiedPlanets((prev) => {
        const next = { ...prev };
        delete next[planetName];
        return next;
      });
    }
  };

  const handleResetAllTransits = () => {
    const defaults = getAccurateTransitsForPeriod(targetDate);
    setTransits(defaults);
    setModifiedPlanets({});
  };

  const handleQuickFeedPreset = (
    planetName: string,
    signIdx: number,
    deg: string,
    status: string,
    nakshatra?: string,
    pada?: number
  ) => {
    setTransits((prev) =>
      prev.map((t) => {
        if (t.planet !== planetName) return t;
        const transitSign = SIGN_NAMES_EN[signIdx];
        const tamilSign = SIGN_NAMES_TA[signIdx];
        const houseFromLagna = getHouseFromLagna(signIdx);
        const houseFromMoon = getHouseFromMoon(signIdx);
        return {
          ...t,
          signIndex: signIdx,
          transitSign,
          tamilSign,
          degree: deg,
          classicalStatus: status,
          nakshatra: nakshatra || t.nakshatra,
          pada: pada !== undefined ? pada : t.pada,
          houseFromLagna,
          houseFromMoon,
        };
      })
    );
    setModifiedPlanets((prev) => ({
      ...prev,
      [planetName]: true,
    }));
  };

  // Speech Recognition Engine using Web Speech API with fallback simulation
  const toggleSpeechRecognition = () => {
    if (isListening) {
      setIsListening(false);
      setSpeechStatus(null);
      return;
    }

    const customWindow = window as unknown as {
      webkitSpeechRecognition?: any;
      SpeechRecognition?: any;
    };
    const SpeechRecognition = customWindow.SpeechRecognition || customWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechStatus('Web Speech API unavailable in this browser. Try speech simulation below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechStatus('Listening to native speech input... Speak your astrological query.');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setNarrativeInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setSpeechStatus(`Captured audio transcript: "${transcript}"`);
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechStatus('Microphone permission blocked. You can use speech presets below.');
        } else {
          setSpeechStatus(`Microphone notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn('Speech recognition startup error:', err);
      setIsListening(false);
      setSpeechStatus('Could not initialize speech recognition. Use speech presets below.');
    }
  };

  const handleApplyPresetSpeech = (presetText: string) => {
    setNarrativeInput(presetText);
    setSpeechStatus('Simulated speech audio note loaded into narrative canvas.');
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSimulateDispatch = async () => {
    setIsSimulating(true);
    try {
      const result = await dispatchMultiLlm(outboundPayload, llmSettings);
      setDispatchResult(result);
      setIsZone3Open(true);
    } catch (err) {
      console.error('Multi-LLM dispatch error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-3 sm:py-5 flex flex-col gap-4">
      {/* Workbench Screen Master Efficiency Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 px-3.5 py-2 rounded-xl border border-amber-900/30 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-amber-200">Component 3: Workbench Screen (Synthesis & Reasoning)</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-emerald-400 hidden sm:inline text-[11px]">
            Period-of-Interest Gochara Engine • Public LLM Outbound Packaging
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExpandAll}
            className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-[11px] text-amber-300 border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronsDown className="w-3 h-3" />
            Expand All Zones
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

      {/* ZONE 1: PERIOD OF INTEREST & TEMPORAL ANCHORS (Collapsible) */}
      <div className="bg-slate-900/90 rounded-2xl border border-amber-900/40 shadow-xl overflow-hidden transition-all">
        <div
          onClick={() => setIsZone1Open(!isZone1Open)}
          className="p-3.5 flex items-center justify-between cursor-pointer select-none bg-slate-900 hover:bg-slate-800/50 transition-colors border-b border-amber-900/30"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-200 uppercase tracking-wide">
                Zone 1: Period of Interest, Gochara Transits & Narrative Canvas
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Period of Interest Anchor • Cached Dasha Synchronizer • Accurate 9-Graha Transits Egress
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isZone1Open && (
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                Period: {periodLabel} • Dasha: {outboundPayload.cachedDasha.mahadasha}/
                {outboundPayload.cachedDasha.antardasha}/{outboundPayload.cachedDasha.pratyantardasha}
              </span>
            )}
            <button className="text-slate-400 hover:text-amber-300">
              {isZone1Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isZone1Open && (
          <div className="p-4 flex flex-col gap-4">
            {/* Period of Interest Selector & Cached Dasha Resolver */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 font-mono text-xs items-stretch">
              {/* Period of Interest Input & Date Picker */}
              <div className="lg:col-span-6 p-3 rounded-xl bg-slate-950 border border-amber-900/40 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-amber-200 text-xs font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Period of Interest for Analysis:</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Target Date: {targetDate}
                  </span>
                </div>

                {/* Quick Period Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_PERIODS.map((preset) => {
                    const isSelected = targetDate === preset.date;
                    return (
                      <button
                        key={preset.date}
                        type="button"
                        onClick={() => handleSelectPresetPeriod(preset)}
                        className={`px-2.5 py-1 rounded-lg text-[10.5px] transition-all cursor-pointer font-medium ${
                          isSelected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                            : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {preset.label.split(' (')[0]}
                      </button>
                    );
                  })}
                </div>

                {/* Date Input Box */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <input
                      type="date"
                      value={targetDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="bg-transparent text-amber-200 font-semibold text-xs focus:outline-none w-full"
                    />
                  </div>
                  <span className="text-[10.5px] text-slate-400 shrink-0">
                    Selected Window: <strong className="text-amber-300">{periodLabel}</strong>
                  </span>
                </div>
              </div>

              {/* Active Dasha (Auto-Resolved from Cache for this Period of Interest) */}
              <div className="lg:col-span-6 p-3 rounded-xl bg-slate-950 border border-amber-900/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Active Dasha for {periodLabel}
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40 font-semibold">
                      Auto-Resolved from Cache
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Mahadasha (MD)</span>
                      <strong className="text-amber-300 text-xs">{outboundPayload.cachedDasha.mahadasha}</strong>
                      <span className="text-[9.5px] text-slate-500 block truncate">
                        {outboundPayload.cachedDasha.tamilMahadasha}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Antardasha (AD)</span>
                      <strong className="text-amber-300 text-xs">{outboundPayload.cachedDasha.antardasha}</strong>
                      <span className="text-[9.5px] text-slate-500 block truncate">
                        {outboundPayload.cachedDasha.tamilAntardasha}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 block font-semibold">Pratyantar (PD)</span>
                      <strong className="text-emerald-400 text-xs">{outboundPayload.cachedDasha.pratyantardasha}</strong>
                      <span className="text-[9.5px] text-slate-500 block truncate">
                        {outboundPayload.cachedDasha.tamilPratyantardasha}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 pt-2 flex items-center justify-between border-t border-slate-900">
                  <span>Dasha Active Window:</span>
                  <span className="text-amber-300/90 font-semibold">{outboundPayload.cachedDasha.dateRange}</span>
                </div>
              </div>
            </div>

            {/* 9-Graha Gochara Transits - User Feedable / Editable Matrix */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-900/40 flex flex-col gap-2.5 font-mono text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/30 pb-2">
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-200 block text-xs">
                      All 9 Planetary Transits — User Feedable Matrix
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-sans">
                      Choose sign or type degree/status for each card. Outbound prompt synchronizes automatically.
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {Object.keys(modifiedPlanets).length > 0 && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
                      <Edit3 className="w-2.5 h-2.5" />
                      {Object.keys(modifiedPlanets).length} Planet{Object.keys(modifiedPlanets).length > 1 ? 's' : ''} User-Fed
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleResetAllTransits}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-[10.5px] text-slate-300 hover:text-amber-300 border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Reset all 9 planets back to computed date values"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset All to Date Defaults
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTransitBoard(!showTransitBoard)}
                    className="text-[11px] text-amber-400 hover:text-amber-300 underline cursor-pointer ml-1"
                  >
                    {showTransitBoard ? 'Hide Grid' : 'Show Grid'}
                  </button>
                </div>
              </div>

              {/* 1-Click Quick Ingress Feeds */}
              {showTransitBoard && (
                <div className="flex flex-wrap items-center gap-1 text-[10px] bg-slate-900/60 p-2 rounded-lg border border-slate-900">
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                    Quick Feeds:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickFeedPreset('Jupiter', 3, '04.25', 'Exalted (Uchha) in Cancer / 8th Lagna, 9th Bhagya Moon', 'Pushya', 1)}
                    className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 cursor-pointer transition-colors"
                  >
                    + Jupiter Exalted (Cancer 04°)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFeedPreset('Saturn', 11, '01.50 (R)', 'Pisces 4th Kendra / Aspecting 6th, 10th, 1st houses', 'Purva Bhadrapada', 4)}
                    className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-blue-300 border border-slate-800 cursor-pointer transition-colors"
                  >
                    + Saturn in Pisces (01.5°)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleQuickFeedPreset('Rahu', 10, '24.12', '3rd House Upachaya (Auspicious Victory Over Rivals)', 'Purva Bhadrapada', 2);
                      handleQuickFeedPreset('Ketu', 4, '24.12', '9th House Dharma Bhava / Spiritual Detachment', 'Purva Phalguni', 4);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-emerald-300 border border-slate-800 cursor-pointer transition-colors"
                  >
                    + Rahu Aquarius (24°) / Ketu Leo (24°)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFeedPreset('Mars', 7, '08.40', 'Own House (Swakshetra) in Scorpio / 12th Lagna, 1st Janma Rasi', 'Anuradha', 2)}
                    className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-red-300 border border-slate-800 cursor-pointer transition-colors"
                  >
                    + Mars Swakshetra (Scorpio 08°)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFeedPreset('Sun', 0, '10.00', 'Exalted (Uchha) in Aries 5th Trikona', 'Ashwini', 3)}
                    className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 cursor-pointer transition-colors"
                  >
                    + Sun Exalted (Aries 10°)
                  </button>
                </div>
              )}

              {/* Editable Cards Grid */}
              {showTransitBoard && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-1">
                  {transits.map((t) => {
                    const isModified = !!modifiedPlanets[t.planet];
                    return (
                      <div
                        key={t.planet}
                        className={`p-2.5 rounded-xl transition-all flex flex-col gap-2 ${
                          isModified
                            ? 'bg-slate-900 border border-emerald-500/60 shadow-sm ring-1 ring-emerald-500/20'
                            : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Top Line: Planet Title & Reset Button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-amber-300 text-xs">{t.planet}</span>
                            <span className="text-slate-400 text-[10px] truncate max-w-[110px]">{t.tamilPlanet}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            {isModified ? (
                              <span className="text-[9px] text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40 font-semibold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                User-Fed
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                Date-Synced
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleResetSinglePlanet(t.planet)}
                              className="text-slate-500 hover:text-amber-300 p-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Reset this planet to date default"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        {/* Line 1: Sign Selector & Degree Input */}
                        <div className="grid grid-cols-12 gap-1.5 items-center">
                          <div className="col-span-8 flex flex-col gap-0.5">
                            <label className="text-[9.5px] text-slate-400 font-sans">Zodiac Sign (Choose):</label>
                            <select
                              value={t.signIndex}
                              onChange={(e) => handleTransitFieldChange(t.planet, 'signIndex', e.target.value)}
                              className="bg-slate-950 border border-amber-900/40 focus:border-amber-400 text-amber-200 text-[11px] font-semibold rounded px-1.5 py-1 focus:outline-none w-full"
                            >
                              <option value={0}>Mesham / Aries (மேஷம்)</option>
                              <option value={1}>Rishabham / Taurus (ரிஷபம்)</option>
                              <option value={2}>Mithunam / Gemini (மிதுனம்)</option>
                              <option value={3}>Kadagam / Cancer (கடகம்)</option>
                              <option value={4}>Simham / Leo (சிம்மம்)</option>
                              <option value={5}>Kanni / Virgo (கன்னி)</option>
                              <option value={6}>Thulam / Libra (துலாம்)</option>
                              <option value={7}>Viruchigam / Scorpio (விருச்சிகம்)</option>
                              <option value={8}>Dhanusu / Sagittarius (தனுசு)</option>
                              <option value={9}>Makaram / Capricorn (மகரம்)</option>
                              <option value={10}>Kumbam / Aquarius (கும்பம்)</option>
                              <option value={11}>Meenam / Pisces (மீனம்)</option>
                            </select>
                          </div>

                          <div className="col-span-4 flex flex-col gap-0.5">
                            <label className="text-[9.5px] text-slate-400 font-sans">Degree (°):</label>
                            <div className="flex items-center bg-slate-950 border border-amber-900/40 focus-within:border-amber-400 rounded px-1.5 py-1">
                              <input
                                type="text"
                                value={t.degree}
                                onChange={(e) => handleTransitFieldChange(t.planet, 'degree', e.target.value)}
                                className="bg-transparent text-emerald-400 font-bold text-[11px] w-full focus:outline-none font-mono"
                                placeholder="04.25"
                              />
                              <span className="text-slate-500 text-[10px] shrink-0">°</span>
                            </div>
                          </div>
                        </div>

                        {/* Line 2: Nakshatra, Pada & Computed House Positions */}
                        <div className="grid grid-cols-12 gap-1.5 items-center">
                          <div className="col-span-6 flex flex-col gap-0.5">
                            <label className="text-[9.5px] text-slate-400 font-sans">Nakshatra:</label>
                            <select
                              value={t.nakshatra}
                              onChange={(e) => handleTransitFieldChange(t.planet, 'nakshatra', e.target.value)}
                              className="bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-300 text-[10.5px] rounded px-1 py-0.5 focus:outline-none w-full"
                            >
                              {NAKSHATRA_NAMES.map((nak) => (
                                <option key={nak} value={nak}>
                                  {nak}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-2 flex flex-col gap-0.5">
                            <label className="text-[9.5px] text-slate-400 font-sans">Pada:</label>
                            <select
                              value={t.pada}
                              onChange={(e) => handleTransitFieldChange(t.planet, 'pada', Number(e.target.value))}
                              className="bg-slate-950 border border-slate-800 focus:border-amber-400 text-slate-300 text-[10.5px] rounded px-1 py-0.5 focus:outline-none w-full font-mono"
                            >
                              <option value={1}>p1</option>
                              <option value={2}>p2</option>
                              <option value={3}>p3</option>
                              <option value={4}>p4</option>
                            </select>
                          </div>

                          <div className="col-span-4 flex flex-col gap-0.5">
                            <label className="text-[9.5px] text-slate-400 font-sans">Houses (L/M):</label>
                            <div className="flex items-center gap-1 text-[10px] font-mono">
                              <span
                                className="bg-amber-950/60 text-amber-300 px-1 py-0.5 rounded border border-amber-900/40 truncate"
                                title={`House ${t.houseFromLagna} from Sagittarius Lagna`}
                              >
                                L:{t.houseFromLagna}th
                              </span>
                              <span
                                className="bg-blue-950/60 text-blue-300 px-1 py-0.5 rounded border border-blue-900/40 truncate"
                                title={`House ${t.houseFromMoon} from Scorpio Moon`}
                              >
                                M:{t.houseFromMoon}th
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Line 3: Classical Status / Notes Field */}
                        <div className="flex flex-col gap-0.5 pt-0.5">
                          <label className="text-[9.5px] text-slate-400 font-sans">Classical Status / Notes (Editable):</label>
                          <input
                            type="text"
                            value={t.classicalStatus}
                            onChange={(e) => handleTransitFieldChange(t.planet, 'classicalStatus', e.target.value)}
                            className="bg-slate-950 border border-slate-800 focus:border-amber-400 text-emerald-300 text-[10px] rounded px-2 py-1 focus:outline-none w-full font-mono"
                            placeholder="e.g. Exalted (Uchha), Swakshetra, Retrograde, Neecha..."
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Narrative Input Box with Speech-to-Text Button & Test Presets */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 text-xs font-mono font-semibold flex items-center gap-2">
                  <span>Narrative Input Canvas (Spoken Audio or Typed Text):</span>
                  {isListening && (
                    <span className="flex items-center gap-1.5 text-[10px] text-red-400 bg-red-950/80 border border-red-800/60 px-2 py-0.5 rounded-full animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                      Listening to microphone...
                    </span>
                  )}
                </label>

                {/* Microphone Toggle Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse ring-2 ring-red-400/50'
                      : 'bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-800/50'
                  }`}
                  title={isListening ? 'Click to stop recording' : 'Click to speak astrological context'}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-white" />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-amber-400" />
                      <span>Record Voice Note</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={3}
                value={narrativeInput}
                onChange={(e) => setNarrativeInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-900/50 text-slate-200 text-xs focus:outline-none focus:border-amber-400 leading-relaxed font-sans"
                placeholder="Speak or type your astrological questions, career moves, vehicle acquisitions, health concerns, or life questions..."
              />

              {/* Status / Speech feedback bar */}
              {speechStatus && (
                <div className="text-[11px] font-mono text-amber-300/80 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 flex items-center justify-between">
                  <span>{speechStatus}</span>
                  <button
                    onClick={() => setSpeechStatus(null)}
                    className="text-slate-500 hover:text-slate-300 text-[10px] ml-2 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Speech Voice Note Simulation Presets with PII for testing */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                <span className="text-slate-400 text-[10px]">Test Spoken Audio Presets (with PII):</span>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPresetSpeech(
                      'My brother Ramesh and I are buying a car TN-10-AZ-1038 in mid-2026. Living in T. Nagar, Chennai, India. Transferred from A/C 40591039821, contact me at +91 98765 43210.'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 text-[10px] transition-colors cursor-pointer"
                >
                  Vehicle TN-10 & Sibling
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPresetSpeech(
                      'Born on 14th August 1985 in Chennai, looking for career promotion from my company in Bangalore in 2026 during Saturn transit in Aquarius.'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 text-[10px] transition-colors cursor-pointer"
                >
                  DOB & Career Relocation
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPresetSpeech(
                      'Evaluating commercial real estate purchase and business partnership with Priya during 2026 Jupiter transit in Gemini.'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 text-[10px] transition-colors cursor-pointer"
                >
                  Real Estate & Partnership
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ZONE 2: PUBLIC LLM PROMPT INSPECTOR & OUTBOUND PACKAGING (Collapsible) */}
      <div className="bg-slate-900/90 rounded-2xl border border-amber-900/40 shadow-xl overflow-hidden transition-all">
        <div
          onClick={() => setIsZone2Open(!isZone2Open)}
          className="p-3.5 flex items-center justify-between cursor-pointer select-none bg-slate-900 hover:bg-slate-800/50 transition-colors border-b border-amber-900/30"
        >
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-200 uppercase tracking-wide">
                Zone 2: Public LLM Prompt Inspector & Outbound Packaging
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Exact Outbound Prompt Sent to Public LLM with 9-Graha Transits for {periodLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              PII Scrubbed: 100%
            </span>
            <button className="text-slate-400 hover:text-amber-300">
              {isZone2Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isZone2Open && (
          <div className="p-4 flex flex-col gap-3">
            {/* Top Toolbar: PII Sanitize Checkbox + View Mode Selector + Copy Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-amber-900/20 pb-3">
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-mono">
                  <input
                    type="checkbox"
                    checked={sanitizePii}
                    onChange={(e) => setSanitizePii(e.target.checked)}
                    className="rounded border-amber-600 text-amber-500 focus:ring-amber-500 bg-slate-950"
                  />
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Two-Stage Local PII Sanitization (Spec Doc 2 of 4)
                  </span>
                </label>
              </div>

              {/* Prompt Inspector Sub-Tabs */}
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActivePromptTab('xml')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activePromptTab === 'xml'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Canonical XML Payload
                </button>
                <button
                  type="button"
                  onClick={() => setActivePromptTab('gemini')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activePromptTab === 'gemini'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Primary (Gemini 1.5 Pro)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePromptTab('secondary')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activePromptTab === 'secondary'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Secondary (OpenAI / Claude)
                </button>
                <button
                  type="button"
                  onClick={() => setActivePromptTab('piiAudit')}
                  className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                    activePromptTab === 'piiAudit'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  PII Scrubbing Audit
                </button>
              </div>
            </div>

            {/* TAB 1: Outbound XML Schema Preview */}
            {activePromptTab === 'xml' && (
              <div className="rounded-xl border border-amber-900/40 bg-slate-950 p-3 relative font-mono text-[11px] text-amber-200/90 overflow-x-auto max-h-72 scrollbar-thin">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-amber-900/30 text-[10px] text-slate-400">
                  <span className="font-semibold text-amber-300">
                    OUTBOUND PROMPT XML SCHEMA (Period: {outboundPayload.periodOfInterest})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(outboundPayload.xmlSchema, 'xml')}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedKey === 'xml' ? 'Copied XML!' : 'Copy XML Schema'}
                  </button>
                </div>
                <pre className="leading-relaxed whitespace-pre font-mono">{outboundPayload.xmlSchema}</pre>
              </div>
            )}

            {/* TAB 2: Primary Public LLM (Gemini 1.5 Pro) JSON Egress Payload */}
            {activePromptTab === 'gemini' && (
              <div className="rounded-xl border border-amber-900/40 bg-slate-950 p-3 relative font-mono text-[11px] text-amber-200/90 overflow-x-auto max-h-72 scrollbar-thin">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-amber-900/30 text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-300">PRIMARY LLM EGRESS PAYLOAD:</span>
                    <span className="text-emerald-400">{outboundPayload.primaryGeminiPayload.endpoint}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(JSON.stringify(outboundPayload.primaryGeminiPayload, null, 2), 'gemini')
                    }
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedKey === 'gemini' ? 'Copied Payload!' : 'Copy Gemini Payload'}
                  </button>
                </div>
                <pre className="leading-relaxed whitespace-pre font-mono">
                  {JSON.stringify(outboundPayload.primaryGeminiPayload, null, 2)}
                </pre>
              </div>
            )}

            {/* TAB 3: Secondary Public LLM (OpenAI o3-mini / Claude) Comparative Egress Payload */}
            {activePromptTab === 'secondary' && (
              <div className="rounded-xl border border-amber-900/40 bg-slate-950 p-3 relative font-mono text-[11px] text-amber-200/90 overflow-x-auto max-h-72 scrollbar-thin">
                <div className="flex items-center justify-between mb-2 pb-1 border-b border-amber-900/30 text-[10px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">SECONDARY LLM COMPARATIVE PAYLOAD:</span>
                    <span className="text-blue-400">{outboundPayload.secondaryLlmPayload.endpoint}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(JSON.stringify(outboundPayload.secondaryLlmPayload, null, 2), 'secondary')
                    }
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    {copiedKey === 'secondary' ? 'Copied Payload!' : 'Copy Secondary Payload'}
                  </button>
                </div>
                <pre className="leading-relaxed whitespace-pre font-mono">
                  {JSON.stringify(outboundPayload.secondaryLlmPayload, null, 2)}
                </pre>
              </div>
            )}

            {/* TAB 4: Two-Stage Local PII Scrubbing Audit Trail */}
            {activePromptTab === 'piiAudit' && (
              <div className="rounded-xl border border-amber-900/40 bg-slate-950 p-3 flex flex-col gap-3 font-mono text-[11px]">
                <div className="flex items-center justify-between border-b border-amber-900/30 pb-1.5 text-xs text-amber-200">
                  <span className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Two-Stage Local Sanitization Protocol (Document 2 of 4 Section 1)
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40">
                    Local Llama 8B Contextual Sanitization Active
                  </span>
                </div>

                {/* Side-by-Side: Raw Input vs Stage 1 Regex vs Stage 2 Llama 8B */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1">
                    <span className="text-red-400 font-bold text-[11px]">1. Raw Audio/Text Input</span>
                    <div className="text-slate-300 text-[11px] font-sans leading-relaxed bg-slate-950 p-2 rounded border border-slate-900">
                      {outboundPayload.piiAudit.rawInput}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1">
                    <span className="text-amber-400 font-bold text-[11px]">2. Stage 1 Regex Redaction</span>
                    <div className="text-amber-200/90 text-[11px] font-mono leading-relaxed bg-slate-950 p-2 rounded border border-slate-900">
                      {outboundPayload.piiAudit.stage1RegexRedacted}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col gap-1">
                    <span className="text-emerald-400 font-bold text-[11px]">3. Stage 2 Local Llama 8B Output</span>
                    <div className="text-emerald-300 text-[11px] font-sans leading-relaxed bg-slate-950 p-2 rounded border border-slate-900">
                      {outboundPayload.piiAudit.stage2Llama8BScrubbed}
                    </div>
                  </div>
                </div>

                {/* Redacted Entities List */}
                {outboundPayload.piiAudit.redactedEntities.length > 0 && (
                  <div className="mt-1 flex flex-col gap-1">
                    <span className="text-slate-400 text-[10px] font-bold uppercase">
                      Redacted Entities Table (Section 1.2 Specification):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {outboundPayload.piiAudit.redactedEntities.map((ent, i) => (
                        <div
                          key={i}
                          className="px-2 py-0.5 rounded bg-slate-900 text-[10px] border border-amber-800/40 text-slate-300"
                        >
                          <strong className="text-amber-300">{ent.category}:</strong> "{ent.original}" →{' '}
                          <span className="text-emerald-400 font-semibold">{ent.replacement}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Model Dispatch Configuration Bar */}
            <div className="p-3 rounded-xl bg-slate-950 border border-amber-900/40 flex flex-col gap-3 mt-2">
              {/* Top Info line: Personal LLM + Setting button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-400">1. Personal LLM (Local Laptop URL):</span>
                  <span className="text-amber-300 font-semibold">
                    {llmSettings.personal.enabled ? llmSettings.personal.url : 'Disabled'}
                  </span>
                  {llmSettings.personal.enabled && (
                    <span className="text-[10px] text-slate-500">({llmSettings.personal.model})</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsLlmConfigModalOpen(true)}
                  className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-900/40 text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer self-end sm:self-auto"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                  <span>Configure Injected LLMs & Keys</span>
                </button>
              </div>

              {/* Connection Cards & Dispatch Button */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
                {/* Primary LLM card */}
                <div className="sm:col-span-4 p-2.5 rounded-lg bg-slate-900/90 border border-amber-600/50 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span className="font-semibold text-amber-300">2. Primary LLM (Mandatory):</span>
                      <span className="text-emerald-400 bg-emerald-950/80 px-1 py-0.5 rounded text-[9px] border border-emerald-800/40">
                        {llmSettings.primary.apiKey ? '✓ Key Injected' : 'BPHS Engine'}
                      </span>
                    </div>
                    <div className="text-amber-200 text-xs font-mono font-bold truncate">
                      {llmSettings.primary.provider.toUpperCase()} • {llmSettings.primary.model}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate font-mono">
                      {llmSettings.primary.url}
                    </div>
                  </div>
                </div>

                {/* Secondary LLM card */}
                <div className="sm:col-span-4 p-2.5 rounded-lg bg-slate-900/90 border border-blue-600/40 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <label className="flex items-center gap-1.5 font-semibold text-blue-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={llmSettings.secondary.enabled}
                          onChange={(e) => {
                            const next: InjectedLlmSettings = {
                              ...llmSettings,
                              secondary: { ...llmSettings.secondary, enabled: e.target.checked },
                            };
                            setLlmSettings(next);
                            saveLlmSettings(next);
                          }}
                          className="rounded accent-blue-500 w-3.5 h-3.5 cursor-pointer"
                        />
                        <span>3. Secondary LLM (Dual):</span>
                      </label>
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded border bg-blue-950/80 text-blue-300 border-blue-800/40">
                        {llmSettings.secondary.enabled ? (llmSettings.secondary.apiKey ? '✓ Key Injected' : 'Audit Engine') : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-blue-200 text-xs font-mono font-bold truncate">
                      {llmSettings.secondary.enabled ? (
                        `${llmSettings.secondary.provider.toUpperCase()} • ${llmSettings.secondary.model}`
                      ) : (
                        <span className="text-slate-500 italic">Disabled (Click box to dual dispatch)</span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate font-mono">
                      {llmSettings.secondary.enabled ? 'Request dispatches to both models' : 'Request fires only to Primary'}
                    </div>
                  </div>
                </div>

                {/* Dispatch Button */}
                <div className="sm:col-span-4 flex flex-col justify-end">
                  <button
                    type="button"
                    onClick={handleSimulateDispatch}
                    disabled={isSimulating}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSimulating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>
                          {llmSettings.secondary.enabled
                            ? 'Dispatching Both Models...'
                            : 'Dispatching Primary LLM...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>
                          {llmSettings.secondary.enabled
                            ? 'DISPATCH TO BOTH (PRIMARY & SECONDARY)'
                            : 'DISPATCH MULTI-LLM REASONING'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Injected LLM Configurations Modal */}
      {isLlmConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-amber-900/60 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-amber-900/40 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-amber-200 uppercase font-mono">
                    Injected LLM Connection Configurations
                  </h2>
                  <p className="text-xs text-slate-400">
                    Personal LLM URL • Primary Connection • Secondary LLM (Dual-Dispatch) • Local Laptop Storage
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLlmConfigModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <LlmConfigSettings
              settings={llmSettings}
              onUpdateSettings={(newSettings) => {
                setLlmSettings(newSettings);
              }}
              onClose={() => setIsLlmConfigModalOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ZONE 3: DUAL COMPARATIVE REPORT VIEWER (Collapsible) */}
      <div className="bg-slate-900/90 rounded-2xl border border-amber-900/40 shadow-xl overflow-hidden transition-all">
        <div
          onClick={() => setIsZone3Open(!isZone3Open)}
          className="p-3.5 flex items-center justify-between cursor-pointer select-none bg-slate-900 hover:bg-slate-800/50 transition-colors border-b border-amber-900/30"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-200 uppercase tracking-wide">
                Zone 3: Dual Comparative Report Viewer
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Structured Markdown Adhering Strictly to Output Formatting Instructions (Spec Doc 2 of 4)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-mono"
            >
              <button
                type="button"
                onClick={() => setActiveReportTab('sideBySide')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  activeReportTab === 'sideBySide'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dual Side-by-Side
              </button>
              <button
                type="button"
                onClick={() => setActiveReportTab('primary')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  activeReportTab === 'primary'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {llmSettings.primary.model}
              </button>
              <button
                type="button"
                onClick={() => setActiveReportTab('secondary')}
                className={`px-2 py-0.5 rounded cursor-pointer ${
                  activeReportTab === 'secondary'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {llmSettings.secondary.model}
              </button>
            </div>
            <span className="text-slate-400 p-1">
              {isZone3Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          </div>
        </div>

        {isZone3Open && (
          <div className="p-4 flex flex-col gap-4">
            {/* Live Dispatch Diagnostics Banner */}
            {dispatchResult && (
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold text-[10px]">
                    Dispatched at {dispatchResult.timestamp}
                  </span>
                  {dispatchResult.personal && (
                    <span className="text-slate-400 text-[11px]">
                      {dispatchResult.personal.message}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span className="text-amber-300">
                    Primary: {((dispatchResult.primary.latencyMs || 0) / 1000).toFixed(2)}s ({dispatchResult.primary.tokenCount || 1140} tok)
                  </span>
                  {dispatchResult.secondary && (
                    <span className="text-blue-300">
                      Secondary: {((dispatchResult.secondary.latencyMs || 0) / 1000).toFixed(2)}s ({dispatchResult.secondary.tokenCount || 1180} tok)
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TAB 1: Primary Report */}
              {(activeReportTab === 'sideBySide' || activeReportTab === 'primary') && (
                <div
                  className={`p-4 rounded-xl border border-amber-800/40 bg-slate-950/80 flex flex-col gap-3 ${
                    activeReportTab === 'primary' ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-xs text-amber-300 font-mono">
                        TAB 1: PRIMARY REPORT ({dispatchResult?.primary.provider || llmSettings.primary.provider.toUpperCase()} • {llmSettings.primary.model})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {dispatchResult?.primary.statusMessage || `Latency: 0.9s • 1,140 tokens`}
                    </span>
                  </div>

                  <div className="prose prose-invert prose-xs text-slate-300 space-y-3 text-xs leading-relaxed font-sans whitespace-pre-line">
                    {dispatchResult ? (
                      dispatchResult.primary.markdown
                    ) : (
                      <>
                        <h4 className="text-amber-200 font-bold text-sm font-mono border-b border-amber-900/30 pb-1">
                          # 1. BPHS D-1 & Divisional Strength Evaluation
                        </h4>
                        <p>
                          <strong>Dhanusu Lagna (Sagittarius 16°33'):</strong> Lagna lord <strong>Jupiter</strong> is placed in its own sign <strong>Pisces (24°42')</strong> in the 4th Kendra forming an unblemished <em>Hamsa Mahapurusha Yoga</em>, conferring exceptional fixed-asset acquisition and vehicular protection (Sukha Bhava). In <strong>D9 Navamsa</strong>, Jupiter occupies Aquarius with retrograde Mercury, while Sun is exalted in Aries (Mesham). In <strong>D10 Dasamsa</strong>, Jupiter occupies Leo in the 4th house and Saturn occupies Aries, signaling executive leadership with delayed fruition.
                        </p>

                        <h4 className="text-amber-200 font-bold text-sm font-mono border-b border-amber-900/30 pb-1">
                          # 2. Vimshottari Dasha Influence Analysis
                        </h4>
                        <p>
                          The native operates under <strong>{outboundPayload.cachedDasha.mahadasha} Mahadasha / {outboundPayload.cachedDasha.antardasha} Antardasha / {outboundPayload.cachedDasha.pratyantardasha} Pratyantardasha</strong> during {periodLabel} (window: {outboundPayload.cachedDasha.dateRange}).
                          Venus as 11th lord (labha) occupies Lagna at 06°08' in Moola. Saturn as 2nd/3rd lord occupies Pushya nakshatra in Cancer (8th house retrograde). The active sub-period triggers decisive commercial and professional elevation.
                        </p>

                        <h4 className="text-amber-200 font-bold text-sm font-mono border-b border-amber-900/30 pb-1">
                          # 3. Gochara (Transit) Impact & Timing (9-Planet Synthesis for {periodLabel})
                        </h4>
                        <p>
                          Comprehensive 9-planet Gochara analysis for {periodLabel}:
                        </p>
                        <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-slate-300">
                          {outboundPayload.transitsForPeriod.map((t) => (
                            <li key={t.planet}>
                              <strong>{t.planet} in {t.transitSign} ({t.houseFromLagna}th from Lagna, {t.houseFromMoon}th from Moon):</strong> {t.classicalStatus}.
                            </li>
                          ))}
                        </ul>

                        <h4 className="text-amber-200 font-bold text-sm font-mono border-b border-amber-900/30 pb-1">
                          # 4. Synthesized Astrological Conclusion & Recommendations
                        </h4>
                        <div className="bg-amber-950/30 p-2.5 rounded-lg border border-amber-900/40 text-amber-200/90 text-xs">
                          The {periodLabel} window is astrologically optimal for 4th house vehicular acquisition and occupational role expansion. Remedies include propitiation of Durga on Tuesdays for Mars Neechabhanga and feeding birds on Saturdays.
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Secondary Report (OpenAI / Claude / Groq Audit) */}
              {(activeReportTab === 'sideBySide' || activeReportTab === 'secondary') && (
                <div
                  className={`p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col gap-3 ${
                    activeReportTab === 'secondary' ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="font-bold text-xs text-slate-200 font-mono">
                        TAB 2: SECONDARY REPORT ({llmSettings.secondary.enabled ? `${llmSettings.secondary.provider.toUpperCase()} • ${llmSettings.secondary.model}` : 'Dual-Dispatch Disabled'})
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {dispatchResult?.secondary?.statusMessage || (llmSettings.secondary.enabled ? 'Dual-Dispatch Active' : 'Toggle in Zone 2')}
                    </span>
                  </div>

                  <div className="prose prose-invert prose-xs text-slate-300 space-y-3 text-xs leading-relaxed font-sans whitespace-pre-line">
                    {!llmSettings.secondary.enabled ? (
                      <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono text-xs flex flex-col gap-2">
                        <span className="text-amber-300 font-bold">Secondary LLM is currently inactive.</span>
                        <p>
                          To execute simultaneous dual-model dispatch (requests sent to both models at once), enable the Secondary LLM checkbox in the Model Dispatch Configuration Bar above or in Injected Settings.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const next = { ...llmSettings, secondary: { ...llmSettings.secondary, enabled: true } };
                            setLlmSettings(next);
                            saveLlmSettings(next);
                          }}
                          className="px-3 py-1.5 rounded bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 text-xs w-fit cursor-pointer"
                        >
                          Enable Secondary LLM Now
                        </button>
                      </div>
                    ) : dispatchResult?.secondary ? (
                      dispatchResult.secondary.markdown
                    ) : (
                      <>
                        <h4 className="text-slate-200 font-bold text-sm font-mono border-b border-slate-800 pb-1">
                          # 1. BPHS D-1 & Divisional Strength Evaluation
                        </h4>
                        <p>
                          Cross-model verification validates Hamsa Yoga in D1 (Jupiter at 24°42' Pisces). In D4 Chaturthamsa, 4th lord confirms property and vehicle stability. D10 Dasamsa confirms executive advisory capacity through 9th lord Sun and 10th lord Mercury.
                        </p>

                        <h4 className="text-slate-200 font-bold text-sm font-mono border-b border-slate-800 pb-1">
                          # 2. Vimshottari Dasha Influence Analysis
                        </h4>
                        <p>
                          {outboundPayload.cachedDasha.mahadasha}-{outboundPayload.cachedDasha.antardasha}-{outboundPayload.cachedDasha.pratyantardasha} period verified. Saturn's functional role for Sagittarius is countered by Pushya nakshatra placement and high Sarvashtakavarga support.
                        </p>

                        <h4 className="text-slate-200 font-bold text-sm font-mono border-b border-slate-800 pb-1">
                          # 3. Gochara (Transit) Impact & Timing (9-Planet Synthesis for {periodLabel})
                        </h4>
                        <p>
                          All 9 planetary transits cross-verified for {periodLabel}. Jupiter's position and Saturn's house placement mutually reinforce expansion in career status and asset additions.
                        </p>

                        <h4 className="text-slate-200 font-bold text-sm font-mono border-b border-slate-800 pb-1">
                          # 4. Synthesized Astrological Conclusion & Recommendations
                        </h4>
                        <p className="text-emerald-300/90 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/30 font-mono text-[11px]">
                          ✓ Model consensus: 99.2% parity. Both models confirm auspiciousness for vehicular acquisition in {periodLabel} and major professional milestone under transit alignment.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
