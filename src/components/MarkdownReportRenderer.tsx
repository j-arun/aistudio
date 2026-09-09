// Document Version 1.1: Markdown Report Renderer
// Provides high-contrast, structured Parashari report rendering with headings, badges, and clean spacing

import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownReportRendererProps {
  content: string;
  className?: string;
  modelBadge?: string;
}

export const MarkdownReportRenderer: React.FC<MarkdownReportRendererProps> = ({
  content,
  className = '',
  modelBadge,
}) => {
  return (
    <div className={`prose prose-invert max-w-none text-slate-200 text-xs leading-relaxed font-sans ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <div className="mt-4 mb-2 pb-1.5 border-b border-amber-800/40 flex items-center justify-between">
              <h1 className="text-sm sm:text-base font-bold text-amber-200 tracking-wide font-mono">
                {children}
              </h1>
              {modelBadge && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/40 text-amber-300">
                  {modelBadge}
                </span>
              )}
            </div>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs sm:text-sm font-bold text-amber-300 font-mono mt-3.5 mb-1.5 border-b border-slate-800/80 pb-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-amber-100/90 font-mono mt-2.5 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[11.5px] font-bold text-slate-300 font-mono mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-2 text-slate-300 text-[11.5px] leading-relaxed">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="text-amber-200 font-semibold">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="text-amber-300/90 italic font-serif">{children}</em>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 space-y-1 mb-2.5 text-[11.5px] text-slate-300 marker:text-amber-400">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 space-y-1 mb-2.5 text-[11.5px] text-slate-300 marker:text-amber-400">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-2.5 pl-3 border-l-2 border-amber-500/60 bg-amber-950/20 py-1.5 pr-2 rounded-r text-[11px] text-amber-200/90 italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-mono text-[10.5px]">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2.5 rounded-lg border border-slate-800">
              <table className="min-w-full text-[11px] text-left divide-y divide-slate-800">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-900 text-amber-300 font-mono text-[10px] uppercase">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-slate-900/40 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 font-bold">{children}</th>,
          td: ({ children }) => <td className="px-3 py-1.5 text-slate-300">{children}</td>,
          hr: () => <hr className="my-3 border-slate-800" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
