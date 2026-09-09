import React, { useState, useEffect } from 'react';
import {
  Server,
  Key,
  Globe,
  Sliders,
  Check,
  AlertCircle,
  RotateCcw,
  Eye,
  EyeOff,
  Cpu,
  Zap,
  Sparkles,
  Layers,
  Save,
  Laptop,
} from 'lucide-react';
import {
  InjectedLlmSettings,
  DEFAULT_LLM_SETTINGS,
  saveLlmSettings,
  testEndpointConnection,
} from '../utils/llmService';

interface LlmConfigSettingsProps {
  settings: InjectedLlmSettings;
  onUpdateSettings: (newSettings: InjectedLlmSettings) => void;
  onClose?: () => void;
}

export const LlmConfigSettings: React.FC<LlmConfigSettingsProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const [formData, setFormData] = useState<InjectedLlmSettings>(settings);

  // Sync state if external settings change and migrate truly deprecated primary aliases.
  useEffect(() => {
    let cleanSettings = { ...settings };
    const deprecated = ['1.5-pro', '1.5-flash', '2.0-flash', '2.0-pro'];
    if (
      deprecated.some((d) => cleanSettings.primary.model.includes(d)) ||
      deprecated.some((d) => cleanSettings.primary.url.includes(d))
    ) {
      cleanSettings = {
        ...cleanSettings,
        primary: {
          ...cleanSettings.primary,
          model: 'gemini-2.5-flash',
          url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        },
      };
      saveLlmSettings(cleanSettings);
      onUpdateSettings(cleanSettings);
    }
    setFormData(cleanSettings);
  }, [settings]);

  const [showPrimaryKey, setShowPrimaryKey] = useState(false);
  const [showSecondaryKey, setShowSecondaryKey] = useState(false);
  const [showPersonalKey, setShowPersonalKey] = useState(false);

  // Testing states
  const [testingPersonal, setTestingPersonal] = useState(false);
  const [personalTestResult, setPersonalTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [testingPrimary, setTestingPrimary] = useState(false);
  const [primaryTestResult, setPrimaryTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [testingSecondary, setTestingSecondary] = useState(false);
  const [secondaryTestResult, setSecondaryTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Handlers for Personal LLM
  const handlePersonalChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      personal: { ...prev.personal, [field]: value },
    }));
  };

  // Handlers for Primary LLM
  const handlePrimaryChange = (field: string, value: any) => {
    let cleanVal = value;
    if (field === 'apiKey' && typeof value === 'string') {
      cleanVal = value.trim().replace(/^["']|["']$/g, '');
    }
    setFormData((prev) => {
      const updatedPrimary = { ...prev.primary, [field]: cleanVal };
      // If a legacy model is still selected when a key is entered, use the current alias.
      if (field === 'apiKey' && updatedPrimary.model.includes('1.5-pro')) {
        updatedPrimary.model = 'gemini-flash-latest';
        updatedPrimary.url =
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';
      }
      return {
        ...prev,
        primary: updatedPrimary,
      };
    });
  };

  // Handlers for Secondary LLM
  const handleSecondaryChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      secondary: { ...prev.secondary, [field]: value },
    }));
  };

  const handleSave = () => {
    saveLlmSettings(formData);
    onUpdateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    setFormData(DEFAULT_LLM_SETTINGS);
    saveLlmSettings(DEFAULT_LLM_SETTINGS);
    onUpdateSettings(DEFAULT_LLM_SETTINGS);
    setPersonalTestResult(null);
    setPrimaryTestResult(null);
    setSecondaryTestResult(null);
  };

  const runPersonalTest = async () => {
    setTestingPersonal(true);
    setPersonalTestResult(null);
    const res = await testEndpointConnection('personal', formData);
    setPersonalTestResult(res);
    setTestingPersonal(false);
  };

  const runPrimaryTest = async () => {
    setTestingPrimary(true);
    setPrimaryTestResult(null);
    const res = await testEndpointConnection('primary', formData);
    if (res.detectedModel && res.detectedModel !== formData.primary.model) {
      // Auto-update to the working model accepted by Google
      const updated = {
        ...formData,
        primary: {
          ...formData.primary,
          model: res.detectedModel,
          url: `https://generativelanguage.googleapis.com/v1beta/models/${res.detectedModel}:generateContent`,
        },
      };
      setFormData(updated);
      saveLlmSettings(updated);
      onUpdateSettings(updated);
    }
    setPrimaryTestResult(res);
    setTestingPrimary(false);
  };

  const runSecondaryTest = async () => {
    setTestingSecondary(true);
    setSecondaryTestResult(null);
    const res = await testEndpointConnection('secondary', formData);
    setSecondaryTestResult(res);
    setTestingSecondary(false);
  };

  return (
    <div className="flex flex-col gap-6 text-slate-100 font-sans">
      {/* Top Banner Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Laptop className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-amber-200 text-sm flex items-center gap-1.5">
              <span>In-App Injected LLM Connection Configurations</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800/40 font-mono">
                Local Laptop Storage
              </span>
            </div>
            <p className="text-slate-400 text-xs">
              Directly inject your local Personal LLM URL, Primary Gemini credentials, and Secondary LLM settings. If Secondary is active, reasoning requests go to both.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 border border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-slate-950" />
                <span>Saved to Laptop!</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Injected Config</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 1: Personal LLM URL (Local Edge Inference / PII Sanitizer) */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-900/40 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/30 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Cpu className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-amber-300 text-sm font-mono flex items-center gap-2">
                1. Personal LLM URL (Local Edge / Private Inference)
              </h3>
              <span className="text-[11px] text-slate-400">
                Executes locally on your laptop via Ollama, vLLM, or LM Studio for edge PII scrubbing and pre-filtering.
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.personal.enabled}
              onChange={(e) => handlePersonalChange('enabled', e.target.checked)}
              className="rounded accent-amber-500 w-4 h-4 cursor-pointer"
            />
            <span>Enable Personal LLM</span>
          </label>
        </div>

        {formData.personal.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            {/* URL Input */}
            <div className="md:col-span-8 flex flex-col gap-1">
              <label className="text-xs font-mono text-slate-300 font-semibold flex items-center justify-between">
                <span>Personal LLM Server URL:</span>
                <span className="text-[10px] text-slate-500">Must be reachable from your browser / localhost</span>
              </label>
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-amber-400">
                <Globe className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type="text"
                  value={formData.personal.url}
                  onChange={(e) => handlePersonalChange('url', e.target.value)}
                  className="bg-transparent text-amber-200 text-xs w-full focus:outline-none font-mono"
                  placeholder="http://localhost:11434/v1"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] font-mono">
                <span className="text-slate-500">Presets:</span>
                <button
                  type="button"
                  onClick={() => handlePersonalChange('url', 'http://localhost:11434/v1')}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  Ollama (11434)
                </button>
                <button
                  type="button"
                  onClick={() => handlePersonalChange('url', 'http://127.0.0.1:8000/v1')}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  vLLM (8000)
                </button>
                <button
                  type="button"
                  onClick={() => handlePersonalChange('url', 'http://localhost:1234/v1')}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  LM Studio (1234)
                </button>
                <button
                  type="button"
                  onClick={() => handlePersonalChange('url', 'http://localhost:8080/v1')}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
                >
                  llama.cpp (8080)
                </button>
              </div>
            </div>

            {/* Model Name */}
            <div className="md:col-span-4 flex flex-col gap-1">
              <label className="text-xs font-mono text-slate-300 font-semibold">Local Model Tag:</label>
              <input
                type="text"
                value={formData.personal.model}
                onChange={(e) => handlePersonalChange('model', e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:border-amber-400 text-slate-200 text-xs font-mono focus:outline-none"
                placeholder="llama3.1:8b"
              />
              <span className="text-[10px] text-slate-500 font-mono">e.g. llama3.1:8b, mistral, qwen2.5</span>
            </div>

            {/* Optional Bearer / API key */}
            <div className="md:col-span-6 flex flex-col gap-1">
              <label className="text-xs font-mono text-slate-300 font-semibold flex items-center justify-between">
                <span>Personal Auth Key (Optional):</span>
                <span className="text-[10px] text-slate-500">Leave blank for open local Ollama</span>
              </label>
              <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-amber-400">
                <Key className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                <input
                  type={showPersonalKey ? 'text' : 'password'}
                  value={formData.personal.apiKey || ''}
                  onChange={(e) => handlePersonalChange('apiKey', e.target.value)}
                  className="bg-transparent text-slate-200 text-xs w-full focus:outline-none font-mono"
                  placeholder="Optional local token..."
                />
                <button
                  type="button"
                  onClick={() => setShowPersonalKey(!showPersonalKey)}
                  className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                >
                  {showPersonalKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Pipeline Role & Ping Button */}
            <div className="md:col-span-6 flex items-end gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <label className="text-xs font-mono text-slate-300 font-semibold">Local Pipeline Role:</label>
                <select
                  value={formData.personal.pipelineRole}
                  onChange={(e) => handlePersonalChange('pipelineRole', e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:border-amber-400 text-slate-200 text-xs font-mono focus:outline-none"
                >
                  <option value="pii_sanitization">PII Scrubbing & Entity Masking</option>
                  <option value="edge_synthesis">Edge Astrological Verification</option>
                  <option value="both">Both (Scrubbing + Verification)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={runPersonalTest}
                disabled={testingPersonal}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
              >
                {testingPersonal ? (
                  <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>Test Local Ping</span>
              </button>
            </div>

            {/* Test result message */}
            {personalTestResult && (
              <div
                className={`md:col-span-12 p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                  personalTestResult.success
                    ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                    : 'bg-amber-950/60 border border-amber-900/60 text-amber-200'
                }`}
              >
                {personalTestResult.success ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span>{personalTestResult.message}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 2: Primary LLM Connection Settings */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-900/40 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/30 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-amber-300 text-sm font-mono flex items-center gap-2">
                2. Primary LLM Connection Settings (Mandatory Deep Synthesis)
              </h3>
              <span className="text-[11px] text-slate-400">
                Executes the authoritative Brihat Parasara Hora Sastra (BPHS) divisional chart and 9-graha transit synthesis.
              </span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
            Default: Google Gemini 2.5 Flash
          </div>
        </div>

        {/* Gemini 1.5 Pro Deprecation Warning & 1-Click Fix */}
        {(formData.primary.model.includes('gemini-1.5-pro') || formData.primary.url.includes('gemini-1.5-pro')) && (
          <div className="p-3 rounded-lg bg-amber-950/60 border border-amber-600/70 text-amber-200 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-amber-300 font-bold">Action Required: Gemini 1.5 Pro is Retired (HTTP 404)</strong>
                <p className="text-[11px] text-amber-200/85 mt-0.5">
                  Google has retired <code className="text-amber-300 bg-amber-900/50 px-1 py-0.5 rounded">gemini-1.5-pro</code> in the Generative Language API. Click below to switch to the active <code className="text-emerald-300 bg-emerald-950 px-1 py-0.5 rounded font-bold">gemini-2.5-flash</code> model.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  primary: {
                    ...prev.primary,
                    model: 'gemini-flash-latest',
                    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
                  },
                }));
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs whitespace-nowrap shadow transition-all cursor-pointer shrink-0"
            >
              ⚡ Fix: Switch to Gemini 2.5 Flash
            </button>
          </div>
        )}

        {/* Quick Gemini Model Presets */}
        {formData.primary.provider === 'gemini' && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 text-[11px] font-semibold mr-1">Gemini Presets:</span>
            {[
              { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Highest Stability)', desc: 'Rock-solid canonical Parashari synthesis' },
              { id: 'gemini-flash-latest', label: 'Gemini Flash Latest', desc: 'Current Gemini Flash model alias' },
              { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', desc: 'Next-gen reasoning and fast generation' },
              { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite', desc: 'High availability, resilient under heavy traffic' },
              { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview', desc: 'Deep multi-divisional chart synthesis' },
            ].map((p) => {
              const isActive = formData.primary.model === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    handlePrimaryChange('model', p.id);
                    handlePrimaryChange(
                      'url',
                      `https://generativelanguage.googleapis.com/v1beta/models/${p.id}:generateContent`
                    );
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-amber-200 border-slate-700'
                  }`}
                  title={p.desc}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Provider Selector */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-xs font-mono text-slate-300 font-semibold">Primary Provider:</label>
            <select
              value={formData.primary.provider}
              onChange={(e) => {
                const prov = e.target.value as any;
                handlePrimaryChange('provider', prov);
                if (prov === 'gemini') {
                  handlePrimaryChange(
                    'url',
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'
                  );
                  handlePrimaryChange('model', 'gemini-flash-latest');
                } else if (prov === 'openai') {
                  handlePrimaryChange('url', 'https://api.openai.com/v1/chat/completions');
                  handlePrimaryChange('model', 'gpt-4o');
                }
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:border-amber-400 text-amber-200 text-xs font-mono focus:outline-none"
            >
              <option value="gemini">Google Gemini (Native REST)</option>
              <option value="openai">OpenAI Compatible (v1/chat)</option>
              <option value="custom">Custom Endpoint</option>
            </select>
          </div>

          {/* Model Name */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-xs font-mono text-slate-300 font-semibold">Model Identifier:</label>
            <input
              type="text"
              value={formData.primary.model}
              onChange={(e) => {
                const newModel = e.target.value;
                handlePrimaryChange('model', newModel);
                if (
                  formData.primary.provider === 'gemini' &&
                  formData.primary.url.includes('generativelanguage.googleapis.com')
                ) {
                  handlePrimaryChange(
                    'url',
                    `https://generativelanguage.googleapis.com/v1beta/models/${newModel}:generateContent`
                  );
                }
              }}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:border-amber-400 text-slate-200 text-xs font-mono focus:outline-none"
              placeholder="gemini-flash-latest"
            />
          </div>

          {/* Max Tokens */}
          <div className="md:col-span-4 flex flex-col gap-1">
            <label className="text-xs font-mono text-slate-300 font-semibold">Max Output Tokens:</label>
            <input
              type="number"
              value={formData.primary.maxOutputTokens}
              onChange={(e) => handlePrimaryChange('maxOutputTokens', Number(e.target.value))}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:border-amber-400 text-slate-200 text-xs font-mono focus:outline-none"
              min={512}
              max={8192}
              step={256}
            />
          </div>

          {/* Endpoint URL */}
          <div className="md:col-span-12 flex flex-col gap-1">
            <label className="text-xs font-mono text-slate-300 font-semibold flex items-center justify-between">
              <span>Primary Endpoint REST URL:</span>
              <button
                type="button"
                onClick={() => {
                  handlePrimaryChange(
                    'url',
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'
                  );
                  handlePrimaryChange('model', 'gemini-flash-latest');
                }}
                className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
              >
                Restore Gemini Default (Flash Latest)
              </button>
            </label>
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-amber-400">
              <Server className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
              <input
                type="text"
                value={formData.primary.url}
                onChange={(e) => handlePrimaryChange('url', e.target.value)}
                className="bg-transparent text-amber-200 text-xs w-full focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Primary API Key Input (User laptop injection) */}
          <div className="md:col-span-9 flex flex-col gap-1">
            <label className="text-xs font-mono text-slate-300 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Primary LLM API Key (Stored securely in local laptop localStorage):
              </span>
              <span className="text-[10px] text-slate-400">
                {formData.primary.apiKey ? '✓ Key Configured' : 'Optional — Fallback engine active if blank'}
              </span>
            </label>
            <div className="flex items-center bg-slate-900 border border-amber-900/50 rounded-lg px-2.5 py-1.5 focus-within:border-amber-400">
              <input
                type={showPrimaryKey ? 'text' : 'password'}
                value={formData.primary.apiKey}
                onChange={(e) => handlePrimaryChange('apiKey', e.target.value)}
                className="bg-transparent text-emerald-300 text-xs w-full focus:outline-none font-mono"
                placeholder="Paste your Gemini AI Studio API key (starts with AQ. or AIza...)"
              />
              <button
                type="button"
                onClick={() => setShowPrimaryKey(!showPrimaryKey)}
                className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer ml-1"
              >
                {showPrimaryKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {formData.primary.apiKey.startsWith('AQ.') && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono mt-0.5 bg-emerald-950/70 px-2.5 py-1 rounded border border-emerald-800/40">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  <strong>Google AI Studio Auth Key detected (AQ.***)</strong> — Automatically routed with <code className="text-emerald-300 bg-emerald-900/50 px-1 py-0.5 rounded">x-goog-api-key</code> authentication to <strong>{formData.primary.model}</strong>.
                </span>
              </div>
            )}
          </div>

          {/* Test Primary Connection Button */}
          <div className="md:col-span-3 flex items-end">
            <button
              type="button"
              onClick={runPrimaryTest}
              disabled={testingPrimary}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
            >
              {testingPrimary ? (
                <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span>Test Primary Key</span>
            </button>
          </div>

          {/* Primary Test Message */}
          {primaryTestResult && (
            <div
              className={`md:col-span-12 p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                primaryTestResult.success
                  ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                  : 'bg-red-950/60 border border-red-900/60 text-red-200'
              }`}
            >
              {primaryTestResult.success ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{primaryTestResult.message}</span>
            </div>
          )}

          {/* Quick Guide: How to Connect Google Gemini API */}
          <div className="md:col-span-12 p-3 rounded-lg bg-slate-900/80 border border-amber-900/30 text-[11px] font-mono text-slate-300 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>How to Connect Google Gemini API (including new AQ. Auth Keys):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-400">
              <li>
                Get a free key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:text-amber-300 underline font-semibold"
                >
                  Google AI Studio (aistudio.google.com/app/apikey)
                </a>
                .
              </li>
              <li>
                <strong>About AQ. keys</strong>: Google recently transitioned Google AI Studio to issue new "Auth keys" prefixed with <code className="text-amber-300 bg-amber-950 px-1 py-0.5 rounded">AQ.</code> instead of legacy <code className="text-slate-400 bg-slate-800 px-1 py-0.5 rounded">AIza</code>. Both are fully supported!
              </li>
              <li>
                Ensure the model is set to{' '}
                <span className="text-amber-300 font-bold bg-amber-950/80 px-1 py-0.5 rounded border border-amber-900/40">
                  gemini-2.5-flash
                </span>{' '}
                (recommended) or{' '}
                <span className="text-slate-300 bg-slate-800 px-1 py-0.5 rounded">gemini-2.0-flash</span>.
                <em> (Note: Google retired gemini-1.5-pro in the REST API, resulting in HTTP 404).</em>
              </li>
              <li>
                Paste your API key into the <strong className="text-slate-200">Primary LLM API Key</strong> box (spaces and quotes are auto-trimmed).
              </li>
              <li>
                Click <strong className="text-amber-300">Test Primary Key</strong> to verify the connection.
              </li>
              <li>
                Click <strong className="text-emerald-300">Save Injected Config</strong> (at top right) to save to local browser storage.
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* SECTION 3: Secondary LLM Settings (Dual-Dispatch: "request should go both") */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-900/40 flex flex-col gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-900/30 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-bold text-blue-300 text-sm font-mono flex items-center gap-2">
                3. Secondary LLM Settings (Dual Comparative Audit)
              </h3>
              <span className="text-[11px] text-slate-400">
                When enabled, dispatch requests concurrently fire to <strong>both Primary and Secondary</strong> models for comparative cross-validation.
              </span>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-mono text-slate-200 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.secondary.enabled}
              onChange={(e) => handleSecondaryChange('enabled', e.target.checked)}
              className="rounded accent-blue-500 w-4 h-4 cursor-pointer"
            />
            <span className="font-bold text-blue-300">Enable Dual-Dispatch (Go to Both)</span>
          </label>
        </div>

        {formData.secondary.enabled ? (
          <div className="flex flex-col gap-3.5">
            {/* Quick Provider Presets Bar */}
            <div className="flex flex-wrap items-center gap-1.5 pb-1 border-b border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-mono font-semibold uppercase tracking-wider mr-1">
                Quick Presets:
              </span>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    secondary: {
                      ...prev.secondary,
                      provider: 'openai',
                      url: 'https://api.openai.com/v1/chat/completions',
                      model: 'o3-mini',
                      maxOutputTokens: 4096,
                    },
                  }));
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                  formData.secondary.provider === 'openai' && formData.secondary.model === 'o3-mini'
                    ? 'bg-blue-950 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-blue-300 hover:border-slate-700'
                }`}
              >
                OpenAI (o3-mini)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    secondary: {
                      ...prev.secondary,
                      provider: 'anthropic',
                      url: 'https://api.anthropic.com/v1/messages',
                      model: 'claude-3-5-sonnet-20241022',
                      maxOutputTokens: 4096,
                    },
                  }));
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                  formData.secondary.provider === 'anthropic'
                    ? 'bg-blue-950 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-blue-300 hover:border-slate-700'
                }`}
              >
                Claude 3.5 Sonnet
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    secondary: {
                      ...prev.secondary,
                      provider: 'groq',
                      url: 'https://api.groq.com/openai/v1/chat/completions',
                      model: 'llama-3.3-70b-versatile',
                      maxOutputTokens: 4096,
                    },
                  }));
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                  formData.secondary.provider === 'groq'
                    ? 'bg-blue-950 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-blue-300 hover:border-slate-700'
                }`}
              >
                Groq (Llama 3.3)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    secondary: {
                      ...prev.secondary,
                      provider: 'openrouter',
                      url: 'https://openrouter.ai/api/v1/chat/completions',
                      model: 'deepseek/deepseek-r1',
                      maxOutputTokens: 4096,
                    },
                  }));
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                  formData.secondary.provider === 'openrouter'
                    ? 'bg-blue-950 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-blue-300 hover:border-slate-700'
                }`}
              >
                OpenRouter (DeepSeek R1)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    secondary: {
                      ...prev.secondary,
                      provider: 'gemini',
                      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
                      model: 'gemini-flash-latest',
                      maxOutputTokens: 4096,
                    },
                  }));
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                  formData.secondary.provider === 'gemini'
                    ? 'bg-blue-950 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-blue-300 hover:border-slate-700'
                }`}
              >
                Google Gemini
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    secondary: {
                      ...prev.secondary,
                      provider: 'custom',
                      url: 'http://localhost:11434/v1/chat/completions',
                      model: 'llama3.1:8b',
                      maxOutputTokens: 4096,
                    },
                  }));
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                  formData.secondary.url.includes('localhost')
                    ? 'bg-blue-950 border-blue-500 text-blue-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-blue-300 hover:border-slate-700'
                }`}
              >
                Local Ollama
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Secondary Provider */}
              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="text-xs font-mono text-slate-300 font-semibold">Secondary Provider:</label>
                <select
                  value={formData.secondary.provider}
                  onChange={(e) => {
                    const prov = e.target.value as any;
                    if (prov === 'openai') {
                      setFormData((prev) => ({
                        ...prev,
                        secondary: {
                          ...prev.secondary,
                          provider: 'openai',
                          url: 'https://api.openai.com/v1/chat/completions',
                          model: 'o3-mini',
                        },
                      }));
                    } else if (prov === 'anthropic') {
                      setFormData((prev) => ({
                        ...prev,
                        secondary: {
                          ...prev.secondary,
                          provider: 'anthropic',
                          url: 'https://api.anthropic.com/v1/messages',
                          model: 'claude-3-5-sonnet-20241022',
                        },
                      }));
                    } else if (prov === 'groq') {
                      setFormData((prev) => ({
                        ...prev,
                        secondary: {
                          ...prev.secondary,
                          provider: 'groq',
                          url: 'https://api.groq.com/openai/v1/chat/completions',
                          model: 'llama-3.3-70b-versatile',
                        },
                      }));
                    } else if (prov === 'openrouter') {
                      setFormData((prev) => ({
                        ...prev,
                        secondary: {
                          ...prev.secondary,
                          provider: 'openrouter',
                          url: 'https://openrouter.ai/api/v1/chat/completions',
                          model: 'deepseek/deepseek-r1',
                        },
                      }));
                    } else if (prov === 'gemini') {
                      setFormData((prev) => ({
                        ...prev,
                        secondary: {
                          ...prev.secondary,
                          provider: 'gemini',
                          url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
                          model: 'gemini-flash-latest',
                        },
                      }));
                    } else {
                      handleSecondaryChange('provider', prov);
                    }
                  }}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:border-blue-400 text-blue-200 text-xs font-mono focus:outline-none"
                >
                  <option value="openai">OpenAI (o3-mini / gpt-4o)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="groq">Groq High-Speed (Llama 3.3)</option>
                  <option value="openrouter">OpenRouter (DeepSeek R1 / Any)</option>
                  <option value="gemini">Google Gemini (Gemini Flash Latest)</option>
                  <option value="custom">Custom / Local Endpoint</option>
                </select>
              </div>

              {/* Model Identifier */}
              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="text-xs font-mono text-slate-300 font-semibold">Secondary Model Identifier:</label>
                <input
                  type="text"
                  value={formData.secondary.model}
                  onChange={(e) => handleSecondaryChange('model', e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:border-blue-400 text-slate-200 text-xs font-mono focus:outline-none"
                  placeholder="o3-mini"
                />
              </div>

              {/* Temperature */}
              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="text-xs font-mono text-slate-300 font-semibold flex items-center justify-between">
                  <span>Temperature:</span>
                  <span className="text-blue-300 font-bold">{formData.secondary.temperature}</span>
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  disabled={formData.secondary.model.startsWith('o1') || formData.secondary.model.startsWith('o3')}
                  value={formData.secondary.temperature}
                  onChange={(e) => handleSecondaryChange('temperature', parseFloat(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer disabled:opacity-40 mt-1"
                />
                {(formData.secondary.model.startsWith('o1') || formData.secondary.model.startsWith('o3')) && (
                  <span className="text-[10px] text-amber-400 font-mono">
                    (Auto-omitted for reasoning models)
                  </span>
                )}
              </div>

              {/* Max Output Tokens */}
              <div className="md:col-span-3 flex flex-col gap-1">
                <label className="text-xs font-mono text-slate-300 font-semibold">Max Output Tokens:</label>
                <input
                  type="number"
                  value={formData.secondary.maxOutputTokens}
                  onChange={(e) => handleSecondaryChange('maxOutputTokens', Number(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus:border-blue-400 text-slate-200 text-xs font-mono focus:outline-none"
                  min={512}
                  max={8192}
                  step={256}
                />
              </div>

              {/* Secondary Endpoint URL */}
              <div className="md:col-span-12 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-slate-300 font-semibold">Secondary REST Endpoint URL:</label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        secondary: {
                          ...prev.secondary,
                          provider: 'openai',
                          url: 'https://api.openai.com/v1/chat/completions',
                          model: 'o3-mini',
                        },
                      }));
                    }}
                    className="text-[10px] text-amber-400 hover:text-amber-300 underline font-mono cursor-pointer"
                  >
                    Restore Default (o3-mini)
                  </button>
                </div>
                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400">
                  <Globe className="w-4 h-4 text-slate-500 mr-2 shrink-0" />
                  <input
                    type="text"
                    value={formData.secondary.url}
                    onChange={(e) => handleSecondaryChange('url', e.target.value)}
                    className="bg-transparent text-blue-200 text-xs w-full focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Secondary API Key */}
              <div className="md:col-span-9 flex flex-col gap-1">
                <label className="text-xs font-mono text-slate-300 font-semibold flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-400" />
                    Secondary API Key (Stored in user's laptop localStorage):
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {formData.secondary.apiKey
                      ? '✓ Key Configured'
                      : formData.secondary.url.includes('localhost')
                      ? '✓ Local Endpoint (No Key Required)'
                      : 'Optional — Deterministic fallback active'}
                  </span>
                </label>
                <div className="flex items-center bg-slate-900 border border-blue-900/50 rounded-lg px-2.5 py-1.5 focus-within:border-blue-400">
                  <input
                    type={showSecondaryKey ? 'text' : 'password'}
                    value={formData.secondary.apiKey}
                    onChange={(e) => handleSecondaryChange('apiKey', e.target.value)}
                    className="bg-transparent text-blue-200 text-xs w-full focus:outline-none font-mono"
                    placeholder="sk-... (OpenAI / Anthropic / Groq Key, or empty for local Ollama)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecondaryKey(!showSecondaryKey)}
                    className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer ml-1"
                  >
                    {showSecondaryKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Test Secondary Connection Button */}
              <div className="md:col-span-3 flex items-end">
                <button
                  type="button"
                  onClick={runSecondaryTest}
                  disabled={testingSecondary}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  {testingSecondary ? (
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span>Test Secondary Key</span>
                </button>
              </div>

              {/* Secondary Test Message */}
              {secondaryTestResult && (
                <div
                  className={`md:col-span-12 p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                    secondaryTestResult.success
                      ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                      : 'bg-red-950/60 border border-red-900/60 text-red-200'
                  }`}
                >
                  {secondaryTestResult.success ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span>{secondaryTestResult.message}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-900 text-xs text-slate-400 font-mono border border-slate-800">
            Secondary LLM is currently disabled. Dispatches will focus strictly on Primary LLM. Check the box above to activate dual-dispatch.
          </div>
        )}
      </div>

      {/* Save Button Footer */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono cursor-pointer border border-slate-800 transition-colors"
          >
            Close Settings
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          {saveSuccess ? (
            <>
              <Check className="w-4 h-4 text-slate-950" />
              <span>Configurations Saved Successfully!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Apply & Save All Injected Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
