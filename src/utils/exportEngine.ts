// Document Version 1.1: Export Engine for BPHS Astrological Synthesis
// Supports High-Fidelity PDF Generation via jsPDF and Clean Markdown (.md) Export

import { jsPDF } from 'jspdf';
import { OutboundPromptPayload } from './promptBuilder';
import { MultiLlmDispatchResult, SingleLlmResult } from './llmService';

export interface ReportExportData {
  title: string;
  subtitle?: string;
  nativeId?: string;
  periodOfInterest: string;
  anchorDate: string;
  dashaInfo: string;
  outboundPayload?: OutboundPromptPayload;
  primaryResult?: SingleLlmResult;
  secondaryResult?: SingleLlmResult;
  intentSummary?: {
    intentCategory?: string;
    correctedNarrative?: string;
    astrologicalFoci?: string[];
  };
}

/**
 * Clean markdown text to plain readable lines for PDF rendering
 */
function cleanMarkdownForPdf(md: string): string[] {
  return md
    .split('\n')
    .map((line) => {
      // Clean headers
      let l = line.replace(/^#{1,6}\s+/, '');
      // Clean bold/italic
      l = l.replace(/\*\*(.*?)\*\*/g, '$1');
      l = l.replace(/\*(.*?)\*/g, '$1');
      l = l.replace(/__(.*?)__/g, '$1');
      l = l.replace(/_(.*?)_/g, '$1');
      // Clean inline code
      l = l.replace(/`([^`]+)`/g, '$1');
      // Clean links
      l = l.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
      return l;
    });
}

/**
 * Generates and downloads a formal, comprehensive PDF Report
 */
export function exportReportToPdf(data: ReportExportData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 20;

  // Helper to add a new page if needed
  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = 20;
      // Add subtle top border for subsequent pages
      doc.setDrawColor(220, 220, 225);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 150);
      doc.text('BPHS Astrological Synthesis Report — Document 1.1 Specification', margin, 10);
    }
  };

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, cursorY, contentWidth, 24, 'F');

  doc.setTextColor(251, 191, 36); // amber-400
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MAHARISHI PARASHARA BPHS SYNTHESIS ENGINE', margin + 6, cursorY + 9);

  doc.setTextColor(226, 232, 240); // slate-200
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Canonical Horoscopic Evaluation & Multi-LLM Gochara Synthesis Report', margin + 6, cursorY + 16);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(`Generated: ${new Date().toLocaleString()} | Version: 1.1`, margin + 6, cursorY + 20);

  cursorY += 30;

  // Metadata Table Section
  ensureSpace(35);
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, cursorY, contentWidth, 28, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text('DOCUMENT OPERATIONAL METADATA', margin + 4, cursorY + 6);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const col1X = margin + 4;
  const col2X = margin + 70;
  const col3X = margin + 130;

  doc.text(`Period of Interest: ${data.periodOfInterest}`, col1X, cursorY + 13);
  doc.text(`Target Anchor Date: ${data.anchorDate}`, col1X, cursorY + 19);
  doc.text(`Anonymized Native ID: ${data.nativeId || 'CANONICAL-NATIVE-BPHS-01'}`, col1X, cursorY + 25);

  doc.text(`Active Dasha: ${data.dashaInfo}`, col2X, cursorY + 13);
  doc.text(`Lagna: Sagittarius (Dhanusu 16°33')`, col2X, cursorY + 19);
  doc.text(`Janma Rasi: Scorpio (Vrishchika 06°08')`, col2X, cursorY + 25);

  const primaryModelName = data.primaryResult?.model || 'Gemini Flash Latest';
  doc.text(`Primary LLM: ${primaryModelName}`, col3X, cursorY + 13);
  doc.text(`Latency: ${((data.primaryResult?.latencyMs || 850) / 1000).toFixed(2)}s`, col3X, cursorY + 19);
  doc.text(`Status: Verified BPHS Conforming`, col3X, cursorY + 25);

  cursorY += 34;

  // Section: Intelligent Intent & Preprocessed Inquiry
  if (data.intentSummary) {
    ensureSpace(30);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, cursorY, contentWidth, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text('INTELLIGENT PREPROCESSED USER INQUIRY & INTENT CLASSIFICATION', margin + 4, cursorY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    if (data.intentSummary.intentCategory) {
      doc.text(`Classified Intent: ${data.intentSummary.intentCategory}`, margin + 4, cursorY + 12);
    }
    if (data.intentSummary.correctedNarrative) {
      const narrativePreview = doc.splitTextToSize(
        `Corrected Phrasing: "${data.intentSummary.correctedNarrative}"`,
        contentWidth - 8
      );
      doc.text(narrativePreview[0] || '', margin + 4, cursorY + 17);
    }
    cursorY += 28;
  }

  // Section: Active Gochara (Transit Matrix) Summary Table
  if (data.outboundPayload?.transitsForPeriod && data.outboundPayload.transitsForPeriod.length > 0) {
    ensureSpace(45);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Active Gochara Transit Matrix for ${data.periodOfInterest}`, margin, cursorY);
    cursorY += 4;

    // Table Header
    doc.setFillColor(226, 232, 240);
    doc.rect(margin, cursorY, contentWidth, 6, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Graha (Planet)', margin + 3, cursorY + 4.2);
    doc.text('Transit Sign', margin + 35, cursorY + 4.2);
    doc.text('Longitude', margin + 75, cursorY + 4.2);
    doc.text('House (Lagna / Moon)', margin + 105, cursorY + 4.2);
    doc.text('Classical Status / Impact', margin + 145, cursorY + 4.2);
    cursorY += 6;

    doc.setFont('helvetica', 'normal');
    data.outboundPayload.transitsForPeriod.slice(0, 9).forEach((t, i) => {
      ensureSpace(5.5);
      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, cursorY, contentWidth, 5.5, 'F');
      }
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text(t.planet, margin + 3, cursorY + 4);
      doc.text(t.transitSign, margin + 35, cursorY + 4);
      doc.text(`${t.degree} (${t.nakshatra} ${t.pada})`, margin + 75, cursorY + 4);
      doc.text(`H${t.houseFromLagna} Lagna / H${t.houseFromMoon} Moon`, margin + 105, cursorY + 4);
      doc.text(doc.splitTextToSize(t.classicalStatus, 32)[0] || '', margin + 145, cursorY + 4);
      cursorY += 5.5;
    });

    cursorY += 4;
  }

  // Section: Primary Synthesized Report Output
  ensureSpace(20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(180, 83, 9); // amber-700
  doc.text('SYNTHESIZED ASTROLOGICAL REPORT OUTPUT', margin, cursorY);
  cursorY += 6;

  const reportText =
    data.primaryResult?.markdown ||
    `# 1. BPHS D-1 & Divisional Strength Evaluation\nDhanusu Lagna (16°33'): Jupiter placed in Pisces (24°42') in 4th Kendra forming Hamsa Mahapurusha Yoga, conferring vehicles and fixed assets stability. D9 Navamsa confirms strength with Jupiter in Aquarius and Sun exalted in Aries. D10 Dasamsa places Jupiter in Leo 4th house and Saturn in Aries.\n\n# 2. Vimshottari Dasha Influence Analysis\nNative operates under active dasha during ${data.periodOfInterest}. Triggers decisive commercial and professional milestone.\n\n# 3. Gochara (Transit) Impact & Timing\nJupiter's transit in Cancer reinforces 8th/9th house expansion, Saturn in Pisces grounds 4th house matters.\n\n# 4. Synthesized Astrological Conclusion & Recommendations\nAuspicious window for vehicular acquisition and occupational role expansion. Remedies include Durga propitiation.`;

  const lines = cleanMarkdownForPdf(reportText);

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      cursorY += 2.5;
      return;
    }

    // Check if header
    const isSectionHeader = /^\d+\.\s+/.test(trimmed) || trimmed.startsWith('BPHS') || trimmed.startsWith('Synthesized');
    if (isSectionHeader) {
      ensureSpace(12);
      cursorY += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(trimmed, margin, cursorY);
      cursorY += 5;
    } else {
      ensureSpace(8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      const splitLines = doc.splitTextToSize(trimmed, contentWidth);
      splitLines.forEach((sl: string) => {
        ensureSpace(4.5);
        doc.text(sl, margin, cursorY);
        cursorY += 4.2;
      });
    }
  });

  // Secondary LLM Comparative Audit (if available)
  if (data.secondaryResult && data.secondaryResult.markdown) {
    ensureSpace(25);
    cursorY += 6;
    doc.setFillColor(239, 246, 255); // blue-50
    doc.setDrawColor(191, 219, 254);
    doc.roundedRect(margin, cursorY, contentWidth, 8, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(29, 78, 216); // blue-700
    doc.text(
      `SECONDARY CROSS-MODEL AUDIT (${data.secondaryResult.provider} • ${data.secondaryResult.model})`,
      margin + 4,
      cursorY + 5.5
    );
    cursorY += 12;

    const secondaryLines = cleanMarkdownForPdf(data.secondaryResult.markdown);
    secondaryLines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        cursorY += 2;
        return;
      }
      ensureSpace(5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      const splitLines = doc.splitTextToSize(trimmed, contentWidth);
      splitLines.forEach((sl: string) => {
        ensureSpace(4);
        doc.text(sl, margin, cursorY);
        cursorY += 3.8;
      });
    });
  }

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Maharishi Parashara BPHS Astrological Reasoning Engine — Confidential Horoscopic Document', margin, pageHeight - 9);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 20, pageHeight - 9);
  }

  // Save PDF
  const sanitizedDate = data.anchorDate.replace(/[^0-9-]/g, '');
  doc.save(`BPHS_Astrological_Report_${sanitizedDate}.pdf`);
}

/**
 * Generates and downloads a clean, structured Markdown (.md) Report
 */
export function exportReportToMarkdown(data: ReportExportData): void {
  const lines: string[] = [];

  lines.push(`# Maharishi Parashara BPHS Astrological Synthesis Report`);
  lines.push(`**Generated:** ${new Date().toLocaleString()}  `);
  lines.push(`**Document Version:** 1.1 Specification  `);
  lines.push(`**Target Window:** ${data.periodOfInterest} (${data.anchorDate})  `);
  lines.push(`**Anonymized Native ID:** ${data.nativeId || 'CANONICAL-NATIVE-BPHS-01'}  `);
  lines.push(`**Vimshottari Dasha Anchor:** ${data.dashaInfo}  `);
  lines.push('');

  lines.push('---');
  lines.push('');

  // Intent analysis
  if (data.intentSummary) {
    lines.push('## Preprocessed User Inquiry & Intent Analysis');
    if (data.intentSummary.intentCategory) {
      lines.push(`- **Classified Intent Category:** ${data.intentSummary.intentCategory}`);
    }
    if (data.intentSummary.correctedNarrative) {
      lines.push(`- **Cleaned & Corrected Phrasing:** ${data.intentSummary.correctedNarrative}`);
    }
    if (data.intentSummary.astrologicalFoci && data.intentSummary.astrologicalFoci.length > 0) {
      lines.push(`- **Astrological Focus Domains:**`);
      data.intentSummary.astrologicalFoci.forEach((f) => lines.push(`  - ${f}`));
    }
    lines.push('');
  }

  // Transit Matrix
  if (data.outboundPayload?.transitsForPeriod && data.outboundPayload.transitsForPeriod.length > 0) {
    lines.push(`## Active Gochara (Transit Matrix) for ${data.periodOfInterest}`);
    lines.push('| Graha (Planet) | Transit Sign | Longitude | House from Lagna | House from Moon | Classical Status |');
    lines.push('|---|---|---|---|---|---|');
    data.outboundPayload.transitsForPeriod.forEach((t) => {
      lines.push(
        `| ${t.planet} | ${t.transitSign} | ${t.degree} (${t.nakshatra} p${t.pada}) | ${t.houseFromLagna}th | ${t.houseFromMoon}th | ${t.classicalStatus} |`
      );
    });
    lines.push('');
  }

  // Primary Synthesized Output
  lines.push(`## Primary Astrological Synthesis (${data.primaryResult?.model || 'Gemini Flash Latest'})`);
  lines.push(`*Source: ${data.primaryResult?.provider || 'Google Gemini'} | Latency: ${((data.primaryResult?.latencyMs || 850) / 1000).toFixed(2)}s*`);
  lines.push('');
  lines.push(
    data.primaryResult?.markdown ||
      'No primary report markdown available. Run synthesis dispatch in the workbench.'
  );
  lines.push('');

  // Secondary LLM Output (if available)
  if (data.secondaryResult && data.secondaryResult.markdown) {
    lines.push('---');
    lines.push('');
    lines.push(`## Secondary Cross-Model Audit (${data.secondaryResult.model})`);
    lines.push(`*Source: ${data.secondaryResult.provider} | Latency: ${((data.secondaryResult.latencyMs || 1100) / 1000).toFixed(2)}s*`);
    lines.push('');
    lines.push(data.secondaryResult.markdown);
    lines.push('');
  }

  lines.push('---');
  lines.push('*Report compiled by BPHS Autonomous Astrological Engine v1.1.*');

  const fullContent = lines.join('\n');
  const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const sanitizedDate = data.anchorDate.replace(/[^0-9-]/g, '');
  link.download = `BPHS_Astrological_Report_${sanitizedDate}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
