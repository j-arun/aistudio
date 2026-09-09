// Document Version 1.1: Self-Contained Markdown Report Renderer
// Pure React implementation with zero external dependencies (no react-markdown required)
// Provides high-contrast, structured Parashari report rendering with headings, badges, and clean spacing

import React, { useMemo } from 'react';

interface MarkdownReportRendererProps {
  content: string;
  className?: string;
  modelBadge?: string;
}

interface InlineToken {
  type: 'text' | 'bold' | 'italic' | 'code' | 'bold_italic';
  text: string;
}

/**
 * Parses inline markdown tokens (bold, italic, inline code)
 */
function parseInline(text: string): React.ReactNode[] {
  // Regex to match ***bold italic***, **bold**, *italic*, `code`
  const regex = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // ***bold italic***
      nodes.push(
        <strong key={match.index} className="text-amber-200 font-bold italic font-serif">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // **bold**
      nodes.push(
        <strong key={match.index} className="text-amber-200 font-semibold">
          {match[3]}
        </strong>
      );
    } else if (match[4]) {
      // *italic*
      nodes.push(
        <em key={match.index} className="text-amber-300/90 italic font-serif">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // `code`
      nodes.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-mono text-[10.5px]"
        >
          {match[5]}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

type Block =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'codeblock'; language?: string; code: string }
  | { type: 'hr' }
  | { type: 'paragraph'; text: string };

function parseMarkdownBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // Code block
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'codeblock', language, code: codeLines.join('\n') });
      i++; // Skip closing ```
      continue;
    }

    // Headings
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h1', text: trimmed.slice(2).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() });
      i++;
      continue;
    }
    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'h4', text: trimmed.slice(5).trim() });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        bqLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: bqLines.join(' ') });
      continue;
    }

    // Unordered List
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered List
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const splitRow = (row: string) =>
          row
            .slice(1, -1)
            .split('|')
            .map((c) => c.trim());

        const headers = splitRow(tableLines[0]);
        // Row 1 is usually the separator |-|-|-|
        const startIndex = /^\|?[\s-:]+\|?$/.test(tableLines[1].replace(/\|/g, '')) ? 2 : 1;
        const rows = tableLines.slice(startIndex).map(splitRow);

        blocks.push({ type: 'table', headers, rows });
        continue;
      }
    }

    // Paragraph
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('>') &&
      !/^[-*+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !(lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) &&
      !/^[-*_]{3,}$/.test(lines[i].trim())
    ) {
      pLines.push(lines[i].trim());
      i++;
    }
    if (pLines.length > 0) {
      blocks.push({ type: 'paragraph', text: pLines.join(' ') });
    }
  }

  return blocks;
}

export const MarkdownReportRenderer: React.FC<MarkdownReportRendererProps> = ({
  content,
  className = '',
  modelBadge,
}) => {
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <div className={`prose prose-invert max-w-none text-slate-200 text-xs leading-relaxed font-sans ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'h1':
            return (
              <div key={idx} className="mt-4 mb-2 pb-1.5 border-b border-amber-800/40 flex items-center justify-between">
                <h1 className="text-sm sm:text-base font-bold text-amber-200 tracking-wide font-mono">
                  {parseInline(block.text)}
                </h1>
                {modelBadge && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/40 text-amber-300">
                    {modelBadge}
                  </span>
                )}
              </div>
            );
          case 'h2':
            return (
              <h2 key={idx} className="text-xs sm:text-sm font-bold text-amber-300 font-mono mt-3.5 mb-1.5 border-b border-slate-800/80 pb-1">
                {parseInline(block.text)}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={idx} className="text-xs font-bold text-amber-100/90 font-mono mt-2.5 mb-1">
                {parseInline(block.text)}
              </h3>
            );
          case 'h4':
            return (
              <h4 key={idx} className="text-[11.5px] font-bold text-slate-300 font-mono mt-2 mb-1">
                {parseInline(block.text)}
              </h4>
            );
          case 'paragraph':
            return (
              <p key={idx} className="mb-2 text-slate-300 text-[11.5px] leading-relaxed">
                {parseInline(block.text)}
              </p>
            );
          case 'blockquote':
            return (
              <blockquote key={idx} className="my-2.5 pl-3 border-l-2 border-amber-500/60 bg-amber-950/20 py-1.5 pr-2 rounded-r text-[11px] text-amber-200/90 italic">
                {parseInline(block.text)}
              </blockquote>
            );
          case 'ul':
            return (
              <ul key={idx} className="list-disc pl-4 space-y-1 mb-2.5 text-[11.5px] text-slate-300 marker:text-amber-400">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="pl-0.5 leading-relaxed">
                    {parseInline(item)}
                  </li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={idx} className="list-decimal pl-4 space-y-1 mb-2.5 text-[11.5px] text-slate-300 marker:text-amber-400">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="pl-0.5 leading-relaxed">
                    {parseInline(item)}
                  </li>
                ))}
              </ol>
            );
          case 'table':
            return (
              <div key={idx} className="overflow-x-auto my-2.5 rounded-lg border border-slate-800">
                <table className="min-w-full text-[11px] text-left divide-y divide-slate-800">
                  <thead className="bg-slate-900 text-amber-300 font-mono text-[10px] uppercase">
                    <tr>
                      {block.headers.map((h, hIdx) => (
                        <th key={hIdx} className="px-3 py-2 font-bold">
                          {parseInline(h)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-950/60">
                    {block.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-1.5 text-slate-300">
                            {parseInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'codeblock':
            return (
              <pre key={idx} className="my-2.5 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[10.5px] font-mono text-amber-200 overflow-x-auto">
                <code>{block.code}</code>
              </pre>
            );
          case 'hr':
            return <hr key={idx} className="my-3 border-slate-800" />;
          default:
            return null;
        }
      })}
    </div>
  );
};
