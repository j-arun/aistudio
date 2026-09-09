// Specification ID: SRS-REQ-1.3-1.4
// Section 2.2: Dynamic Modal Popup & Multi-Box Intake System ("Dabbas")
// Interactive Modal overlay with individual reasoning question cards, N/A scrubbing,
// timeline validation, and 3-Form XML state merging.

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  X,
  Send,
  HelpCircle,
  Clock,
  Layers,
  FileCheck,
  ArrowRight,
  FilterX,
} from 'lucide-react';
import {
  ReasoningQuestion,
  ServantEvaluationResult,
  mergeServantState,
} from '../utils/privateLlmServant';
import {
  flushModelFromMemory,
  getResourceMonitorState,
  notifyModelLoaded,
} from '../utils/resourceMonitor';

interface ReasoningServantModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: ServantEvaluationResult;
  onCompleteIntake: (mergedData: {
    mergedNarrative: string;
    finalTimeline: string;
    validAnswers: ReasoningQuestion[];
    scrubbedNaCount: number;
    autoDispatch: boolean;
  }) => void;
}

export const ReasoningServantModal: React.FC<ReasoningServantModalProps> = ({
  isOpen,
  onClose,
  evaluation,
  onCompleteIntake,
}) => {
  const [questions, setQuestions] = useState<ReasoningQuestion[]>(evaluation.questions);
  const [timelineInput, setTimelineInput] = useState<string>(evaluation.normalizedTimeline);

  // When modal is active, the 32B model is resident in memory for intake reasoning
  React.useEffect(() => {
    if (isOpen) {
      notifyModelLoaded();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTextChange = (id: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, responseValue: value } : q))
    );
  };

  const handleToggleNa = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, isNotApplicable: !q.isNotApplicable } : q
      )
    );
  };

  const handleFinalSubmit = (autoDispatch: boolean = false) => {
    // Ensure timeline box updates the timeline question if present
    const updatedQuestions = questions.map((q) => {
      if (q.category === 'timeline_yyyy_mm') {
        return { ...q, responseValue: timelineInput };
      }
      return q;
    });

    const mergeResult = mergeServantState(evaluation, updatedQuestions);

    // Auto-offload 32B model from memory immediately upon prompt validation (keep_alive: 0)
    const monitorSettings = getResourceMonitorState();
    if (monitorSettings.autoFlushOnPromptValidation) {
      flushModelFromMemory({ reason: 'prompt_validated' });
    }

    onCompleteIntake({
      mergedNarrative: mergeResult.mergedNarrative,
      finalTimeline: mergeResult.finalTimeline || timelineInput,
      validAnswers: mergeResult.validAnswers,
      scrubbedNaCount: mergeResult.scrubbedCount,
      autoDispatch,
    });
    onClose();
  };

  const activeQuestionsCount = questions.filter((q) => !q.isNotApplicable).length;
  const scrubbedNaCount = questions.filter((q) => q.isNotApplicable).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl shadow-amber-950/50 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-b border-amber-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-amber-200">
                  Private LLM Reasoning Servant Intake
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950 border border-amber-700 text-amber-300">
                  SRS-REQ-1.3-1.4
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Multi-Box Intake System ("Dabbas") & Chronological Timeline Validation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Narrative & Density Summary Banner */}
        <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300">
              Scrubbed & Compressed: <strong className="text-emerald-300">{evaluation.metrics.tokenCompressionRatio}</strong>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-amber-300">
              {evaluation.metrics.gapsIdentifiedCount} context gaps identified
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">Active Boxes: <strong className="text-amber-300">{activeQuestionsCount}</strong></span>
            {scrubbedNaCount > 0 && (
              <span className="text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-900/50 flex items-center gap-1">
                <FilterX className="w-3 h-3" />
                {scrubbedNaCount} marked N/A (purged)
              </span>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Compressed Narrative Display */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="font-semibold text-amber-400">Density-Tuned Core Narrative:</span>
              <span className="text-emerald-400">Conversational filler purged</span>
            </div>
            <p className="text-xs text-slate-200 italic font-sans leading-relaxed">
              "{evaluation.compressedNarrative}"
            </p>
          </div>

          {/* Master Timeline Validation Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-600/40 flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300 font-mono">
                  Pillar 1: Timeline Chronological Anchor (YYYY-MM)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/60 text-amber-300">
                Mandatory for Gochara & Pratyantardasha
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={timelineInput}
                  onChange={(e) => setTimelineInput(e.target.value)}
                  placeholder="YYYY-MM (e.g. 2026-09)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-200 text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-slate-400 font-mono">Presets:</span>
                {['2026-06', '2026-09', '2026-11', '2027-01'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setTimelineInput(preset)}
                    className={`px-2 py-1 rounded text-[10px] font-mono border cursor-pointer transition-colors ${
                      timelineInput === preset
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Parashari Gochara transit analysis evaluates exact planetary degree ingress windows matching your chosen YYYY-MM anchor.
            </p>
          </div>

          {/* TARGETED QUESTION BOXES ("DABBAS") */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300 px-0.5">
              <span>Targeted Context Clarification Boxes ("Dabbas"):</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Answer where applicable or mark N/A to permanently scrub
              </span>
            </div>

            {questions.map((q, idx) => {
              const isNa = q.isNotApplicable;

              return (
                <div
                  key={q.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isNa
                      ? 'bg-slate-950/40 border-slate-800 opacity-60'
                      : 'bg-slate-950/90 border-amber-900/50 hover:border-amber-700/60 shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10.5px] font-bold flex items-center justify-center border border-amber-500/30">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-amber-200">
                        {q.title}
                      </h4>
                      <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {q.pillar === 'timeline' ? 'Pillar 1' : 'Pillar 2'}
                      </span>
                    </div>

                    {/* N/A Toggle Button per SRS */}
                    <button
                      type="button"
                      onClick={() => handleToggleNa(q.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 border ${
                        isNa
                          ? 'bg-rose-950/80 text-rose-300 border-rose-800 hover:bg-rose-900'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-amber-200'
                      }`}
                      title="Click to mark as Not Applicable (permanently omitted from final prompt)"
                    >
                      {isNa ? (
                        <>
                          <FilterX className="w-3 h-3 text-rose-400" />
                          <span>Marked N/A (Scrubbed)</span>
                        </>
                      ) : (
                        <span>Mark as N/A</span>
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                    {q.description}
                  </p>

                  {/* Astrological Justification Pill */}
                  <div className="p-2 rounded-lg bg-slate-900/80 border border-amber-950/60 mb-2.5 text-[11px] text-amber-300/90 flex items-start gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-amber-200">Astrological Reasoning:</strong>{' '}
                      {q.astrologicalJustification}
                    </span>
                  </div>

                  {/* Input area or N/A placeholder */}
                  {isNa ? (
                    <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/30 text-[11px] font-mono text-rose-300/80 italic flex items-center justify-between">
                      <span>✓ Question marked as Not Applicable — Permanently scrubbed and omitted from final 3-Form XML.</span>
                      <button
                        type="button"
                        onClick={() => handleToggleNa(q.id)}
                        className="text-[10px] underline hover:text-rose-200 cursor-pointer"
                      >
                        Restore
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <textarea
                        rows={2}
                        value={q.responseValue}
                        onChange={(e) => handleTextChange(q.id, e.target.value)}
                        placeholder={q.suggestedValue ? `e.g., ${q.suggestedValue}` : 'Provide specific context here...'}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400 font-sans"
                      />
                      {q.suggestedValue && !q.responseValue && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                          <span>Suggested default:</span>
                          <button
                            type="button"
                            onClick={() => handleTextChange(q.id, q.suggestedValue!)}
                            className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
                          >
                            Use "{q.suggestedValue}"
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer with 3-Form Actions */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/40 border-t border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Assembling <strong className="text-amber-300">3-Form XML</strong> (Transit + Natal + Validated Narrative)
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/90 flex items-center gap-1.5 pl-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Auto-Offload Active: 32B weights will purge from VRAM (keep_alive: 0) on submission</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleFinalSubmit(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-600/40 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow"
            >
              <FileCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Compile 3-Form XML</span>
            </button>

            <button
              type="button"
              onClick={() => handleFinalSubmit(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Final Submit & Stream Master LLM</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
