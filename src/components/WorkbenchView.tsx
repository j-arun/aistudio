import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  Code2,
  Send,
  Eye,
  CheckCircle,
  Copy,
  Layers,
  FileText,
  Sliders,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsDown,
  ChevronsUp,
} from 'lucide-react';

export const WorkbenchView: React.FC = () => {
  const [targetYear, setTargetYear] = useState('2026');
  const [activeDasha, setActiveDasha] = useState('Venus MD / Saturn AD (Sukran / Sani)');
  const [transitTarget, setTransitTarget] = useState('Saturn in Aquarius (Kumbam) & Jupiter in Taurus/Gemini');
  const [narrativeInput, setNarrativeInput] = useState(
    'Evaluating career shift, financial stability, and vehicle acquisition during 2026 transit in accordance with BPHS Hamsa Yoga and 10th lord combinations.'
  );
  const [sanitizePii, setSanitizePii] = useState(true);
  const [showPromptInspector, setShowPromptInspector] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState<'primary' | 'secondary' | 'sideBySide'>('sideBySide');
  const [isSimulating, setIsSimulating] = useState(false);

  // Section collapse states for screen efficiency
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

  const scrubbedBphsXml = `<?xml version="1.0" encoding="UTF-8"?>
<BPHS_Analytical_Payload>
  <Security_Envelope pii_scrubbed="true" engine="Local_Llama_8B_Sanitizer">
    <Native_Token>ANONYMIZED_001ME</Native_Token>
    <Classification>Confidential_Astrological_Egress</Classification>
  </Security_Envelope>
  
  <Temporal_Anchor>
    <Target_Year>${targetYear}</Target_Year>
    <Active_Dasha_MD>Venus</Active_Dasha_MD>
    <Active_Dasha_AD>Saturn</Active_Dasha_AD>
    <Active_Dasha_PD>Mercury</Active_Dasha_PD>
    <Transit_Configuration>${transitTarget}</Transit_Configuration>
  </Temporal_Anchor>

  <Planetary_Coordinates lagna_sign="Sagittarius" lagna_deg="16.55">
    <Graha name="Sun" sign="Capricorn" deg="11.62" nakshatra="Shravana" pada="1" house="2" />
    <Graha name="Moon" sign="Scorpio" deg="7.40" nakshatra="Anuradha" pada="2" house="12" status="Debilitated" />
    <Graha name="Mars" sign="Taurus" deg="21.38" nakshatra="Rohini" pada="4" house="6" />
    <Graha name="Mercury" sign="Capricorn" deg="5.25" nakshatra="Uttarashada" pada="3" house="2" status="Retrograde,Combust" />
    <Graha name="Jupiter" sign="Pisces" deg="24.70" nakshatra="Revati" pada="3" house="4" status="Own_Sign,Hamsa_Yoga" />
    <Graha name="Venus" sign="Sagittarius" deg="6.13" nakshatra="Moola" pada="2" house="1" />
    <Graha name="Saturn" sign="Cancer" deg="5.95" nakshatra="Pushya" pada="1" house="8" status="Retrograde" />
    <Graha name="Rahu" sign="Libra" deg="24.42" house="11" />
    <Graha name="Ketu" sign="Aries" deg="24.42" house="5" />
    <Upagraha name="Mandi" sign="Virgo" deg="14.70" house="10" />
  </Planetary_Coordinates>

  <Divisional_Charts_Scope>D1_to_D12</Divisional_Charts_Scope>
  <Sarvashtakavarga_Total>339</Sarvashtakavarga_Total>
  
  <Context_Narrative>
    <![CDATA[${narrativeInput}]]>
  </Context_Narrative>
</BPHS_Analytical_Payload>`;

  const handleSimulateDispatch = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setIsZone3Open(true);
    }, 800);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-3 sm:py-5 flex flex-col gap-4">
      {/* Workbench Screen Master Efficiency Bar */}
      <div className="flex items-center justify-between bg-slate-900/80 px-3.5 py-2 rounded-xl border border-amber-900/30 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold text-amber-200">Component 3: Workbench Screen (Synthesis & Reasoning)</span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-emerald-400 hidden sm:inline text-[11px]">Egress-Only Sandbox</span>
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
                Pin astrological analysis to point in time (Year, Month, Dasha, Major Transits)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isZone1Open && (
              <span className="text-[10px] font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-900/40">
                Year: {targetYear} • Venus MD / Saturn AD
              </span>
            )}
            <button className="text-slate-400 hover:text-amber-300">
              {isZone1Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isZone1Open && (
          <div className="p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Target Year:</label>
                <input
                  type="text"
                  value={targetYear}
                  onChange={(e) => setTargetYear(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-amber-900/50 text-amber-200 focus:outline-none focus:border-amber-400 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Active Dasha Period:</label>
                <input
                  type="text"
                  value={activeDasha}
                  onChange={(e) => setActiveDasha(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-amber-900/50 text-amber-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[11px] mb-1 font-semibold">Transit Target:</label>
                <input
                  type="text"
                  value={transitTarget}
                  onChange={(e) => setTransitTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-amber-900/50 text-amber-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[11px] mb-1 font-mono">
                Narrative Input Box (Spoken / Typed Context):
              </label>
              <textarea
                rows={2}
                value={narrativeInput}
                onChange={(e) => setNarrativeInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-amber-900/50 text-slate-200 text-xs focus:outline-none focus:border-amber-400 leading-relaxed font-sans"
                placeholder="Enter specific life domains, questions, or transits to evaluate..."
              />
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
                Zone 2: Prompt Inspector & Model Dispatch Control
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Sanitized JSON/XML payload verification • Multi-LLM Routing
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              Primary: Gemini 1.5 Pro
            </span>
            <button className="text-slate-400 hover:text-amber-300">
              {isZone2Open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isZone2Open && (
          <div className="p-4 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-mono">
                <input
                  type="checkbox"
                  checked={sanitizePii}
                  onChange={(e) => setSanitizePii(e.target.checked)}
                  className="rounded border-amber-600 text-amber-500 focus:ring-amber-500 bg-slate-950"
                />
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Sanitize PII via Local Llama 8B
                </span>
              </label>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPromptInspector(!showPromptInspector);
                }}
                className="text-amber-400 hover:text-amber-300 flex items-center gap-1 text-[11px] font-mono underline"
              >
                {showPromptInspector ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Hide Scrubbed BPHS Payload XML
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> Inspect Scrubbed BPHS Payload XML
                  </>
                )}
              </button>
            </div>

            {/* Collapsible Prompt Inspector */}
            {showPromptInspector && (
              <div className="rounded-xl border border-amber-900/40 bg-slate-950 p-3 relative font-mono text-[11px] text-amber-200/90 overflow-x-auto max-h-48 scrollbar-thin">
                <div className="absolute top-2 right-2 flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40">
                    PII Scrubbed: 100%
                  </span>
                </div>
                <pre className="leading-tight">{scrubbedBphsXml}</pre>
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
                  <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1 rounded">BPHS Trained</span>
                </div>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[10px] text-slate-400 font-mono mb-1 font-semibold">
                  Secondary LLM (Optional):
                </label>
                <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono flex items-center justify-between">
                  <span>OpenAI o3-mini / Claude</span>
                  <span className="text-[10px] text-slate-500">Comparative</span>
                </div>
              </div>

              <div className="sm:col-span-4 self-end">
                <button
                  onClick={handleSimulateDispatch}
                  disabled={isSimulating}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
                >
                  {isSimulating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing Models...</span>
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
                Side-by-side simultaneous Markdown audit from Primary & Secondary LLMs
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
                <div className={`p-4 rounded-xl border border-amber-800/40 bg-slate-950/80 flex flex-col gap-3 ${activeReportTab === 'primary' ? 'md:col-span-2' : ''}`}>
                  <div className="flex items-center justify-between border-b border-amber-900/30 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-xs text-amber-300 font-mono">
                        TAB 1: PRIMARY REPORT (Google Gemini 1.5 Pro)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Latency: 1.2s • 840 tokens</span>
                  </div>

                  <div className="prose prose-invert prose-xs text-slate-300 space-y-2 text-xs leading-relaxed">
                    <h4 className="text-amber-200 font-semibold text-sm">
                      1. Temporal Anchor & Dasha Matrix (2026 Analysis)
                    </h4>
                    <p>
                      In 2026, the native experiences the pivotal <strong>Sukran Mahadasha (Venus) / Sani Antardasha (Saturn)</strong>.
                      Venus sits exalted in purpose in Dhanusu Lagna at 06°08' commanding the 6th and 11th houses, while Saturn is retrograde in the 8th house (Cancer) at 05°57' in Pushya nakshatra.
                    </p>

                    <h4 className="text-amber-200 font-semibold text-sm">
                      2. Hamsa Yoga & 10th House Governance
                    </h4>
                    <p>
                      <strong>Jupiter in Pisces (Meenam 24°42')</strong> forms an unblemished <em>Hamsa Mahapurusha Yoga</em> in the 4th Kendra.
                      This strongly guards vehicle acquisitions and real-estate investments. The conjunction of 9th lord Sun and 10th lord retrograde Mercury in the 2nd house (Makaram) delivers authoritative <strong>Dharma-Karmadhipati Yoga</strong> for career elevation.
                    </p>

                    <h4 className="text-amber-200 font-semibold text-sm">
                      3. Saturn in Aquarius (Kumbam) Transit Synthesis
                    </h4>
                    <p>
                      Saturn transiting the 3rd house from Lagna (Aquarius / Kumbam) aspects the 5th, 9th, and 12th houses.
                      With <strong>31 Sarvashtakavarga bindus</strong> in Aquarius and <strong>35 in Scorpio</strong>, the transit provides decisive breakthrough in professional standing with high longevity assurance.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 2: Secondary Report (OpenAI o3-mini / Claude) */}
              {(activeReportTab === 'sideBySide' || activeReportTab === 'secondary') && (
                <div className={`p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col gap-3 ${activeReportTab === 'secondary' ? 'md:col-span-2' : ''}`}>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="font-bold text-xs text-slate-200 font-mono">
                        TAB 2: SECONDARY REPORT (OpenAI o3-mini / Claude Audit)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Comparative Audit</span>
                  </div>

                  <div className="prose prose-invert prose-xs text-slate-300 space-y-2 text-xs leading-relaxed">
                    <h4 className="text-slate-200 font-semibold text-sm">
                      1. Dasha-Gochar Cross-Validation
                    </h4>
                    <p>
                      Concurrent analysis confirms Venus-Saturn period. Saturn's natural functional enmity as 2nd/3rd lord for Sagittarius Lagna is heavily mitigated by its occupation of benefic Pushya star and high Sarvashtakavarga support in transit signs.
                    </p>

                    <h4 className="text-slate-200 font-semibold text-sm">
                      2. Divisional Confirmation (D10 Dasamsa & D4 Chaturthamsa)
                    </h4>
                    <p>
                      In <strong>D10 Dasamsa</strong>, Jupiter occupies Leo in the 4th house while Mercury rules the 2nd and 5th houses, affirming executive advisory roles.
                      In <strong>D4 Chaturthamsa</strong>, 4th lord Jupiter confers vehicular stability despite minor initial documentation delays.
                    </p>

                    <h4 className="text-slate-200 font-semibold text-sm">
                      3. Comparative Discrepancy Flag
                    </h4>
                    <p className="text-amber-300/90 bg-amber-950/30 p-2 rounded border border-amber-900/30 font-mono text-[11px]">
                      ✓ Model consensus: 98.4% alignment on professional elevation. Primary LLM identifies earlier vehicle acquisition window in mid-2026.
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
