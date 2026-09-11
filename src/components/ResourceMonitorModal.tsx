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
  X,
  Layers,
  Activity,
  Trash2,
  Radio,
  ShieldCheck,
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

interface ResourceMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResourceMonitorModal: React.FC<ResourceMonitorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [state, setState] = useState<ResourceMonitorState>(getResourceMonitorState());
  const [isFlushing, setIsFlushing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'footprints' | 'settings'>('overview');

  useEffect(() => {
    const unsubscribe = subscribeResourceMonitor((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen) return null;

  const currentSpec =
    MODEL_FOOTPRINTS[state.activeModelId] ||
    MODEL_FOOTPRINTS['deepseek_32b'] ||
    Object.values(MODEL_FOOTPRINTS)[0];

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-amber-200">
                  System Monitoring & Observability
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${trafficBadgeColor}`}
                >
                  {state.trafficStatus} Alert
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Optimal Headroom, 32B VRAM Footprint & Immediate Memory Offload (<code className="text-amber-300">keep_alive: 0</code>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualFlush}
              disabled={isFlushing}
              className="px-3 py-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-300 border border-red-700/60 text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Flush VRAM immediately using keep_alive: 0"
            >
              <Trash2 className={`w-3.5 h-3.5 ${isFlushing ? 'animate-spin' : ''}`} />
              <span>{isFlushing ? 'Purging...' : 'Purge VRAM'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Close Dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Tab Controls */}
        <div className="px-4 pt-3 bg-slate-950/70 border-b border-slate-800 flex items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-t-lg border-b-2 font-semibold transition-all ${
              activeTab === 'overview'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Headroom & RAM
          </button>
          <button
            onClick={() => setActiveTab('footprints')}
            className={`px-3 py-1.5 rounded-t-lg border-b-2 font-semibold transition-all ${
              activeTab === 'footprints'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Model Footprint Table
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-t-lg border-b-2 font-semibold transition-all ${
              activeTab === 'settings'
                ? 'border-amber-400 text-amber-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Hardware Configuration
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-200 text-xs font-sans">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Traffic Light Alert Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${trafficBg}`}>
                <div className="mt-0.5">
                  {state.trafficStatus === 'green' && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  )}
                  {state.trafficStatus === 'yellow' && (
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                  )}
                  {state.trafficStatus === 'red' && (
                    <AlertOctagon className="w-5 h-5 text-red-400 animate-bounce" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">
                      {state.trafficStatus === 'green' && 'System Safe: Optimal Memory Headroom'}
                      {state.trafficStatus === 'yellow' && 'Caution: Elevated Memory Pressure (Yellow Alert)'}
                      {state.trafficStatus === 'red' && 'Critical Alert: Potential Swap Thrashing (Red Alert)'}
                    </span>
                    <span className="font-mono text-xs">
                      {state.ramUtilizationPct}% of {state.systemTotalRamGb} GB allocated
                    </span>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {state.actionableGuidance}
                  </p>
                </div>
              </div>

              {/* Progress Bar for Memory */}
              <div className="space-y-1.5 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Total Host Memory Allocation</span>
                  <span className="text-amber-300 font-bold">
                    {state.currentAllocatedGb.toFixed(1)} GB / {state.systemTotalRamGb} GB
                  </span>
                </div>
                <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${ramBarColor}`}
                    style={{ width: `${Math.min(100, state.ramUtilizationPct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>Baseline OS (~5.0 GB)</span>
                  <span>Model Active ({currentSpec.totalActiveGb} GB)</span>
                  <span>Free Headroom ({state.freeHeadroomGb.toFixed(1)} GB)</span>
                </div>
              </div>

              {/* Live Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                    <span>Free Headroom</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-emerald-400">
                    {state.freeHeadroomGb.toFixed(1)} GB
                  </div>
                  <div className="text-[10px] text-slate-500">Available before swap thrash</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" />
                    <span>Active Model Status</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-amber-300 truncate">
                    {state.modelStatus === 'loaded' ? 'In VRAM (Loaded)' : 'Offloaded (Zero VRAM)'}
                  </div>
                  <div className="text-[10px] text-slate-500">{currentSpec.name}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>keep_alive: 0 Engine</span>
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-300">
                    Instant Purge Active
                  </div>
                  <div className="text-[10px] text-slate-500">Auto-flushes upon completion</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Simulation Control:</span>
                  <button
                    onClick={handleToggleSimulate}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs cursor-pointer"
                  >
                    {state.modelStatus === 'loaded' ? 'Simulate Model Offload' : 'Simulate 32B Load'}
                  </button>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Current Model: <strong className="text-amber-300">{state.activeModelId}</strong>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'footprints' && (
            <div className="space-y-4">
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                    <tr>
                      <th className="p-3">Component</th>
                      <th className="p-3">Quantization</th>
                      <th className="p-3">Active VRAM</th>
                      <th className="p-3">Offloaded (keep_alive: 0)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    <tr>
                      <td className="p-3 font-sans font-medium text-amber-200">Model Weights</td>
                      <td className="p-3 text-slate-400">{currentSpec.quantization}</td>
                      <td className="p-3 text-amber-300 font-bold">{currentSpec.weightsGb} GB</td>
                      <td className="p-3 text-emerald-400 font-bold">0.0 GB</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-amber-200">KV-Cache (8K context)</td>
                      <td className="p-3 text-slate-400">FP16 tensors</td>
                      <td className="p-3 text-amber-300">{currentSpec.kvCacheGb} GB</td>
                      <td className="p-3 text-emerald-400">0.0 GB</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-medium text-amber-200">CUDA / Metal Overhead</td>
                      <td className="p-3 text-slate-400">Runtime buffers</td>
                      <td className="p-3 text-amber-300">{currentSpec.overheadGb} GB</td>
                      <td className="p-3 text-emerald-400">0.0 GB</td>
                    </tr>
                    <tr className="bg-slate-900/60 font-bold">
                      <td className="p-3 font-sans text-white">Net Model Footprint</td>
                      <td className="p-3 text-slate-400">{currentSpec.parameterSize}</td>
                      <td className="p-3 text-amber-300">{currentSpec.totalActiveGb} GB</td>
                      <td className="p-3 text-emerald-400">0.0 GB Freed</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs text-slate-300 leading-relaxed">
                💡 <strong>How Offload Works:</strong> When Ollama or local inference receives a request with{' '}
                <code className="bg-slate-900 px-1.5 py-0.5 rounded text-amber-300 font-mono">keep_alive: 0</code>
                , the runtime unloads all {currentSpec.weightsGb} GB of quantized weights from Apple Metal Unified Memory or NVIDIA VRAM immediately, returning host memory to baseline (~5 GB).
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-semibold text-amber-200 block">
                    Host System Total RAM
                  </label>
                  <select
                    value={state.systemTotalRamGb}
                    onChange={(e) => handleRamChange(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-200 text-xs font-mono cursor-pointer"
                  >
                    <option value={16}>16 GB (Tight — 8B/14B recommended)</option>
                    <option value={24}>24 GB (RTX 3090/4090 or M2 24GB)</option>
                    <option value={32}>32 GB (Standard 32B Quantized)</option>
                    <option value={64}>64 GB (High Headroom)</option>
                    <option value={128}>128 GB (Full Workstation)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Matches memory thresholds against active host specifications.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <label className="text-xs font-semibold text-amber-200 block">
                    Active Reasoning Model
                  </label>
                  <select
                    value={state.activeModelId}
                    onChange={(e) => handleModelChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-200 text-xs font-mono cursor-pointer"
                  >
                    <option value="deepseek_32b">DeepSeek-R1 32B (22.2 GB)</option>
                    <option value="qwen_14b">Qwen 2.5 14B (10.5 GB)</option>
                    <option value="llama_8b">Llama 3.1 8B (6.1 GB)</option>
                  </select>
                  <p className="text-[11px] text-slate-400">
                    Adjusts baseline footprint calculations automatically.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 font-mono text-[11px]">
            Host Headroom: <span className="text-emerald-400 font-bold">{state.freeHeadroomGb.toFixed(1)} GB Free</span> • <code className="text-amber-300">keep_alive: 0</code> Ready
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
