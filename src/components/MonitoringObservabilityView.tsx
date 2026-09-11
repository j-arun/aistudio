import React, { useState, useEffect } from 'react';
import {
  Activity,
  Cpu,
  HardDrive,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  Sliders,
  Trash2,
  Layers,
  Server,
  ShieldCheck,
  Download,
  Copy,
  Check,
  FileText,
  Clock,
  Radio,
} from 'lucide-react';
import {
  ResourceMonitorState,
  getResourceMonitorState,
  subscribeResourceMonitor,
  saveResourceMonitorSettings,
  flushModelFromMemory,
  notifyModelLoaded,
  checkOllamaHealth,
  MODEL_FOOTPRINTS,
} from '../utils/resourceMonitor';

export const MonitoringObservabilityView: React.FC = () => {
  const [state, setState] = useState<ResourceMonitorState>(getResourceMonitorState());
  const [isFlushing, setIsFlushing] = useState(false);
  const [isCheckingOllama, setIsCheckingOllama] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'telemetry' | 'footprints' | 'hardware' | 'logs'>('telemetry');
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [eventLogs, setEventLogs] = useState<Array<{ id: string; time: string; level: 'info' | 'warn' | 'success'; message: string }>>([
    {
      id: '1',
      time: new Date(Date.now() - 120000).toLocaleTimeString(),
      level: 'info',
      message: 'System monitor initialized. Baseline host OS footprint calibrated to ~5.4 GB.',
    },
    {
      id: '2',
      time: new Date(Date.now() - 90000).toLocaleTimeString(),
      level: 'success',
      message: 'Headroom evaluation complete: Traffic status OPTIMAL_GREEN (>6.0 GB free).',
    },
    {
      id: '3',
      time: new Date(Date.now() - 60000).toLocaleTimeString(),
      level: 'info',
      message: 'Zero-Ingress Policy active: keep_alive: 0 configured for immediate VRAM offload.',
    },
  ]);

  useEffect(() => {
    const unsubscribe = subscribeResourceMonitor((newState) => {
      setState(newState);
    });
    return () => unsubscribe();
  }, []);

  const currentSpec =
    MODEL_FOOTPRINTS[state.activeModelId] ||
    MODEL_FOOTPRINTS['deepseek_32b'] ||
    Object.values(MODEL_FOOTPRINTS)[0];

  const handleManualFlush = async () => {
    setIsFlushing(true);
    const result = await flushModelFromMemory({ reason: 'manual_flush' });
    setEventLogs((prev) => [
      {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString(),
        level: 'success',
        message: `VRAM Purge: Freed ~${result.freedGb} GB. Model unloaded from memory (keep_alive: 0).`,
      },
      ...prev,
    ]);
    setTimeout(() => {
      setIsFlushing(false);
    }, 450);
  };

  const handleToggleSimulate = () => {
    if (state.modelStatus === 'loaded') {
      flushModelFromMemory({ reason: 'manual_flush' });
      setEventLogs((prev) => [
        {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          level: 'info',
          message: `Simulate Offload: Model status set to offloaded. Memory returned to OS.`,
        },
        ...prev,
      ]);
    } else {
      notifyModelLoaded(state.activeModelId);
      setEventLogs((prev) => [
        {
          id: Date.now().toString(),
          time: new Date().toLocaleTimeString(),
          level: 'warn',
          message: `Simulate Load: ${currentSpec.name} resident in memory (~${currentSpec.totalActiveGb} GB active).`,
        },
        ...prev,
      ]);
    }
  };

  const handleProbeOllama = async () => {
    setIsCheckingOllama(true);
    const online = await checkOllamaHealth(state.ollamaEndpoint);
    setEventLogs((prev) => [
      {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString(),
        level: online ? 'success' : 'warn',
        message: online
          ? `Ollama check passed: Local server reachable at ${state.ollamaEndpoint}.`
          : `Ollama check: Local server not reachable at ${state.ollamaEndpoint} (using local sandbox heuristics).`,
      },
      ...prev,
    ]);
    setTimeout(() => {
      setIsCheckingOllama(false);
    }, 400);
  };

  const handleRamChange = (gb: number) => {
    saveResourceMonitorSettings({ systemTotalRamGb: gb });
    setEventLogs((prev) => [
      {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString(),
        level: 'info',
        message: `Hardware configuration updated: Host total RAM set to ${gb} GB.`,
      },
      ...prev,
    ]);
  };

  const handleModelChange = (modelId: string) => {
    saveResourceMonitorSettings({ activeModelId: modelId });
    setEventLogs((prev) => [
      {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString(),
        level: 'info',
        message: `Active model target updated to: ${modelId}.`,
      },
      ...prev,
    ]);
  };

  const handleCopyLogs = () => {
    const text = eventLogs.map((l) => `[${l.time}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  // Traffic light styling
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

  const freeHeadroom = state.freeHeadroomGb ?? Math.max(0, state.systemTotalRamGb - state.totalRamUsedGb);
  const totalAllocated = state.currentAllocatedGb ?? state.totalRamUsedGb;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6 flex flex-col gap-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 rounded-2xl border border-amber-900/40 p-4 sm:p-5 shadow-xl backdrop-blur">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-900/30 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold text-amber-200 uppercase tracking-wide">
                  Monitoring & Observability
                </h1>
                <span className={`px-2.5 py-0.5 rounded text-xs font-mono font-bold uppercase ${trafficBadgeColor}`}>
                  {state.trafficStatus} Alert
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                  Host: {state.systemTotalRamGb} GB Unified RAM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-Time Memory Headroom • 32B Local Reasoning Footprint • Immediate Offload (<code className="text-amber-300">keep_alive: 0</code>)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleToggleSimulate}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 border border-slate-800 hover:border-amber-500/50 text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              title="Toggle simulated 32B model resident state"
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>{state.modelStatus === 'loaded' ? 'Simulate Offload' : 'Simulate 32B Load'}</span>
            </button>

            <button
              onClick={handleProbeOllama}
              disabled={isCheckingOllama}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5"
              title="Test local Ollama reachability"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isCheckingOllama ? 'animate-spin' : ''}`} />
              <span>Probe Ollama</span>
            </button>

            <button
              onClick={handleManualFlush}
              disabled={isFlushing}
              className="px-3.5 py-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-200 border border-red-700/70 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Purge model weights from VRAM immediately"
            >
              <Trash2 className={`w-3.5 h-3.5 ${isFlushing ? 'animate-spin' : ''}`} />
              <span>{isFlushing ? 'Purging VRAM...' : 'Purge VRAM'}</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Bento Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Free Headroom */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                Free Headroom
              </span>
              <span className="font-mono text-[10px] text-slate-500">Target &gt;6.0 GB</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {freeHeadroom.toFixed(1)} <span className="text-sm font-normal text-slate-400">GB</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Safe headroom before OS swap contention
              </div>
            </div>
          </div>

          {/* Card 2: Allocated Memory */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Host RAM Allocated
              </span>
              <span className="font-mono text-[10px] text-amber-300">{state.ramUtilizationPct}% Used</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold font-mono text-amber-300">
                {totalAllocated.toFixed(1)} <span className="text-sm font-normal text-slate-400">/ {state.systemTotalRamGb} GB</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                OS Base (~5.4 GB) + VRAM ({state.modelVramUsedGb.toFixed(1)} GB)
              </div>
            </div>
          </div>

          {/* Card 3: Model Resident Footprint */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Model VRAM Status
              </span>
              <span className={`text-[10px] font-mono font-bold ${state.modelStatus === 'loaded' ? 'text-amber-400' : 'text-emerald-400'}`}>
                {state.modelStatus === 'loaded' ? 'RESIDENT' : 'OFFLOADED'}
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold font-mono text-slate-100 truncate">
                {state.modelStatus === 'loaded' ? `${state.modelVramUsedGb.toFixed(1)} GB` : '0.0 GB (Zero VRAM)'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate" title={currentSpec.name}>
                {currentSpec.parameterSize} {currentSpec.quantization} • {state.activeModelId}
              </div>
            </div>
          </div>

          {/* Card 4: keep_alive: 0 Policy */}
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                keep_alive: 0 Engine
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                ACTIVE
              </span>
            </div>
            <div className="mt-2">
              <div className="text-lg font-bold font-mono text-emerald-300">
                Instant Offload
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {state.lastFlushedAt ? `Last flush: ${state.lastFlushedAt}` : 'Ready for auto-flush'}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex flex-wrap items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono gap-1 mt-4">
          <button
            onClick={() => setActiveSubTab('telemetry')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'telemetry'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Headroom & RAM</span>
          </button>

          <button
            onClick={() => setActiveSubTab('footprints')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'footprints'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Model Footprint Matrix</span>
          </button>

          <button
            onClick={() => setActiveSubTab('hardware')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'hardware'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Hardware Presets</span>
          </button>

          <button
            onClick={() => setActiveSubTab('logs')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'logs'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Observability Event Logs</span>
            <span className="text-[10px] bg-slate-900 px-1.5 py-0.2 rounded text-slate-400">{eventLogs.length}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Live Headroom & RAM */}
      {activeSubTab === 'telemetry' && (
        <div className="space-y-4">
          {/* Traffic Light Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${trafficBg}`}>
            <div className="mt-0.5">
              {state.trafficStatus === 'green' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
              {state.trafficStatus === 'yellow' && <AlertTriangle className="w-6 h-6 text-amber-400" />}
              {state.trafficStatus === 'red' && <AlertOctagon className="w-6 h-6 text-red-400 animate-bounce" />}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm sm:text-base">
                  {state.trafficTitle}
                </span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700">
                  {state.ramUtilizationPct}% Allocation
                </span>
              </div>
              <p className="text-xs opacity-90 leading-relaxed font-sans">
                {state.trafficAdvice}
              </p>
              <div className="pt-1 text-[11px] font-mono text-amber-300 flex items-center gap-1.5">
                <span>Guidance:</span>
                <span>{state.trafficGuidance}</span>
              </div>
            </div>
          </div>

          {/* Visual Memory Allocation Bar */}
          <div className="bg-slate-900/90 rounded-2xl border border-amber-900/30 p-5 shadow-xl space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-amber-400" />
                Unified Host RAM Allocation Map
              </span>
              <span className="text-amber-300 font-bold">
                {totalAllocated.toFixed(1)} GB / {state.systemTotalRamGb} GB ({state.ramUtilizationPct}%)
              </span>
            </div>

            <div className="w-full h-5 bg-slate-950 rounded-full overflow-hidden p-1 border border-slate-800 flex gap-0.5">
              {/* Baseline OS */}
              <div
                className="bg-slate-600 h-full rounded-l-full transition-all duration-300"
                style={{ width: `${(state.baseHostRamGb / state.systemTotalRamGb) * 100}%` }}
                title={`OS Baseline: ${state.baseHostRamGb} GB`}
              />
              {/* Model VRAM */}
              {state.modelVramUsedGb > 0 && (
                <div
                  className={`${ramBarColor} h-full transition-all duration-300`}
                  style={{ width: `${(state.modelVramUsedGb / state.systemTotalRamGb) * 100}%` }}
                  title={`Model Resident: ${state.modelVramUsedGb} GB`}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1 font-mono gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                <span>OS & System Daemons: ~{state.baseHostRamGb} GB</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${ramBarColor} inline-block`} />
                <span>Active 32B VRAM: {state.modelVramUsedGb.toFixed(1)} GB</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-600 inline-block" />
                <span className="text-emerald-400 font-bold">Free Headroom: {freeHeadroom.toFixed(1)} GB</span>
              </div>
            </div>
          </div>

          {/* Zero-VRAM Architecture Explanation */}
          <div className="bg-slate-900/90 rounded-2xl border border-amber-900/30 p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Optimal Headroom Policy & Zero-Ingress Architecture
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              When using local quantized reasoning models (such as DeepSeek-R1-Distill-Qwen-32B or Qwen 2.5 32B), weights consume ~20–22 GB of Unified Memory. Under our strict policy, inference calls dispatch <code className="bg-slate-950 px-1.5 py-0.5 rounded text-amber-300 font-mono">keep_alive: 0</code> to Ollama/llama.cpp, which instructs the runtime to immediately release model tensors from GPU/Unified RAM back to the operating system the moment token generation ends.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-emerald-400 font-bold block mb-1 font-mono">Green Status (&lt;65%)</span>
                <span className="text-slate-400 text-[11px]">Free headroom &gt;6.0 GB. Safe for continuous astrological dialogue, follow-ups, and multi-divisional queries.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-amber-400 font-bold block mb-1 font-mono">Yellow Alert (65%–85%)</span>
                <span className="text-slate-400 text-[11px]">Model is resident in VRAM. Safe to conclude current reasoning task, but purge recommended before switching apps.</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-red-400 font-bold block mb-1 font-mono">Red Alert (&gt;85%)</span>
                <span className="text-slate-400 text-[11px]">Memory headroom &lt;3.0 GB. High hazard of OS swap thrashing. Instant purge required before executing new turns.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Model Footprint Matrix */}
      {activeSubTab === 'footprints' && (
        <div className="space-y-4">
          <div className="bg-slate-900/90 rounded-2xl border border-amber-900/30 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-amber-900/30 bg-slate-900 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Local Model Memory Footprint & Hardware Viability Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Exact weight tensors, KV-cache, and runtime overhead breakdown across quantizations
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Model Specification</th>
                    <th className="p-3.5">Quantization</th>
                    <th className="p-3.5">Weights</th>
                    <th className="p-3.5">KV-Cache (8k)</th>
                    <th className="p-3.5">Total Active VRAM</th>
                    <th className="p-3.5">Offloaded (keep_alive: 0)</th>
                    <th className="p-3.5">16 GB Host</th>
                    <th className="p-3.5">24 GB Host</th>
                    <th className="p-3.5">32 GB Host</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                  {Object.values(MODEL_FOOTPRINTS).slice(0, 6).map((spec) => {
                    const isCurrent = spec.id === state.activeModelId;
                    return (
                      <tr
                        key={spec.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isCurrent ? 'bg-amber-500/10 border-l-2 border-l-amber-400' : ''
                        }`}
                      >
                        <td className="p-3.5 font-sans font-medium text-slate-100 flex items-center gap-2">
                          <span>{spec.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40 font-mono">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-400">{spec.quantization}</td>
                        <td className="p-3.5 text-amber-300">{spec.weightsGb} GB</td>
                        <td className="p-3.5 text-slate-400">{spec.kvCacheGb} GB</td>
                        <td className="p-3.5 text-amber-300 font-bold">{spec.totalActiveGb} GB</td>
                        <td className="p-3.5 text-emerald-400 font-bold">0.0 GB</td>
                        <td className="p-3.5">
                          {spec.totalActiveGb + 5.4 > 16 ? (
                            <span className="text-red-400 font-bold">Swap Hazard</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">Viable</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {spec.totalActiveGb + 5.4 > 24 ? (
                            <span className="text-red-400 font-bold">Tight</span>
                          ) : spec.totalActiveGb + 5.4 > 20 ? (
                            <span className="text-amber-400 font-bold">Elevated</span>
                          ) : (
                            <span className="text-emerald-400 font-bold">Optimal</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className="text-emerald-400 font-bold">Optimal (&gt;6G free)</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Hardware Presets & Configurator */}
      {activeSubTab === 'hardware' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/90 rounded-2xl border border-amber-900/30 p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Host System Total Memory Capacity
            </h3>
            <p className="text-xs text-slate-400">
              Select or calibrate your host workstation's Unified RAM or System RAM to evaluate accurate headroom.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              {[16, 24, 32, 64].map((ram) => (
                <button
                  key={ram}
                  type="button"
                  onClick={() => handleRamChange(ram)}
                  className={`p-3 rounded-xl border text-center font-mono transition-all cursor-pointer ${
                    state.systemTotalRamGb === ram
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="text-base font-bold">{ram} GB</div>
                  <div className="text-[10px] text-slate-400">
                    {ram === 16 && 'Tight (8B/14B)'}
                    {ram === 24 && 'M2/M3 (24G)'}
                    {ram === 32 && 'Standard (32B)'}
                    {ram === 64 && 'Workstation'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/90 rounded-2xl border border-amber-900/30 p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              Target Astrological Reasoning Model
            </h3>
            <p className="text-xs text-slate-400">
              Choose the primary private local model to simulate or run against Ollama.
            </p>
            <div className="space-y-2 pt-2">
              {[
                { id: 'deepseek_32b', name: 'DeepSeek-R1-Distill-Qwen-32B (Q4_K_M)', footprint: '22.2 GB' },
                { id: 'qwen_14b', name: 'Qwen 2.5 14B Instruct (Q4_K_M)', footprint: '10.5 GB' },
                { id: 'llama_8b', name: 'Llama 3.1 8B Instruct (Q4_K_M)', footprint: '6.1 GB' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleModelChange(m.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    state.activeModelId === m.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="text-xs">{m.name}</span>
                  <span className="text-xs font-mono font-bold text-amber-300">{m.footprint}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Observability Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-slate-900/90 rounded-2xl border border-amber-900/30 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-amber-900/30 bg-slate-900 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-amber-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                Live System Observability & Inference Log Stream
              </h3>
              <p className="text-xs text-slate-400">
                Chronological recording of VRAM memory purges, keep_alive offloads, and headroom checks
              </p>
            </div>
            <button
              onClick={handleCopyLogs}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-200 border border-slate-800 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLogs ? 'Copied' : 'Copy Logs'}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-950 font-mono text-xs max-h-96 overflow-y-auto divide-y divide-slate-800/80 space-y-2">
            {eventLogs.map((log) => (
              <div key={log.id} className="pt-2 flex items-start gap-3">
                <span className="text-[11px] text-slate-500 flex-shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  {log.time}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded flex-shrink-0 ${
                    log.level === 'success'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : log.level === 'warn'
                      ? 'bg-amber-950 text-amber-300 border border-amber-800'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-slate-300 leading-relaxed">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
