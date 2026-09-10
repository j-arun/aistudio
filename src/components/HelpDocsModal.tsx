import React from 'react';
import {
  X,
  FileText,
  Printer,
  Download,
  Shield,
  FileCode,
  Cpu,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import {
  exportProductDocsToPdf,
  exportProductDocsToMarkdown,
} from '../utils/productDocsPdfEngine';

interface HelpDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpDocsModal: React.FC<HelpDocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-950 border-b border-amber-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30 uppercase font-bold">
                  Official Product Spec
                </span>
                <span className="text-xs text-slate-400 font-mono">v1.0.0 Production Release</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-amber-200">
                System Help: SRS & System Design Document (SDD)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportProductDocsToPdf()}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
              title="Print or Save to PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => exportProductDocsToMarkdown()}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-700/40 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Download as Markdown (.md)"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Markdown</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-slate-300 text-xs leading-relaxed font-sans">
          {/* Document Summary Card */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-amber-300 font-mono">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-400" />
                Document Reference: <strong>RAAT-SRS-SDD-V1.0</strong>
              </span>
              <span>Sign-Off: September 9, 2026</span>
            </div>
            <p className="text-slate-300">
              The <strong>Rooster Astro Analytical Tool</strong> is a desktop-grade, zero-ingress Vedic astrological research platform. It executes deterministic mathematical calculations conforming strictly to Sage Parashara's <em>Brihat Parasara Hora Sastra (BPHS)</em>, interfaces with private local reasoning servants (DeepSeek-R1 32B, Qwen 2.5 14B, and Llama 3.1 8B), and facilitates dual-model comparative cross-validation while protecting querent privacy.
            </p>
          </div>

          {/* Quick Specifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-2">
                <FileCode className="w-4 h-4" />
                <span>1. Requirements Matrix (SRS)</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
                <li>Canonical D1-D12 BPHS Divisional charts</li>
                <li>9-Planet Gochara Ingress & transit matrix</li>
                <li>Vimshottari Dasha 3-tier calculations</li>
                <li>Tamil Jathagam 54-page PDF extraction</li>
                <li>Hardware sizing for DeepSeek 32B & Qwen 14B</li>
                <li><strong>Strict Practical Realities Only</strong> (Zero remedies)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-2">
                <Cpu className="w-4 h-4" />
                <span>2. System Architecture (SDD)</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
                <li>Client-side deterministic mathematical core</li>
                <li>Asynchronous multi-LLM comparative orchestrator</li>
                <li>Outbound 3-Form XML Contract standard</li>
                <li>Real-time VRAM monitor with <code className="text-amber-300">keep_alive: 0</code></li>
                <li>Regular expression PII sanitizer engine</li>
                <li>Vector print-to-PDF engine with Rooster Icon</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-2">
                <CheckCircle className="w-4 h-4" />
                <span>3. Acceptance & Repository Specs</span>
              </div>
              <ul className="text-[11px] text-slate-300 space-y-1 list-disc pl-4">
                <li><strong>Status:</strong> Final Delivery Accepted & Verified</li>
                <li><strong>SRS Spec:</strong> Committed at <code className="text-amber-300">/REQUIREMENTS.md</code></li>
                <li><strong>Design Doc:</strong> Committed at <code className="text-amber-300">/DESIGN.md</code></li>
                <li><strong>Print Ready:</strong> Vector CSS A4 formatting</li>
                <li><strong>Headroom:</strong> Integrated memory monitor</li>
              </ul>
            </div>
          </div>

          {/* Section: Practical Realities Mandate */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-2">
            <h4 className="text-amber-300 font-bold text-xs uppercase tracking-wider">
              Strict Practical Realities Mandate (Zero Superstitious Remedies)
            </h4>
            <p className="text-[11px] text-slate-300">
              All remedial advice generated or synthesized by the platform is strictly filtered to exclude gemstones, mantras, pujas, temple rituals, and animal feedings. Outputs are focused solely on actionable, real-world strategic milestones: comprehensive contractual reviews, warranty verifications, contingency liquidity buffers, and phased timeline management.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 font-mono text-[11px]">
            Rooster Astro Analytical Tool • Product Owner: <span className="text-amber-300">inboxofarun@gmail.com</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportProductDocsToPdf()}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Launch Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
