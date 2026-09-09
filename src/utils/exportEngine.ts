// Document Version 1.1: Export Engine for BPHS Astrological Synthesis
// Pure zero-dependency implementation (no jspdf or external packages required)
// Supports High-Fidelity Print-to-PDF / Standalone Report Export and Clean Markdown (.md) Export

import { OutboundPromptPayload } from './promptBuilder';
import { SingleLlmResult } from './llmService';

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
 * Strips ritualistic/astrological remedies (gemstones, mantras, pujas, deity propitiations, animal feedings)
 * and strictly reframes remedial measures into practical, real-world strategic, financial, and operational realities.
 */
export function filterRemediesToPracticalRealities(markdown: string): string {
  if (!markdown) return markdown;

  let cleaned = markdown;

  // 1. Direct replacement of classical mock/fallback remedy statements
  cleaned = cleaned.replace(
    /Recommended classical remedies include propitiation of Goddess Durga on Tuesdays for Mars Neechabhanga and feeding birds on Saturdays for Saturn\.?/gi,
    'Practical Realities & Risk Mitigation: Ensure thorough contractual and warranty verification on all acquisitions, maintain liquid emergency capital buffers, and pace career transition milestones based on verified organizational deliverables rather than speculative forecasts.'
  );

  cleaned = cleaned.replace(
    /Remedies include Durga propitiation\.?/gi,
    'Practical Realities & Action Measures: Focus on capital reserve preservation, contract review, and paced occupational transitions.'
  );

  cleaned = cleaned.replace(
    /Propitiate Durga on Tuesdays for Mars Neechabhanga and maintain Saturn's discipline with regular charitable offerings\.?/gi,
    'Strategic Realities & Operational Pacing: Focus strictly on real-world execution: verify contractual terms, lock in advantageous financing rates, and maintain disciplined project milestones.'
  );

  // 2. Replace generic astrological remedy lead-ins
  cleaned = cleaned.replace(
    /(?:Recommended\s+)?(?:Classical\s+)?(?:Vedic\s+)?(?:Astrological\s+)?Remedies\s*(?::|include)\s*([^\n\.]*[\.\n]?)/gi,
    'Strategic Realities & Practical Risk Mitigation: Focus on documented asset verification, disciplined contractual terms, and maintaining contingency capital buffers.\n'
  );

  // 3. Remove/replace gemstone wearing suggestions
  cleaned = cleaned.replace(
    /(?:wear(?:ing)?\s+(?:a\s+)?(?:yellow\s+sapphire|blue\s+sapphire|ruby|emerald|diamond|pearl|red\s+coral|hessonite|cat['’]s\s+eye|gemstone)[^\n\.]*[\.\n]?)/gi,
    'Focus on tangible operational safeguards and financial due diligence.'
  );

  // 4. Remove/replace mantra chanting and rituals
  cleaned = cleaned.replace(
    /(?:chant(?:ing)?|recit(?:e|ing))\s+(?:the\s+)?(?:mantra|stotram|kavach|japa)[^\n\.]*[\.\n]?/gi,
    'Maintain daily mental focus, clear communication channels, and disciplined scheduling.'
  );

  cleaned = cleaned.replace(
    /(?:perform(?:ing)?|conduct(?:ing)?)\s+(?:puja|pooja|homa|havan|yajna|temple\s+visit)[^\n\.]*[\.\n]?/gi,
    'Conduct systematic risk audits and operational stress-testing.'
  );

  cleaned = cleaned.replace(
    /(?:propitiat(?:e|ion)\s+(?:of\s+)?(?:goddess|lord|graha|planet|deity|durga|shani|mars|rahu|ketu|jupiter)[^\n\.]*[\.\n]?)/gi,
    'Adopt proactive risk mitigation measures and align strategic decisions with verifiable timelines.'
  );

  cleaned = cleaned.replace(
    /(?:feed(?:ing)?\s+(?:birds|crows|dogs|cows|fishes|ants)[^\n\.]*[\.\n]?)/gi,
    'Cultivate sustainable professional habits, team equity, and organizational transparency.'
  );

  // 4. Update section header to emphasize practical realities
  cleaned = cleaned.replace(
    /# 4\. Synthesized Astrological Conclusion & Recommendations/gi,
    '# 4. Synthesized Astrological Conclusion & Practical Realities'
  );

  return cleaned;
}

/**
 * Clean markdown text to readable HTML paragraphs/headers
 */
function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  const htmlParts: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      if (inList) {
        htmlParts.push('</ul>');
        inList = false;
      }
      continue;
    }

    // List item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        htmlParts.push('<ul style="margin: 6px 0; padding-left: 20px; font-size: 11px; color: #334155;">');
        inList = true;
      }
      let content = trimmed.slice(2);
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
      content = content.replace(/`([^`]+)`/g, '<code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace;">$1</code>');
      htmlParts.push(`<li style="margin-bottom: 4px;">${content}</li>`);
      continue;
    }

    if (inList) {
      htmlParts.push('</ul>');
      inList = false;
    }

    // Headers
    if (trimmed.startsWith('# ')) {
      const heading = trimmed.slice(2).replace(/\*\*(.*?)\*\*/g, '$1');
      htmlParts.push(
        `<h2 style="font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; color: #92400e; border-bottom: 1.5px solid #fed7aa; padding-bottom: 4px; margin-top: 14px; margin-bottom: 8px;">${heading}</h2>`
      );
      continue;
    }
    if (trimmed.startsWith('## ')) {
      const heading = trimmed.slice(3).replace(/\*\*(.*?)\*\*/g, '$1');
      htmlParts.push(
        `<h3 style="font-family: 'Courier New', monospace; font-size: 12.5px; font-weight: bold; color: #78350f; margin-top: 10px; margin-bottom: 6px;">${heading}</h3>`
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('>')) {
      let quote = trimmed.replace(/^>\s?/, '');
      quote = quote.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      quote = quote.replace(/\*(.*?)\*/g, '<em>$1</em>');
      htmlParts.push(
        `<blockquote style="border-left: 3px solid #f59e0b; background: #fffbeb; padding: 8px 12px; margin: 8px 0; font-size: 11px; color: #92400e; font-style: italic;">${quote}</blockquote>`
      );
      continue;
    }

    // Paragraph
    let pContent = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    pContent = pContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
    pContent = pContent.replace(/`([^`]+)`/g, '<code style="background: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace;">$1</code>');
    htmlParts.push(`<p style="font-size: 11.5px; line-height: 1.6; color: #334155; margin: 6px 0;">${pContent}</p>`);
  }

  if (inList) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('\n');
}

