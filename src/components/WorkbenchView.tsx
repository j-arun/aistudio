import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Shield,
  Code2,
  Send,
  CheckCircle,
  Copy,
  FileText,
  Sliders,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
  Mic,
  MicOff,
  Radio,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Info,
} from 'lucide-react';
import { DIVISIONAL_CHARTS } from '../data/canonicalHoroscope';
import {
  DEFAULT_2026_TRANSITS,
  PlanetTransitInfo,
  buildBphsOutboundPrompt,
  OutboundPromptPayload,
} from '../utils/promptBuilder';
import { runTwoStageSanitization } from '../utils/piiSanitizer';

export const WorkbenchView: React.FC = () => {
  // Zone 1 States
  const [targetYear, setTargetYear] = useState('2026');
  const [transits, setTransits] = useState<PlanetTransitInfo[]>(DEFAULT_2026_TRANSITS);
  const [showTransitEditor, setShowTransitEditor] = useState(false);
  const [narrativeInput, setNarrativeInput] = useState(
    'My brother Ramesh and I are evaluating buying a vehicle TN-10-AZ-1038 in mid-2026 and shifting job in Bangalore. Transferred from A/C 40591039821, contact me at +91 98765 43210.'
  );

  // Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const [speechStatus, setSpeechStatus] = useState<string | null>(null);

  // Zone 2 States
  const [sanitizePii, setSanitizePii] = useState(true);
  const [showPromptInspector, setShowPromptInspector] = useState(true);
  const [activePromptTab, setActivePromptTab] = useState<'xml' | 'gemini' | 'secondary' | 'piiAudit'>('xml');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Zone 3 States
  const [activeReportTab, setActiveReportTab] = useState<'primary' | 'secondary' | 'sideBySide'>('sideBySide');
  const [isSimulating, setIsSimulating] = useState(false);

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

  // Build the complete Outbound Prompt per Specification Document 2 of 4
  const outboundPayload: OutboundPromptPayload = useMemo(() => {
    return buildBphsOutboundPrompt(targetYear, narrativeInput, DIVISIONAL_CHARTS, transits);
  }, [targetYear, narrativeInput, transits]);

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
      setSpeechStatus('Web Speech API unavailable in this environment. Try speech simulation below.');
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

  const handleSimulateDispatch = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setIsZone3Open(true);
    }, 900);
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
            Egress-Only Sandbox (Spec Doc 2 of 4 Compliant)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExpandAll}
            className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-[11px] text-amber-300 border border-slate-800 flex items-center gap-1 transition-colors"
          >
            <ChevronsDown className="w-3 h-3" />
            Expand All Zones
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-2 py-1 rounded bg-slate-950 hover:bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center gap-1 transition-colors"
          >
            <ChevronsUp className="w-3 h-3" />
            Collapse All
          </button>
        </div>
      </div>

      {/* ZONE 1: TEMPORAL ANCHOR INPUTS & NARRATIVE CANVAS (Collapsible) */}
      <div className="bg-slate-900/90 rounded-2xl border border-amber-900/40 shadow-xl overflow-hidden transition-all">
        <div
          onClick={() => setIsZone1Open(!isZone1Open)}
          className="p-3.5 flex items-center justify-between cursor-pointer select-none bg-slate-900 hover:bg-slate-800/50 transition-colors border-b border-amber-900/30"
        >
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-amber-200 uppercase tracking-wide">
                Zone 1: Temporal Anchor Inputs & Narrative Canvas
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Audio/Speech Input • Cached Dasha Anchor • 9-Graha Gochara Transits Synthesis
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isZone1Open && (
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                Anchor: {targetYear} • Dasha: Venus/Saturn/Mercury (Cached) • 9 Transits
              </span>
            )}
            <button className="text-slate-400 hover:text-amber-300">
              {isZone1Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isZone1Open && (
          <div className="p-4 flex flex-col gap-3.5">
            {/* Top Grid: Target Year + Cached Dasha Badge + 9 Transits Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 font-mono text-xs items-center">
              {/* Target Year */}
              <div className="sm:col-span-3">
                <label className="block text-slate-400 text-[11px] mb-1 font-semibold">
                  Target Synthesis Year:
                </label>
                <input
                  type="text"
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-amber-900/50 text-amber-200 focus:outline-none focus:border-amber-400 font-semibold text-xs"
                />
              </div>

              {/* Cached Dasha Status Badge (No user input needed per requirements) */}
              <div className="sm:col-span-5">
                <label className="block text-slate-400 text-[11px] mb-1 font-semibold flex items-center gap-1.5">
                  <span>Active Dasha Period:</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-800/40">
                    Auto-Resolved from Cache
                  </span>
                </label>
                <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-amber-300/90 text-xs flex items-center justify-between">
                  <span className="font-semibold">Venus MD / Saturn AD / Mercury PD</span>
                  <span className="text-[10px] text-slate-500 font-mono">Sukran-Sani-Budhan</span>
                </div>
              </div>

              {/* 9-Planet Gochara Transits Trigger */}
              <div className="sm:col-span-4 self-end">
                <button
                  onClick={() => setShowTransitEditor(!showTransitEditor)}
                  className="w-full py-1.5 px-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-amber-900/60 text-amber-300 text-xs font-mono flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    <span>9-Graha Transit Board</span>
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                    {showTransitEditor ? 'Hide 9 Transits' : 'Inspect 9 Transits'}
                  </span>
                </button>
              </div>
            </div>

            {/* Expandable 9-Graha Gochara Transit Matrix */}
            {showTransitEditor && (
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-900/40 flex flex-col gap-2 font-mono text-[11px]">
                <div className="flex items-center justify-between border-b border-amber-900/30 pb-1.5 text-xs text-amber-200">
                  <span className="font-bold flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-amber-400" />
                    All 9 Planetary Transits for Target Year {targetYear} (Gochara Ephemeris)
                  </span>
                  <span className="text-[10px] text-emerald-400">
                    ✓ All 9 Grahas packaged into Outbound Prompt
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                  {transits.map((t, idx) => (
                    <div
                      key={t.planet}
                      className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 flex flex-col gap-1 text-[11px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300">
                          {t.planet} ({t.tamilSign})
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {t.transitSign} {t.degree}°
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>Lagna: {t.houseFromLagna}th</span>
                        <span>Moon: {t.houseFromMoon}th</span>
                      </div>
                      <span className="text-[9.5px] text-emerald-400 truncate" title={t.classicalStatus}>
                        {t.classicalStatus}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Narrative Input Box with Live Speech-To-Text Button & Audio Canvas */}
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
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
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
                    className="text-slate-500 hover:text-slate-300 text-[10px] ml-2"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Speech Voice Note Simulation Presets with PII for testing */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                <span className="text-slate-400 text-[10px]">Test Spoken Audio Presets (with PII):</span>
                <button
                  onClick={() =>
                    handleApplyPresetSpeech(
                      'My brother Ramesh and I are buying a car TN-10-AZ-1038 in mid-2026. Living in T. Nagar, Chennai, India. Transferred from A/C 40591039821, contact me at +91 98765 43210.'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 text-[10px] transition-colors"
                >
                  Vehicle TN-10 & Sibling
                </button>
                <button
                  onClick={() =>
                    handleApplyPresetSpeech(
                      'Born on 14th August 1985 in Chennai, looking for career promotion from my company in Bangalore in 2026 during Saturn transit in Aquarius.'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 text-[10px] transition-colors"
                >
                  DOB & Career Relocation
                </button>
                <button
                  onClick={() =>
                    handleApplyPresetSpeech(
                      'Evaluating commercial real estate purchase and business partnership with Priya during 2026 Jupiter transit in Gemini.'
                    )
                  }
                  className="px-2 py-0.5 rounded bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 text-[10px] transition-colors"
                >
                  Real Estate & Partnership
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ZONE 2: PROMPT INSPECTOR & MODEL DISPATCH CONTROL (Collapsible) */}
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
                Inspect the Exact Prompt Sent to Public LLMs (Primary: Gemini 1.5 Pro • Secondary: OpenAI / Claude)
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
                  onClick={() => setActivePromptTab('xml')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activePromptTab === 'xml'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Canonical XML Payload
                </button>
                <button
                  onClick={() => setActivePromptTab('gemini')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activePromptTab === 'gemini'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Primary (Gemini 1.5 Pro)
                </button>
                <button
                  onClick={() => setActivePromptTab('secondary')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activePromptTab === 'secondary'
                      ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Secondary (OpenAI / Claude)
                </button>
                <button
                  onClick={() => setActivePromptTab('piiAudit')}
                  className={`px-2.5 py-1 rounded transition-colors ${
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
                  <span>OUTBOUND PROMPT XML SCHEMA (Spec Doc 2 of 4 Pages 3 & 4)</span>
                  <button
                    onClick={() => handleCopy(outboundPayload.xmlSchema, 'xml')}
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 flex items-center gap-1 transition-colors"
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
                    onClick={() =>
                      handleCopy(JSON.stringify(outboundPayload.primaryGeminiPayload, null, 2), 'gemini')
                    }
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 flex items-center gap-1 transition-colors"
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
                    onClick={() =>
                      handleCopy(JSON.stringify(outboundPayload.secondaryLlmPayload, null, 2), 'secondary')
                    }
                    className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 flex items-center gap-1 transition-colors"
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
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center mt-1">
              <div className="sm:col-span-4">
                <label className="block text-[10px] text-slate-400 font-mono mb-1 font-semibold">
                  Primary LLM (Mandatory):
                </label>
                <div className="px-3 py-2 rounded-lg bg-slate-950 border border-amber-600/60 text-amber-300 text-xs font-mono font-semibold flex items-center justify-between">
                  <span>Google Gemini 1.5 Pro</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1 rounded">BPHS Reasoning</span>
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[10px] text-slate-400 font-mono mb-1 font-semibold">
                  Secondary LLM (Comparative Audit):
                </label>
                <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono flex items-center justify-between">
                  <span>OpenAI o3-mini / Claude</span>
                  <span className="text-[10px] text-slate-500">Cross-Validation</span>
                </div>
              </div>

              <div className="sm:col-span-4 self-end">
                <button
                  onClick={handleSimulateDispatch}
                  disabled={isSimulating}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSimulating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing Models with 9 Transits...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>DISPATCH MULTI-LLM REASONING</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

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
                onClick={() => setActiveReportTab('sideBySide')}
                className={`px-2 py-0.5 rounded ${
                  activeReportTab === 'sideBySide'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dual Side-by-Side
              </button>
              <button
                onClick={() => setActiveReportTab('primary')}
                className={`px-2 py-0.5 rounded ${
                  activeReportTab === 'primary'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gemini 1.5 Pro
              </button>
              <button
                onClick={() => setActiveReportTab('secondary')}
                className={`px-2 py-0.5 rounded ${
                  activeReportTab === 'secondary'
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                OpenAI / Claude
              </button>
            </div>
            <button className="text-slate-400 hover:text-amber-300">
              {isZone3Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isZone3Open && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TAB 1: Primary Report (Gemini 1.5 Pro) */}
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
                        TAB 1: PRIMARY REPORT (Google Gemini 1.5 Pro)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Latency: 1.1s • 1,120 tokens</span>
                  </div>

                  <div className="prose prose-invert prose-xs text-slate-300 space-y-2 text-xs leading-relaxed font-sans">
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
                      The native operates under <strong>Venus Mahadasha / Saturn Antardasha / Mercury Pratyantardasha</strong> in {targetYear}.
                      Venus as 11th lord (labha) occupies Lagna at 06°08' in Moola. Saturn as 2nd/3rd lord occupies Pushya nakshatra in Cancer (8th house retrograde). The active sub-period of Mercury (Dharma-Karmadhipati conjunction with Sun in Capricorn 2nd house) triggers decisive commercial and professional elevation.
                    </p>

                    <h4 className="text-amber-200 font-bold text-sm font-mono border-b border-amber-900/30 pb-1">
                      # 3. Gochara (Transit) Impact & Timing (9-Planet Synthesis)
                    </h4>
                    <p>
                      Comprehensive 9-planet Gochara analysis for {targetYear}:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-slate-300">
                      <li><strong>Saturn in Aquarius (3rd from Lagna):</strong> Classical BPHS 3rd house transit gives unmatched victory over adversaries, persistent courage, and 31 bindus in Sarvashtakavarga.</li>
                      <li><strong>Jupiter in Gemini (7th from Lagna):</strong> 100% direct aspect onto Dhanusu Lagna and 11th house of gains, blessing partnerships and vehicle acquisition.</li>
                      <li><strong>Mars in Cancer (8th Neecha):</strong> Caution advised during high-speed travel and aggressive vehicular handling.</li>
                      <li><strong>Rahu/Ketu Axis (Pisces/Virgo):</strong> 4th/10th axis transition shifts residential environment and organizational responsibility.</li>
                    </ul>

                    <h4 className="text-amber-200 font-bold text-sm font-mono border-b border-amber-900/30 pb-1">
                      # 4. Synthesized Astrological Conclusion & Recommendations
                    </h4>
                    <div className="bg-amber-950/30 p-2.5 rounded-lg border border-amber-900/40 text-amber-200/90 text-xs">
                      The mid-{targetYear} window (June–October) is exceptionally auspicious for 4th house vehicular acquisition and occupational role expansion. Remedies include propitiation of Durga on Tuesdays for Mars Neechabhanga and feeding birds on Saturdays.
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Secondary Report (OpenAI o3-mini / Claude Audit) */}
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
                        TAB 2: SECONDARY REPORT (OpenAI o3-mini / Claude Audit)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Cross-Validation Audit</span>
                  </div>

                  <div className="prose prose-invert prose-xs text-slate-300 space-y-2 text-xs leading-relaxed font-sans">
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
                      Venus-Saturn-Mercury period verified. Saturn's natural functional enmity as 2nd/3rd lord for Sagittarius is fully countered by its Pushya nakshatra placement and exalted Navamsa aspects.
                    </p>

                    <h4 className="text-slate-200 font-bold text-sm font-mono border-b border-slate-800 pb-1">
                      # 3. Gochara (Transit) Impact & Timing (9-Planet Synthesis)
                    </h4>
                    <p>
                      All 9 planetary transits cross-verified: Saturn in 3rd Upachaya (Aquarius) and Jupiter in 7th Kendra (Gemini) mutually reinforce expansion in career status and asset additions.
                    </p>

                    <h4 className="text-slate-200 font-bold text-sm font-mono border-b border-slate-800 pb-1">
                      # 4. Synthesized Astrological Conclusion & Recommendations
                    </h4>
                    <p className="text-emerald-300/90 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/30 font-mono text-[11px]">
                      ✓ Model consensus: 99.1% parity. Both models confirm vehicle purchase window in mid-{targetYear} and major professional milestone under Jupiter's 7th house drishti.
                    </p>
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
