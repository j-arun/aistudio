// Specification: 32B Private LLM Resource Monitor Helper Pane
// Displays live memory & CPU meters, Green/Yellow/Red traffic alerts,
// actionable next-step guidance, required footprints, and keep_alive: 0 memory flush.

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  HardDrive,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  Activity,
  Trash2,
  Radio,
} from 'lucide-react';
import {
  ResourceMonitorState,
  getResourceMonitorState,
  subscribeResourceMonitor,
  saveResourceMonitorSettings,
  flushModelFromMemory,
  notifyModelLoaded,
  MODEL_FOOTPRINTS,
} from '../utils/resourceMonitor';

interface ResourceMonitorPaneProps {
  isOpen: boolean;
  onClose?: () => void;
  isFloating?: boolean;
}

export const ResourceMonitorPane: React.FC<ResourceMonitorPaneProps> = ({
  isOpen,
  onClose,
  isFloating = false,
}) => {
  const [state, setState] = useState<ResourceMonitorState>(getResourceMonitorState());
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFootprintDetails, setShowFootprintDetails] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeResourceMonitor((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const currentSpec = MODEL_FOOTPRINTS[state.activeModelId] || MODEL_FOOTPRINTS['32b_q4'];

  const handleManualFlush = async () => {
    setIsFlushing(true);
    await flushModelFromMemory({ reason: 'manual_flush' });
    setTimeout(() => {
      setIsFlushing(false);
    }, 450);
  };

  const handleToggleSimulate = () => {
    if (state.modelStatus === 'loaded') {
      flushModelFromMemory({ reason: 'manual_flush' });
    } else {
      notifyModelLoaded(state.activeModelId);
    }
  };

  const handleRamChange = (gb: number) => {
    saveResourceMonitorSettings({ systemTotalRamGb: gb });
  };

  const handleModelChange = (modelId: string) => {
    saveResourceMonitorSettings({ activeModelId: modelId });
  };

  const handleAutoFlushToggle = () => {
    saveResourceMonitorSettings({
      autoFlushOnPromptValidation: !state.autoFlushOnPromptValidation,
    });
  };

  // Color styling helpers
  const trafficBg =
    state.trafficStatus === 'green'
      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
      : state.trafficStatus === 'yellow'
      ? 'bg-amber-950/50 border-amber-500/60 text-amber-200'
      : 'bg-red-950/60 border-red-500/70 text-red-200 animate-pulse';

  const trafficBadgeColor =
    state.trafficStatus === 'green'
      ? 'bg-emerald-500 text-slate-950'
      : state.trafficStatus === 'yellow'
      ? 'bg-amber-500 text-slate-950'
      : 'bg-red-500 text-white';

  const ramBarColor =
    state.trafficStatus === 'green'
      ? 'bg-emerald-500'
      : state.trafficStatus === 'yellow'
      ? 'bg-amber-500'
      : 'bg-red-500';

  return (
    <div
      className={`bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden font-sans transition-all duration-300 ${
        isFloating
          ? 'fixed bottom-4 right-4 z-40 max-w-md w-full border-amber-500/40 shadow-amber-950/40'
          : 'w-full mb-4 border-slate-700/60'
      }`}
    >
      {/* Pane Header */}
      <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-amber-200 flex items-center gap-1.5">
                <span>32B Private LLM Resource Monitor</span>
              </h3>
              <span
                className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${trafficBadgeColor}`}
              >
                {state.trafficStatus}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              VRAM Footprint & Memory Offload Engine (keep_alive: 0)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
              title="Close Monitor"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Pane Body */}
      {isExpanded && (
        <div className="p-4 flex flex-col gap-3.5">
          {/* TRAFFIC LIGHT ALERT & NEXT-ACTION GUIDANCE BANNER */}
          <div className={`p-3 rounded-xl border flex flex-col gap-2 ${trafficBg}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {state.trafficStatus === 'green' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : state.trafficStatus === 'yellow' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 animate-bounce" />
                )}
                <span className="font-bold text-xs tracking-tight">{state.trafficTitle}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/70 border border-current">
                {state.ramUtilizationPct}% RAM Used
              </span>
            </div>

            {/* User Guidance Advice */}
            <div className="text-[11px] leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
              <div className="font-semibold text-amber-300/90 text-[10px] uppercase font-mono mb-1 flex items-center gap-1">
                <span>Guidance for Next Action:</span>
              </div>
              <p className="font-medium text-slate-200">{state.trafficGuidance}</p>
              <p className="text-[10px] text-slate-400 mt-1">{state.trafficAdvice}</p>
            </div>
          </div>

          {/* HARDWARE GAUGES: MEMORY & CPU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Memory / VRAM Gauge */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  System & VRAM
                </span>
                <span className="text-amber-200 font-bold">
                  {state.totalRamUsedGb} / {state.systemTotalRamGb} GB
                </span>
              </div>

              {/* Progress Bar with 65% and 85% guideline markers */}
              <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${ramBarColor}`}
                  style={{ width: `${Math.min(100, state.ramUtilizationPct)}%` }}
                />
                {/* 65% Yellow Threshold Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400/40 z-10"
                  style={{ left: '65%' }}
                  title="65% Elevated threshold"
                />
                {/* 85% Red Threshold Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-400/60 z-10"
                  style={{ left: '85%' }}
                  title="85% Critical threshold"
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>
                  32B VRAM:{' '}
                  <strong className={state.modelVramUsedGb > 0 ? 'text-amber-300' : 'text-emerald-400'}>
                    {state.modelVramUsedGb > 0 ? `${state.modelVramUsedGb} GB (Active)` : '0.0 GB (Offloaded)'}
                  </strong>
                </span>
                <span>{state.ramUtilizationPct}%</span>
              </div>
            </div>

            {/* CPU & Inference Threads Gauge */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-blue-400" />
                  CPU / Inference Load
                </span>
                <span className="text-blue-200 font-bold">{state.cpuUtilizationPct}%</span>
              </div>

              <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                  style={{ width: `${state.cpuUtilizationPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Active Threads: {state.activeThreads} / 16</span>
                <span>
                  Status:{' '}
                  <span className="text-slate-300 capitalize">{state.modelStatus}</span>
                </span>
              </div>
            </div>
          </div>

          {/* PRIMARY ACTION BUTTONS: IMMEDIATE FLUSH & SIMULATE */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            {/* Immediate Flush Button */}
            <button
              type="button"
              onClick={handleManualFlush}
              disabled={isFlushing}
              className="w-full sm:flex-1 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-red-950 via-red-900 to-amber-950 hover:from-red-900 hover:to-amber-900 text-amber-100 border border-red-700/60 text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
              title="Force unload weights from VRAM via keep_alive: 0"
            >
              <Trash2 className={`w-3.5 h-3.5 text-red-400 ${isFlushing ? 'animate-spin' : ''}`} />
              <span>
                {isFlushing ? 'Purging VRAM (keep_alive: 0)...' : '⚡ Flush & Offload 32B Now'}
              </span>
            </button>

            {/* Simulate Model Load / Unload */}
            <button
              type="button"
              onClick={handleToggleSimulate}
              className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono transition-all cursor-pointer flex items-center justify-center gap-1.5"
              title="Toggle 32B model resident state in memory for testing"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
              <span>{state.modelStatus === 'loaded' ? 'Unload Model' : 'Simulate 32B Load'}</span>
            </button>
          </div>

          {/* AUTO-OFFLOAD TOGGLE */}
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <label
                htmlFor="auto-flush-toggle"
                className="text-xs font-medium text-slate-200 cursor-pointer flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Auto-Offload on Prompt Validation</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Immediately flushes 32B VRAM (keep_alive: 0) once outbound prompt is verified
              </span>
            </div>

            <input
              id="auto-flush-toggle"
              type="checkbox"
              checked={state.autoFlushOnPromptValidation}
              onChange={handleAutoFlushToggle}
              className="w-4 h-4 accent-amber-500 rounded cursor-pointer shrink-0"
            />
          </div>

          {/* FLUSH NOTIFICATION BANNER */}
          {state.flushStatusMessage && (
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-200 text-[11px] font-mono flex items-center justify-between gap-2 animate-fadeIn">
              <span className="truncate">{state.flushStatusMessage}</span>
              <span className="text-[9px] text-emerald-400/70 shrink-0">
                {state.lastFlushedAt}
              </span>
            </div>
          )}

          {/* REQUIRED FOOTPRINTS BREAKDOWN (COLLAPSIBLE) */}
          <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden text-xs font-mono">
            <button
              type="button"
              onClick={() => setShowFootprintDetails(!showFootprintDetails)}
              className="w-full p-2.5 flex items-center justify-between text-slate-400 hover:text-slate-200 bg-slate-900/60 transition-colors"
            >
              <span className="flex items-center gap-1.5 font-bold text-[11px] text-amber-300">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Required Footprints & Model Architecture Specs
              </span>
              {showFootprintDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showFootprintDetails && (
              <div className="p-3 border-t border-slate-800 flex flex-col gap-3">
                {/* Selectors for Laptop Hardware & Target Quantization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Target Private Model Architecture:
                    </label>
                    <select
                      value={state.activeModelId}
                      onChange={(e) => handleModelChange(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-amber-200 text-xs font-mono"
                    >
                      {Object.values(MODEL_FOOTPRINTS).map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.name} (~{spec.totalActiveGb} GB)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Local Host Total RAM / VRAM:
                    </label>
                    <select
                      value={state.systemTotalRamGb}
                      onChange={(e) => handleRamChange(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-amber-200 text-xs font-mono"
                    >
                      <option value={16}>16 GB (Tight — 8B/14B recommended)</option>
                      <option value={24}>24 GB (RTX 3090/4090 or M2 24GB)</option>
                      <option value={32}>32 GB (Standard 32B Quantized)</option>
                      <option value={64}>64 GB (High Headroom)</option>
                      <option value={128}>128 GB (Full Workstation)</option>
                    </select>
                  </div>
                </div>

                {/* Footprint Specifications Table */}
                <div className="bg-slate-900/90 rounded-lg border border-slate-800 overflow-x-auto">
                  <table className="w-full text-left text-[11px] text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="p-2">Component</th>
                        <th className="p-2">Quantization</th>
                        <th className="p-2">Active VRAM</th>
                        <th className="p-2">Offloaded (keep_alive: 0)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      <tr>
                        <td className="p-2 font-medium text-amber-200">Model Weights</td>
                        <td className="p-2 text-slate-400">{currentSpec.quantization}</td>
                        <td className="p-2 text-amber-300 font-bold">{currentSpec.weightsGb} GB</td>
                        <td className="p-2 text-emerald-400 font-bold">0.0 GB</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-amber-200">KV-Cache (8K context)</td>
                        <td className="p-2 text-slate-400">FP16 tensors</td>
                        <td className="p-2 text-amber-300">{currentSpec.kvCacheGb} GB</td>
                        <td className="p-2 text-emerald-400">0.0 GB</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium text-amber-200">CUDA / Metal Overhead</td>
                        <td className="p-2 text-slate-400">Runtime buffers</td>
                        <td className="p-2 text-amber-300">{currentSpec.overheadGb} GB</td>
                        <td className="p-2 text-emerald-400">0.0 GB</td>
                      </tr>
                      <tr className="bg-slate-950/80 font-bold">
                        <td className="p-2 text-white">Net Model Footprint</td>
                        <td className="p-2 text-slate-400">{currentSpec.parameterSize}</td>
                        <td className="p-2 text-amber-300">{currentSpec.totalActiveGb} GB</td>
                        <td className="p-2 text-emerald-400">0.0 GB Freed</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="text-[10px] text-slate-400 leading-relaxed font-sans">
                  💡 <strong>How Offload Works:</strong> When Ollama receives a request with{' '}
                  <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-300">keep_alive: 0</code>
                  , the runtime unloads all {currentSpec.weightsGb} GB of quantized weights from
                  Apple Metal Unified Memory or NVIDIA VRAM immediately, returning host memory to
                  baseline (~5 GB).
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