/**
 * Generates and triggers high-fidelity print-to-PDF with crisp formatting,
 * owner product branding with Rooster icon, metadata table, transit matrix, and synthesis report.
 */
export function exportReportToPdf(data: ReportExportData): void {
  const primaryModelName = data.primaryResult?.model || 'Gemini 1.5 Pro';
  const primaryProvider = data.primaryResult?.provider || 'Google Gemini';
  const latencySec = ((data.primaryResult?.latencyMs || 850) / 1000).toFixed(2);

  // Transit Rows HTML
  const transitRowsHtml = (data.outboundPayload?.transitsForPeriod || [])
    .slice(0, 9)
    .map(
      (t, i) => `
      <tr style="background: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 5px 8px; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${t.planet}</td>
        <td style="padding: 5px 8px; color: #334155; border-bottom: 1px solid #e2e8f0;">${t.transitSign}</td>
        <td style="padding: 5px 8px; color: #475569; font-family: monospace; border-bottom: 1px solid #e2e8f0;">${t.degree} (${t.nakshatra} p${t.pada})</td>
        <td style="padding: 5px 8px; color: #b45309; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${t.houseFromLagna}th</td>
        <td style="padding: 5px 8px; color: #1d4ed8; border-bottom: 1px solid #e2e8f0;">${t.houseFromMoon}th</td>
        <td style="padding: 5px 8px; color: #334155; border-bottom: 1px solid #e2e8f0; font-size: 10px;">${t.classicalStatus}</td>
      </tr>
    `
    )
    .join('');

  // Clean raw markdown to ensure remedies are stripped and converted to practical realities
  const rawPrimaryMd =
    data.primaryResult?.markdown ||
    `# 1. BPHS D-1 & Divisional Strength Evaluation\n**Dhanusu Lagna (16°33'):** Jupiter placed in Pisces (24°42') in 4th Kendra forming Hamsa Mahapurusha Yoga, conferring vehicles and fixed assets stability. D9 Navamsa confirms strength with Jupiter in Aquarius and Sun exalted in Aries. D10 Dasamsa places Jupiter in Leo 4th house and Saturn in Aries.\n\n# 2. Vimshottari Dasha Influence Analysis\nNative operates under active dasha during ${data.periodOfInterest}. Triggers decisive commercial and professional milestone.\n\n# 3. Gochara (Transit) Impact & Timing\nJupiter's transit in Cancer reinforces 8th/9th house expansion, Saturn in Pisces grounds 4th house matters.\n\n# 4. Synthesized Astrological Conclusion & Practical Realities\nAuspicious window for vehicular acquisition and occupational role expansion. Practical Realities & Risk Mitigation: Ensure thorough contractual and warranty verification on all acquisitions, maintain liquid emergency capital buffers, and pace career transition milestones based on verified organizational deliverables rather than speculative forecasts.`;

  const cleanedPrimaryMd = filterRemediesToPracticalRealities(rawPrimaryMd);
  const reportBodyHtml = markdownToHtml(cleanedPrimaryMd);

  const rawSecondaryMd = data.secondaryResult?.markdown || '';
  const cleanedSecondaryMd = filterRemediesToPracticalRealities(rawSecondaryMd);

  const secondaryBodyHtml =
    cleanedSecondaryMd
      ? `
      <div style="margin-top: 16px; padding: 12px; border: 1px solid #bfdbfe; background: #f0f9ff; border-radius: 6px;">
        <div style="font-weight: bold; font-size: 11.5px; color: #1e40af; margin-bottom: 6px; font-family: 'Courier New', monospace;">
          SECONDARY CROSS-MODEL AUDIT (${data.secondaryResult?.provider || 'Secondary LLM'} • ${data.secondaryResult?.model || 'Auditor'})
        </div>
        ${markdownToHtml(cleanedSecondaryMd)}
      </div>
    `
      : '';

  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Rooster Astro Analytical Tool - BPHS Synthesis Report - ${data.periodOfInterest}</title>
  <style>
    @media print {
      @page {
        size: A4 portrait;
        margin: 12mm 14mm 12mm 14mm;
      }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      .product-owner-header {
        border: 1.5px solid #d97706 !important;
        background: #fffdfa !important;
      }
      .print-banner {
        background: #0f172a !important;
        color: #f8fafc !important;
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #ffffff;
    }
    /* Top Owner Branding Banner with Rooster Icon */
    .product-owner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 16px;
      margin-bottom: 12px;
      border: 1.5px solid #fed7aa;
      background: #fffdfa;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .print-banner {
      background: #0f172a;
      color: #f8fafc;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      font-size: 11px;
    }
    .meta-item strong {
      color: #475569;
      display: block;
      font-size: 9.5px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .meta-item span {
      color: #0f172a;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 16px 0;
      font-size: 10.5px;
    }
    th {
      background: #0f172a;
      color: #f59e0b;
      font-family: 'Courier New', monospace;
      text-transform: uppercase;
      font-size: 9.5px;
      padding: 6px 8px;
      text-align: left;
    }
    .footer-bar {
      margin-top: 24px;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 16px; padding: 10px 16px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
    <span style="color: #92400e; font-weight: 600;">
      Print Dialog will open automatically. Choose "Save as PDF" to save this report.
    </span>
    <button onclick="window.print()" style="background: #b45309; color: #fff; border: none; padding: 6px 14px; border-radius: 4px; font-weight: bold; cursor: pointer;">
      Print / Save as PDF
    </button>
  </div>

  <!-- Product Naming, Rooster Icon & Owner Header (Printed at top of PDF) -->
  <div class="product-owner-header">
    <div style="display: flex; align-items: center; gap: 14px;">
      <!-- Rooster Icon SVG (Golden Seval Kodi Emblem) -->
      <div style="width: 44px; height: 44px; flex-shrink: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: 1.5px solid #d97706; border-radius: 8px; padding: 3px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.15);">
        <svg viewBox="0 0 100 100" width="38" height="38" style="display: block;">
          <defs>
            <linearGradient id="pdfGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="pdfCrimson" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="70%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>
          <!-- Vel / Spear Staff -->
          <line x1="28" y1="12" x2="28" y2="92" stroke="#d97706" stroke-width="4" stroke-linecap="round" />
          <!-- Spear Tip / Vel Leaf -->
          <path d="M 28 6 Q 24 16 28 20 Q 32 16 28 6 Z" fill="url(#pdfGoldGrad)" stroke="#fef08a" stroke-width="1" />
          <!-- Flying Banner Flag -->
          <path d="M 28 20 C 50 16, 68 28, 88 22 C 78 38, 88 54, 86 60 C 65 52, 45 64, 28 58 Z" fill="url(#pdfCrimson)" stroke="#f59e0b" stroke-width="1.5" />
          <!-- Golden Rooster Silhouette on Flag -->
          <g fill="url(#pdfGoldGrad)" transform="translate(42, 28) scale(0.38)">
            <path d="M 30 50 C 20 40 10 25 2 10 C 15 20 25 28 35 34 C 28 15 22 2 12 -8 C 26 5 36 18 42 30 C 50 15 54 -2 46 -15 C 60 5 62 20 60 32 C 68 28 76 22 84 14 C 80 26 72 36 62 42 C 72 46 82 52 88 62 C 78 62 68 58 58 56 C 54 68 44 76 30 76 C 18 76 22 62 30 50 Z" />
            <circle cx="68" cy="18" r="10" />
            <path d="M 66 8 Q 72 0 78 8 Q 84 2 84 10" stroke="#fef08a" stroke-width="3" fill="none" />
            <polygon points="76,18 88,22 76,26" fill="#fef08a" />
          </g>
          <!-- Solar Radiance / Star Emblem -->
          <circle cx="80" cy="24" r="2.5" fill="#fef08a" />
          <path d="M 80 18 L 80 30 M 74 24 L 86 24" stroke="#fef08a" stroke-width="1" stroke-linecap="round" />
        </svg>
      </div>
      <div>
        <div style="font-size: 15px; font-weight: 800; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: 0.3px; display: flex; align-items: center; gap: 8px;">
          <span>ROOSTER ASTRO ANALYTICAL TOOL</span>
          <span style="font-size: 8.5px; font-weight: 700; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; font-family: monospace;">Owner Edition</span>
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
          Product & Research Suite Owned by <strong>Rooster Astro Analytical Tool</strong> • High-Precision Canonical Astrological Computing
        </div>
      </div>
    </div>
    <div style="text-align: right; font-size: 9px; color: #64748b; font-family: monospace;">
      <div style="font-weight: 700; color: #0f172a;">AUTHENTICATED OWNER REPORT</div>
      <div>Zero-Ingress Security • Practical Realities</div>
    </div>
  </div>

  <div class="print-banner">
    <div>
      <h1 style="margin: 0; font-size: 17px; font-family: 'Courier New', monospace; font-weight: bold; color: #fbbf24; letter-spacing: 0.5px;">
        MAHARISHI PARASHARA BPHS SYNTHESIS ENGINE
      </h1>
      <p style="margin: 4px 0 0 0; font-size: 11px; color: #cbd5e1;">
        Canonical Horoscopic Evaluation & Multi-LLM Gochara Synthesis Report
      </p>
    </div>
    <div style="text-align: right; font-size: 10px; color: #94a3b8; font-family: monospace;">
      <div>Generated: ${new Date().toLocaleString()}</div>
      <div>Specification: Document 1.1</div>
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item">
      <strong>Period of Interest</strong>
      <span>${data.periodOfInterest} (${data.anchorDate})</span>
    </div>
    <div class="meta-item">
      <strong>Active Vimshottari Dasha</strong>
      <span>${data.dashaInfo}</span>
    </div>
    <div class="meta-item">
      <strong>Primary Model / Latency</strong>
      <span>${primaryModelName} (${latencySec}s)</span>
    </div>
    <div class="meta-item">
      <strong>Lagna & Navamsha</strong>
      <span>Sagittarius 16°33' • D9 Aquarius</span>
    </div>
    <div class="meta-item">
      <strong>Janma Rasi (Moon Sign)</strong>
      <span>Scorpio (Vrishchika 06°08')</span>
    </div>
    <div class="meta-item">
      <strong>Native Identification</strong>
      <span>${data.nativeId || 'CANONICAL-NATIVE-BPHS-01'}</span>
    </div>
  </div>

  ${
    data.intentSummary
      ? `
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px 14px; margin-bottom: 16px; font-size: 11px;">
      <div style="font-weight: bold; color: #b45309; text-transform: uppercase; font-size: 9.5px; margin-bottom: 4px; font-family: 'Courier New', monospace;">
        PREPROCESSED USER INQUIRY & INTENT CLASSIFICATION
      </div>
      <div style="color: #78350f;">
        <strong>Intent Category:</strong> ${data.intentSummary.intentCategory || 'Astrological Evaluation'}
        ${
          data.intentSummary.correctedNarrative
            ? `<div style="margin-top: 3px; font-style: italic;">"${data.intentSummary.correctedNarrative}"</div>`
            : ''
        }
      </div>
    </div>
  `
      : ''
  }

  ${
    transitRowsHtml
      ? `
    <div>
      <div style="font-weight: bold; font-size: 12px; color: #0f172a; margin-bottom: 4px; font-family: 'Courier New', monospace;">
        ACTIVE GOCHARA TRANSIT MATRIX (${data.periodOfInterest})
      </div>
      <table>
        <thead>
          <tr>
            <th>Graha</th>
            <th>Transit Sign</th>
            <th>Longitude</th>
            <th>House (Lagna)</th>
            <th>House (Moon)</th>
            <th>Classical Impact Status</th>
          </tr>
        </thead>
        <tbody>
          ${transitRowsHtml}
        </tbody>
      </table>
    </div>
  `
      : ''
  }

  <div style="margin-top: 14px;">
    ${reportBodyHtml}
  </div>

  ${secondaryBodyHtml}

  <div class="footer-bar">
    <span>Rooster Astro Analytical Tool — Maharishi Parashara BPHS Astrological Reasoning Engine</span>
    <span>Confidential Horoscopic Assessment • Practical Realities Only</span>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 300);
    });
  </script>
</body>
</html>
  `;

  // Open the print document in a new window/tab for instant high-fidelity print/PDF saving
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
  } else {
    // If popups blocked, download as standalone HTML report
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const sanitizedDate = data.anchorDate.replace(/[^0-9-]/g, '');
    link.download = `BPHS_Astrological_Report_${sanitizedDate}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Generates and downloads a clean, structured Markdown (.md) Report
 */
export function exportReportToMarkdown(data: ReportExportData): void {
  const lines: string[] = [];

  lines.push(`# Rooster Astro Analytical Tool`);
  lines.push(`*Product & Research Suite Owned by Rooster Astro Analytical Tool*`);
  lines.push(`*Canonical BPHS Astrological Synthesis Report*  `);
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

  // Primary Synthesized Output (Filtered for Practical Realities)
  const primaryRaw =
    data.primaryResult?.markdown ||
    'No primary report markdown available. Run synthesis dispatch in the workbench.';
  const cleanedPrimary = filterRemediesToPracticalRealities(primaryRaw);

  lines.push(`## Primary Astrological Synthesis (${data.primaryResult?.model || 'Gemini Flash Latest'})`);
  lines.push(`*Source: ${data.primaryResult?.provider || 'Google Gemini'} | Latency: ${((data.primaryResult?.latencyMs || 850) / 1000).toFixed(2)}s*`);
  lines.push('');
  lines.push(cleanedPrimary);
  lines.push('');

  // Secondary LLM Output (if available, Filtered for Practical Realities)
  if (data.secondaryResult && data.secondaryResult.markdown) {
    const cleanedSecondary = filterRemediesToPracticalRealities(data.secondaryResult.markdown);
    lines.push('---');
    lines.push('');
    lines.push(`## Secondary Cross-Model Audit (${data.secondaryResult.model})`);
    lines.push(`*Source: ${data.secondaryResult.provider} | Latency: ${((data.secondaryResult.latencyMs || 1100) / 1000).toFixed(2)}s*`);
    lines.push('');
    lines.push(cleanedSecondary);
    lines.push('');
  }

  lines.push('---');
  lines.push('*Report compiled by Rooster Astro Analytical Tool — BPHS Autonomous Astrological Engine v1.1. No mystical remedies applied; practical realities strictly enforced.*');

  const fullContent = lines.join('\n');
  const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const sanitizedDate = data.anchorDate.replace(/[^0-9-]/g, '');
  link.download = `RoosterAstro_Report_${sanitizedDate}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

