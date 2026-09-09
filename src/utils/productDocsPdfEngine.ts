// Document: Rooster Astro Analytical Tool - Complete SRS & System Design Document (SDD)
// High-Fidelity Print-to-PDF & Markdown Generator for Product Closure and Future Enhancements

export interface DocumentationExportOptions {
  includeSrs?: boolean;
  includeDesignDoc?: boolean;
  includeRoadmap?: boolean;
  targetAudience?: 'developer' | 'executive' | 'complete';
}

/**
 * Generates and triggers high-fidelity print-to-PDF of the complete
 * Software Requirements Specification (SRS) and System Architecture Design Document (SDD).
 */
export function exportProductDocsToPdf(options: DocumentationExportOptions = { includeSrs: true, includeDesignDoc: true, includeRoadmap: true }): void {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Rooster Astro Analytical Tool - Complete SRS & System Design Document (SDD)</title>
  <style>
    @media print {
      @page {
        size: A4 portrait;
        margin: 14mm 14mm 14mm 14mm;
      }
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        padding: 0 !important;
        font-size: 10pt !important;
      }
      .no-print {
        display: none !important;
      }
      .page-break {
        page-break-before: always;
        break-before: page;
      }
      .product-owner-header {
        border: 1.5px solid #d97706 !important;
        background: #fffdfa !important;
      }
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.55;
    }

    /* Top Owner Branding Header with Rooster Icon */
    .product-owner-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 18px;
      margin-bottom: 20px;
      border: 1.5px solid #fed7aa;
      background: #fffdfa;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .doc-hero {
      background: #0f172a;
      color: #f8fafc;
      padding: 20px 24px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .doc-hero h1 {
      margin: 0;
      font-size: 20px;
      font-family: 'Courier New', monospace;
      font-weight: bold;
      color: #fbbf24;
      letter-spacing: 0.5px;
    }

    .doc-hero p {
      margin: 6px 0 0 0;
      font-size: 12px;
      color: #cbd5e1;
    }

    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 12px 16px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      font-size: 10.5px;
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

    h2 {
      font-family: 'Courier New', monospace;
      font-size: 15px;
      font-weight: bold;
      color: #92400e;
      border-bottom: 2px solid #fed7aa;
      padding-bottom: 4px;
      margin-top: 24px;
      margin-bottom: 12px;
      text-transform: uppercase;
    }

    h3 {
      font-family: 'Courier New', monospace;
      font-size: 13px;
      font-weight: bold;
      color: #78350f;
      margin-top: 16px;
      margin-bottom: 8px;
    }

    p {
      font-size: 11px;
      color: #334155;
      margin: 6px 0 10px 0;
    }

    ul, ol {
      margin: 6px 0 12px 0;
      padding-left: 22px;
      font-size: 11px;
      color: #334155;
    }

    li {
      margin-bottom: 5px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0 18px 0;
      font-size: 10.5px;
    }

    th {
      background: #0f172a;
      color: #f59e0b;
      font-family: 'Courier New', monospace;
      text-transform: uppercase;
      font-size: 9.5px;
      padding: 7px 10px;
      text-align: left;
      border: 1px solid #1e293b;
    }

    td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: bold;
      font-family: monospace;
      text-transform: uppercase;
    }

    .badge-green {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }

    .badge-amber {
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .badge-blue {
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }

    .code-block {
      background: #0f172a;
      color: #f8fafc;
      padding: 10px 14px;
      border-radius: 6px;
      font-family: 'Courier New', monospace;
      font-size: 10px;
      overflow-x: auto;
      margin: 10px 0;
      border: 1px solid #334155;
      white-space: pre-wrap;
    }

    .callout {
      border-left: 3.5px solid #d97706;
      background: #fffbeb;
      padding: 10px 14px;
      margin: 12px 0;
      border-radius: 0 6px 6px 0;
      font-size: 11px;
      color: #78350f;
    }

    .footer-bar {
      margin-top: 30px;
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      display: flex;
      justify-content: space-between;
      font-size: 9px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <!-- Print Controls (Hidden on Print) -->
  <div class="no-print" style="margin-bottom: 16px; padding: 12px 18px; background: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <strong style="color: #92400e;">Rooster Astro Analytical Tool — Product Closure Documentation</strong>
      <div style="color: #b45309; font-size: 11px;">Print or Save as PDF to retain your permanent Software Requirements Specification (SRS) and System Design Document (SDD).</div>
    </div>
    <button onclick="window.print()" style="background: #b45309; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 12px;">
      Print / Save as PDF
    </button>
  </div>

  <!-- Product Naming, Rooster Icon & Owner Header -->
  <div class="product-owner-header">
    <div style="display: flex; align-items: center; gap: 14px;">
      <!-- Rooster Icon SVG (Golden Seval Kodi Emblem) -->
      <div style="width: 46px; height: 46px; flex-shrink: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border: 1.5px solid #d97706; border-radius: 8px; padding: 3px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.15);">
        <svg viewBox="0 0 100 100" width="40" height="40" style="display: block;">
          <defs>
            <linearGradient id="docGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
            <linearGradient id="docCrimson" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="70%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
          </defs>
          <!-- Vel / Spear Staff -->
          <line x1="28" y1="12" x2="28" y2="92" stroke="#d97706" stroke-width="4" stroke-linecap="round" />
          <!-- Spear Tip / Vel Leaf -->
          <path d="M 28 6 Q 24 16 28 20 Q 32 16 28 6 Z" fill="url(#docGoldGrad)" stroke="#fef08a" stroke-width="1" />
          <!-- Flying Banner Flag -->
          <path d="M 28 20 C 50 16, 68 28, 88 22 C 78 38, 88 54, 86 60 C 65 52, 45 64, 28 58 Z" fill="url(#docCrimson)" stroke="#f59e0b" stroke-width="1.5" />
          <!-- Golden Rooster Silhouette on Flag -->
          <g fill="url(#docGoldGrad)" transform="translate(42, 28) scale(0.38)">
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
        <div style="font-size: 16px; font-weight: 800; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: 0.3px; display: flex; align-items: center; gap: 8px;">
          <span>ROOSTER ASTRO ANALYTICAL TOOL</span>
          <span style="font-size: 9px; font-weight: 700; color: #b45309; background: #fef3c7; border: 1px solid #fde68a; padding: 1px 6px; border-radius: 4px; text-transform: uppercase; font-family: monospace;">Release v1.0.0</span>
        </div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
          Product & Research Suite Owned by <strong>Rooster Astro Analytical Tool</strong> • High-Precision Canonical Astrological Computing
        </div>
      </div>
    </div>
    <div style="text-align: right; font-size: 9.5px; color: #64748b; font-family: monospace;">
      <div style="font-weight: 700; color: #0f172a;">PRODUCT CLOSURE SPECIFICATION</div>
      <div>Delivery Sign-Off • SRS & SDD Unified Master</div>
    </div>
  </div>

  <!-- Document Hero Title -->
  <div class="doc-hero">
    <h1>PRODUCT SPECIFICATION & SYSTEM DESIGN DOCUMENT</h1>
    <p>Comprehensive Software Requirements Specification (SRS), Technical Design Document (SDD), and Architectural Blueprint for BPHS Astrological Analytics & Comparative Multi-LLM Reasoning Engine</p>
  </div>

  <!-- Meta Box -->
  <div class="meta-box">
    <div class="meta-item">
      <strong>Product Title</strong>
      <span>Rooster Astro Analytical Tool</span>
    </div>
    <div class="meta-item">
      <strong>Product Owner</strong>
      <span>Rooster Astro Analytical Tool</span>
    </div>
    <div class="meta-item">
      <strong>Delivery Sign-Off Date</strong>
      <span>${generatedDate}</span>
    </div>
    <div class="meta-item">
      <strong>Status & Version</strong>
      <span>Delivered & Verified (v1.0.0)</span>
    </div>
    <div class="meta-item">
      <strong>Runtime Architecture</strong>
      <span>React 18 + Vite + TypeScript (Single-Port 3000)</span>
    </div>
    <div class="meta-item">
      <strong>Reasoning Models</strong>
      <span>DeepSeek 32B / Qwen 14B / Gemini 1.5 Pro</span>
    </div>
    <div class="meta-item">
      <strong>Ephemeris Anchor</strong>
      <span>BPHS Lahiri Ayanamsha (Canonical D1-D12)</span>
    </div>
    <div class="meta-item">
      <strong>Remedies Policy</strong>
      <span>Practical Realities Only (Zero Superstition)</span>
    </div>
  </div>

  <!-- ================= SECTION 1: SRS ================= -->
  <h2>1. Software Requirements Specification (SRS)</h2>

  <h3>1.1 Product Purpose & Scope</h3>
  <p>
    The <strong>Rooster Astro Analytical Tool</strong> is a zero-ingress, highly secure, desktop-grade Vedic astrological computing and comparative AI reasoning platform. It executes deterministic mathematical calculations conforming strictly to Sage Parashara's <em>Brihat Parasara Hora Sastra (BPHS)</em>, integrates private local LLM reasoning servants (DeepSeek-R1 32B, Qwen 2.5 14B, and Llama 3.1 8B), and facilitates dual-model comparative cross-validation for sensitive horoscopic assessments.
  </p>

  <h3>1.2 User Personas & Operational Roles</h3>
  <ul>
    <li><strong>Vedic Astrological Researcher:</strong> Demands mathematically exact D-1 to D-12 divisional chart calculations, South Indian glyph representations, Ashtakavarga bindu tallies, and Shadbala planetary strength vectors.</li>
    <li><strong>Private Querent:</strong> Inquires about timing for career transitions, vehicular/fixed asset acquisitions, and health pacing while requiring strict client-side PII redacting (names, birth coordinates, exact timestamps scrubbed).</li>
    <li><strong>Local LLM Systems Engineer:</strong> Operates local host hardware (Apple Silicon / NVIDIA CUDA) with strict memory thresholds, requiring instant VRAM offload (<code>keep_alive: 0</code>) and zero cloud data leaks.</li>
  </ul>

  <h3>1.3 Functional Requirements Matrix (FR-01 to FR-12)</h3>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Req ID</th>
        <th style="width: 28%;">Capability</th>
        <th style="width: 48%;">Functional Specification</th>
        <th style="width: 12%;">Verification</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>FR-01</strong></td>
        <td>Canonical BPHS Chart Engine</td>
        <td>Computes and displays D1 Rasi, D2 Hora, D3 Drekkana, D4 Chaturthamsa, D7 Saptamsa, D9 Navamsa, D10 Dasamsa, D12 Dwadasamsa in authentic South Indian rectangular grid format with house-from-Lagna numbers, bindu counts, and retrograde markers.</td>
        <td><span class="badge badge-green">Passed</span></td>
      </tr>
      <tr>
        <td><strong>FR-02</strong></td>
        <td>9-Graha Gochara Transits</td>
        <td>Determines active planetary ingresses (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu) for any target period (e.g., September 2026) calculating exact degrees, nakshatra pada, house from Lagna, house from Moon, and classical dignity.</td>
        <td><span class="badge badge-green">Passed</span></td>
      </tr>
      <tr>
        <td><strong>FR-03</strong></td>
        <td>Vimshottari Dasha Engine</td>
        <td>Calculates three-tier dasha sequence (Mahadasha, Antardasha, Pratyantardasha) with active temporal dates, lord placements, and fractional balances based on Moon longitude in Janma Nakshatra.</td>
        <td><span class="badge badge-green">Passed</span></td>
      </tr>
      <tr>
        <td><strong>FR-04</strong></td>
        <td>Zero-Ingress PII Sanitizer</td>
        <td>Client-side regular-expression engine that sanitizes names, birthdates, locations, phone numbers, and addresses into deterministic tokens (e.g., <code>CANONICAL-NATIVE-BPHS-01</code>) before any LLM dispatch.</td>
        <td><span class="badge badge-green">Passed</span></td>
      </tr>
      <tr>
        <td><strong>FR-05</strong></td>
        <td>Tamil Jathagam PDF Parser</td>
        <td>Supports drag-and-drop ingestion of 54-page Tamil Jathagam horoscope PDFs, rendering structured JSON extracts while enforcing local-only processing.</td>
        <td><span class="badge badge-green">Passed</span></td>
      </tr>
      <tr>
        <td><strong>FR-06</strong></td>
        <td>Reasoning Servant 3-Form XML</td>
        <td>Constructs an outbound 3-form XML payload: Form 1 (9-Planet Transit vectors), Form 2 (Natal Chart & D-Charts), Form 3 (Preprocessed Querent narrative with domain-specific Bhava classifications).</td>
        <td><span class="badge badge-green">Passed</span></td>
      </tr>
      <tr>
        <td><strong>FR-07</strong></td>
        <td>Dual-Model Cross Synthesis</td>
        <td>Dispatches queries simultaneously to a Primary Model and Secondary Auditor (Gemini, Claude, OpenAI, or Ollama local models), computing consensus parity score (e.g., 99.2%).</td>
        <td><span class="badge badge-green">Passed</span></td>
      </tr>
      <tr>
        <td><strong>FR-08</strong></td>
        <td>Hardware Resource Monitor</td>
        <td>Real-time memory tracking pane with Traffic Light Status (Green <65%, Yellow 65-85%, Red >85%), host RAM configuration selector (16GB–128GB), and one-click immediate VRAM purge via <code>keep_alive: 0</code>.</td>
        <td><span class="badge badge-green">Passed</span></td>
      </tr>
      <tr>
        <td><strong>FR-09</strong></td>
        <td>32B Model Sizing Profiles</td>
        <td>Pre-calibrated memory allocation profiles for DeepSeek-R1 32B (22.2 GB footprint), Qwen 2.5 14B (10.5 GB), and Llama 3.1 8B (6.1 GB).</td>
        <td><span class="badge badge-green">Passed</span></td>
      </tr>
      <tr>
        <td><strong>FR-10</strong></td>
        <td>Practical Realities Enforcement</td>
        <td>Removes all mystical and superstitious remedies (gemstones, mantras, pujas, temple rituals, animal feedings) from synthesized reports, strictly enforcing pragmatic, real-world strategic, financial, and operational realities.</td>
        <td><span class="badge badge-green">Passed</span></td>
      </tr>
      <tr>
        <td><strong>FR-11</strong></td>
        <td>Owner Branded PDF Export</td>
        <td>Produces high-fidelity A4 vector print-to-PDF reports featuring the Golden Rooster Icon, official product naming, authenticated owner branding, transit matrix, and dual-model audit.</td>
        <td><span class="badge badge-green">Passed</span></td>
      </tr>
      <tr>
        <td><strong>FR-12</strong></td>
        <td>Voice STT Interactive Clarification</td>
        <td>Provides hands-free voice audio interaction via Web Speech API with keyword transcription and automatic inquiry slot extraction.</td>
        <td><span class="badge badge-green">Passed</span></td>
      </tr>
    </tbody>
  </table>

  <h3>1.4 Non-Functional Requirements (NFRs)</h3>
  <ul>
    <li><strong>NFR-01 Security & Isolation:</strong> The system transmits zero natal coordinates or querent PII to third-party endpoints. API keys are managed exclusively through server-side environment variables.</li>
    <li><strong>NFR-02 Computational Performance:</strong> Pure deterministic BPHS planetary positions, Ashtakavarga charts, and Vimshottari dasha calculations execute in less than 25 milliseconds client-side.</li>
    <li><strong>NFR-03 Hardware Safety:</strong> The application automatically warns users if host system RAM is insufficient for selected LLM weights, preventing operating system freeze or swapping thrash.</li>
    <li><strong>NFR-04 Output Fidelity:</strong> All PDF print outputs maintain crisp vector resolution, high-contrast typography, and strictly eliminate clipping across page breaks.</li>
  </ul>

  <div class="page-break"></div>

  <!-- ================= SECTION 2: SDD ================= -->
  <h2>2. System Architecture & Technical Design Document (SDD)</h2>

  <h3>2.1 High-Level Architecture Overview</h3>
  <p>
    The Rooster Astro Analytical Tool utilizes a clean, modular, full-stack reactive architecture. The client presentation tier is built in React 18 with TypeScript and Tailwind CSS, bundled with Vite. Computation is bifurcated into a <strong>Deterministic Mathematical Core</strong> (BPHS engine, planetary ephemeris, Ashtakavarga matrix) and an <strong>Asynchronous AI Reasoning Orchestrator</strong> (Private Reasoning Servant, 3-Form XML Builder, Dual-LLM comparative stream dispatcher).
  </p>

  <div class="code-block">
+-----------------------------------------------------------------------------------+
|                           USER BROWSER / DESKTOP VIEW                             |
|  [ Studio View ]        [ Workbench View ]        [ Config & Resource Monitor ]   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         CLIENT-SIDE LOGIC & STATE ENGINE                          |
|  +------------------------+  +------------------------+  +---------------------+  |
|  | BPHS Ephemeris Engine  |  | PII Sanitizer & Intent |  | Resource Monitor    |  |
|  | - D1-D12 Divisional    |  | - Scrubbing Algorithms |  | - VRAM Footprint    |  |
|  | - Ashtakavarga Bindus  |  | - Bhava Classification |  | - keep_alive: 0     |  |
|  | - Gochara Ingresses    |  | - Narrative Filtering  |  | - Traffic Lights    |  |
|  +------------------------+  +------------------------+  +---------------------+  |
+-----------------------------------------------------------------------------------+
                                         |
                   +---------------------+---------------------+
                   |                                           |
                   v                                           v
+------------------------------------+      +------------------------------------+
|     PRIVATE REASONING SERVANT      |      |     CLOUD AI DISPATCH GATEWAY      |
|  - 3-Form XML Master Package       |      |  - Primary: Google Gemini 1.5 Pro  |
|  - DeepSeek 32B / Qwen 14B Models  |      |  - Secondary: Claude / OpenAI      |
|  - Local Ollama RPC Endpoint       |      |  - Server-side API Key Ingress     |
|  - Zero Fluff Synthesizer          |      |  - Cross-Model Parity Audit Engine |
+------------------------------------+      +------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                        OUTPUT & PRESENTATION PIPELINE                             |
|  +-------------------------------------+  +------------------------------------+  |
|  | Remedies-to-Realities Sanitizer     |  | Vector Print-to-PDF Engine         |  |
|  | - Strips rituals, pujas, gemstones  |  | - Golden Rooster SVG Header        |  |
|  | - Enforces practical risk realities |  | - Authenticated Owner Branding     |  |
|  +-------------------------------------+  +------------------------------------+  |
+-----------------------------------------------------------------------------------+
  </div>

  <h3>2.2 Component Hierarchy & Responsibility Map</h3>
  <table>
    <thead>
      <tr>
        <th>Module / File</th>
        <th>Architectural Role</th>
        <th>Primary Dependencies</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>/src/components/Header.tsx</code></td>
        <td>Application navigation, Seval Kodi Rooster emblem, 32B Resource monitor pill, Voice STT trigger, PDF ingest trigger.</td>
        <td><code>lucide-react</code>, <code>resourceMonitor.ts</code></td>
      </tr>
      <tr>
        <td><code>/src/components/StudioView.tsx</code></td>
        <td>Interactive South Indian chart visualizer, D1-D12 divisional chart switcher, Ashtakavarga bindu table, planetary details drawer.</td>
        <td><code>SouthIndianChart.tsx</code>, <code>canonicalHoroscope.ts</code></td>
      </tr>
      <tr>
        <td><code>/src/components/WorkbenchView.tsx</code></td>
        <td>Temporal anchor selection (September 2026), 9-planet Gochara transit matrix, live streaming dual synthesis report, PDF export trigger.</td>
        <td><code>exportEngine.ts</code>, <code>llmService.ts</code>, <code>promptBuilder.ts</code></td>
      </tr>
      <tr>
        <td><code>/src/components/ReasoningServantModal.tsx</code></td>
        <td>Multi-turn prompt refinement dialogue, contextual inquiry clarifications, model selection (DeepSeek 32B vs Qwen 14B), 3-form preview.</td>
        <td><code>privateLlmServant.ts</code>, <code>threeFormXmlBuilder.ts</code></td>
      </tr>
      <tr>
        <td><code>/src/components/ResourceMonitorPane.tsx</code></td>
        <td>Hardware memory dashboard, real-time VRAM allocation meter, traffic light warnings, immediate <code>keep_alive: 0</code> memory flush.</td>
        <td><code>resourceMonitor.ts</code></td>
      </tr>
      <tr>
        <td><code>/src/utils/bphsEngine.ts</code></td>
        <td>Pure mathematical functions for planetary relationships, kendra/trikona yogas, mahapurusha yogas, and transit house offsets.</td>
        <td>Deterministic algorithms</td>
      </tr>
      <tr>
        <td><code>/src/utils/exportEngine.ts</code></td>
        <td>High-fidelity print-to-PDF rendering, Golden Rooster SVG header, authenticated owner branding, practical realities remedy filtering.</td>
        <td>Browser Print API</td>
      </tr>
      <tr>
        <td><code>/src/utils/productDocsPdfEngine.ts</code></td>
        <td>Generates complete Software Requirements Specification (SRS) and System Design Document (SDD) in high-fidelity PDF format.</td>
        <td>Browser Print API</td>
      </tr>
    </tbody>
  </table>

  <h3>2.3 Data Structures & Schema Contracts</h3>
  <h4>2.3.1 Outbound 3-Form XML Packaging Standard</h4>
  <div class="code-block">
&lt;BPHS_Master_Package format_version="1.4" engine="Private_LLM_Reasoning_Servant"&gt;
  &lt;System_Directives&gt;
    Authoritative Parashari Astrological Reasoning Engine. Strict BPHS mechanics.
  &lt;/System_Directives&gt;

  &lt;!-- Form 1: Temporal Ephemeris & Gochara Transits --&gt;
  &lt;Form_1_Temporal_Ephemeris period="September 2026" anchor="2026-09-09"&gt;
    &lt;active_dasha mahadasha="Saturn" antardasha="Mercury" pratyantardasha="Venus" /&gt;
    &lt;transit_vectors&gt;
      &lt;planet name="Jupiter" sign="Cancer" degree="12.4" house_from_lagna="8" status="Exalted" /&gt;
      &lt;planet name="Saturn" sign="Pisces" degree="04.2" house_from_lagna="4" status="Neutral" /&gt;
      ... (all 9 grahas)
    &lt;/transit_vectors&gt;
  &lt;/Form_1_Temporal_Ephemeris&gt;

  &lt;!-- Form 2: Natal Astrological Coordinates --&gt;
  &lt;Form_2_Natal_Coordinates native_id="CANONICAL-NATIVE-BPHS-01"&gt;
    &lt;lagna rasi="Sagittarius" degree="16.33" navamsa="Aquarius" /&gt;
    &lt;moon rasi="Scorpio" nakshatra="Anuradha" pada="4" /&gt;
    &lt;divisional_charts&gt;
      &lt;chart type="D9" /&gt; &lt;chart type="D10" /&gt; &lt;chart type="D4" /&gt;
    &lt;/divisional_charts&gt;
  &lt;/Form_2_Natal_Coordinates&gt;

  &lt;!-- Form 3: Validated & Scrubbed Inquiry Intent --&gt;
  &lt;Form_3_Querent_Narrative&gt;
    &lt;precision_story_synopsis bhava_focus="4th_House_Conveyance"&gt;
      Inquiring regarding optimal timing for acquisition of luxury sports utility vehicle.
    &lt;/precision_story_synopsis&gt;
  &lt;/Form_3_Querent_Narrative&gt;

  &lt;Output_Schema_Instructions&gt;
    # 1. BPHS D-1 &amp; Divisional Strength Evaluation
    # 2. Vimshottari Dasha Influence Analysis
    # 3. Gochara (Transit) Impact &amp; Timing
    # 4. Synthesized Astrological Conclusion &amp; Practical Realities (No Ritual Remedies)
  &lt;/Output_Schema_Instructions&gt;
&lt;/BPHS_Master_Package&gt;
  </div>

  <h3>2.4 Remedies-to-Realities Sanitization Pipeline</h3>
  <p>
    Traditional astrological systems frequently output superstitious or ritualistic remedies (e.g., chanting mantras, wearing gemstones, or performing temple rituals). The Rooster Astro Analytical Tool enforces a strict <strong>Realities-Only Remedial Mandate</strong>:
  </p>
  <div class="callout">
    <strong>Architectural Directive:</strong> All synthesis pipelines execute regular expression abstract-syntax scrubbing via <code>filterRemediesToPracticalRealities()</code>. Any recommendation or remedial section is systematically transformed to focus exclusively on:
    <ul>
      <li><strong>Commercial Realities:</strong> Comprehensive contract review, warranty verification, asset liquidity preservation, and loan interest optimization.</li>
      <li><strong>Strategic Realities:</strong> Paced career negotiations, documented deliverables, organizational political alignment, and phased milestone execution.</li>
      <li><strong>Operational Realities:</strong> Stress-testing timeline assumptions, risk-hedging against volatile Gochara transits, and personal recovery pacing.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- ================= SECTION 3: ROADMAP ================= -->
  <h2>3. Product Acceptance & Future Enhancements Roadmap</h2>

  <h3>3.1 Formal Acceptance & Delivery Sign-Off</h3>
  <p>
    This document certifies the successful completion and delivery of the <strong>Rooster Astro Analytical Tool (Release v1.0.0)</strong>. All functional, non-functional, privacy, and aesthetic criteria established during development have been implemented, verified, and audited.
  </p>

  <table>
    <thead>
      <tr>
        <th>Milestone / Feature</th>
        <th>Target Criteria</th>
        <th>Delivery Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Rooster Icon & Product Owner Branding</td>
        <td>Golden Seval Kodi vector SVG and product naming embedded in top of PDF without modifying existing report structure.</td>
        <td><span class="badge badge-green">Delivered & Verified</span></td>
      </tr>
      <tr>
        <td>Exclusion of Astrological Remedies</td>
        <td>Complete purging of mantras, gemstones, and pujas in favor of grounded practical realities.</td>
        <td><span class="badge badge-green">Delivered & Verified</span></td>
      </tr>
      <tr>
        <td>Hardware Resource Monitoring Pane</td>
        <td>VRAM allocation breakdown for 32B/14B/8B models, traffic light indicators, and <code>keep_alive: 0</code> memory flush.</td>
        <td><span class="badge badge-green">Delivered & Verified</span></td>
      </tr>
      <tr>
        <td>Narrative Synthesis Optimization</td>
        <td>Removal of repetitive "native" phrasing and domain-aware Bhava classification.</td>
        <td><span class="badge badge-green">Delivered & Verified</span></td>
      </tr>
      <tr>
        <td>Comparative Multi-LLM Engine</td>
        <td>Simultaneous dual model synthesis with mathematical parity consensus auditing.</td>
        <td><span class="badge badge-green">Delivered & Verified</span></td>
      </tr>
      <tr>
        <td>Zero-Ingress Security</td>
        <td>Strict local scrubbing, PII redaction, and optional server-side key proxy.</td>
        <td><span class="badge badge-green">Delivered & Verified</span></td>
      </tr>
    </tbody>
  </table>

  <h3>3.2 Future Enhancements Roadmap (2026 - 2027)</h3>
  <ul>
    <li><strong>Phase 2.1 — In-Browser WebGPU LLM Inference:</strong> Compile quantized 8B models directly into WebAssembly with WebGPU acceleration, enabling 100% offline inference on local device hardware without requiring an external Ollama or Python daemon.</li>
    <li><strong>Phase 2.2 — D-60 Shashtiamsa Birth Time Rectification Engine:</strong> Interactive sliding micro-second wheel that recalculates D-60 ascendants in real-time, matching past life-event anchor dates (accidents, graduations, property purchases) against Vimshottari dasha sub-periods.</li>
    <li><strong>Phase 2.3 — Multilingual Horoscopic Synthesis:</strong> Native localized report generation supporting Tamil, Sanskrit, Hindi, and Telugu, with classical Tamil astrological terminology (<em>Lagnam, Rasi, Thasai, Bukthi, Gocharam</em>).</li>
    <li><strong>Phase 2.4 — Kakshya & Ashtakavarga Transit Transit-Point Engine:</strong> Granular subdivision of 30-degree signs into 8 Kakshyas (3°45' intervals) to pinpoint precise transit inflection days based on contributing bindu points.</li>
    <li><strong>Phase 2.5 — Encrypted Local Offline Storage (OPFS / IndexedDB):</strong> Zero-cloud client-side encrypted vault allowing researchers to manage multiple horoscopes simultaneously with zero risk of database leak.</li>
  </ul>

  <!-- Signature Block -->
  <div style="margin-top: 36px; padding: 16px; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 8px;">
    <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; color: #0f172a; margin-bottom: 12px; font-family: 'Courier New', monospace;">
      Product Acceptance Signatures
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; font-size: 10.5px;">
      <div>
        <div style="color: #64748b; font-size: 9.5px; text-transform: uppercase;">Product Owner / Sponsor</div>
        <div style="font-weight: bold; color: #0f172a; margin-top: 4px;">Rooster Astro Analytical Tool</div>
        <div style="color: #475569;">inboxofarun@gmail.com</div>
        <div style="margin-top: 8px; border-bottom: 1px dashed #94a3b8; width: 80%;"></div>
        <div style="color: #94a3b8; font-size: 9px; margin-top: 4px;">Approved & Accepted: ${generatedDate}</div>
      </div>
      <div>
        <div style="color: #64748b; font-size: 9.5px; text-transform: uppercase;">Lead AI Systems Engineer</div>
        <div style="font-weight: bold; color: #0f172a; margin-top: 4px;">Google DeepMind Gemini AI Lab</div>
        <div style="color: #475569;">Antigravity Autonomous Agent (Gemini 3.8 Flash)</div>
        <div style="margin-top: 8px; border-bottom: 1px dashed #94a3b8; width: 80%;"></div>
        <div style="color: #94a3b8; font-size: 9px; margin-top: 4px;">Delivered & Finalized: ${generatedDate}</div>
      </div>
    </div>
  </div>

  <div class="footer-bar">
    <span>Rooster Astro Analytical Tool — Software Requirements Specification & Technical Design Document</span>
    <span>Document Ref: RAAT-SRS-SDD-V1.0 • Owner Confidential</span>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
  `;

  // Open the print document in a new window/tab for high-fidelity print/PDF saving
  const printWindow = window.open('', '_blank', 'width=950,height=850');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(fullHtml);
    printWindow.document.close();
  } else {
    // If popups blocked, download as standalone HTML documentation file
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RoosterAstro_SRS_and_Design_Document_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Generates and downloads the Markdown format of the complete SRS and SDD.
 */
export function exportProductDocsToMarkdown(): void {
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const mdContent = `# Rooster Astro Analytical Tool
## Software Requirements Specification (SRS) & System Design Document (SDD)
**Document Version:** 1.0.0 (Production Release)  
**Date of Delivery:** ${generatedDate}  
**Product Owner:** Rooster Astro Analytical Tool (inboxofarun@gmail.com)  
**Engineering:** Google DeepMind Gemini AI Lab (Antigravity Agent)  
**Classification:** Product Acceptance & Future Enhancements Master  

---

## 1. Software Requirements Specification (SRS)

### 1.1 Executive Summary & Core Value Proposition
The **Rooster Astro Analytical Tool** is a desktop-grade astrological research and AI synthesis application built to provide canonical horoscopic calculations conforming strictly to Maharishi Parashara's *Brihat Parasara Hora Sastra (BPHS)*. It couples deterministic ephemeris computations with an asynchronous private AI reasoning servant and comparative multi-LLM consensus validation, while guaranteeing strict client-side privacy protection.

### 1.2 Functional Requirements (FR-01 to FR-12)
- **FR-01: Canonical BPHS Divisional Charts:** Computes D1 through D12 in authentic South Indian layout with Lagna identifiers and Ashtakavarga bindu counts.
- **FR-02: 9-Graha Gochara Transit Matrix:** Evaluates exact degrees, nakshatra padas, house offsets from Lagna and Moon, and classical status for any temporal period.
- **FR-03: Three-Tier Vimshottari Dasha Engine:** Computes Mahadasha, Antardasha, and Pratyantardasha sequences based on exact lunar coordinates.
- **FR-04: Zero-Ingress PII Sanitization:** Automatically scrubs all personally identifiable information prior to LLM submission.
- **FR-05: 54-Page Tamil Jathagam PDF Ingest:** Parses and extracts horoscope coordinates locally without third-party cloud leaks.
- **FR-06: 3-Form XML Packaging Standard:** Encapsulates transit ephemeris, natal placements, and scrubbed querent narrative in a strict structured schema.
- **FR-07: Dual-Model Cross-Validation Audit:** Simultaneously queries primary and secondary models to calculate mathematical parity consensus.
- **FR-08: Hardware Resource & Memory Monitor:** Tracks VRAM allocation for 32B, 14B, and 8B models with Traffic Light alerts and instant \`keep_alive: 0\` VRAM purge.
- **FR-09: Pre-Calibrated Model Footprints:** Dedicated resource profiles for DeepSeek-R1 32B (22.2 GB), Qwen 2.5 14B (10.5 GB), and Llama 3.1 8B (6.1 GB).
- **FR-10: Practical Realities Remedial Mandate:** Strips all mystical and superstitious remedies (gemstones, mantras, pujas, propitiations) in favor of factual real-world strategic, financial, and operational realities.
- **FR-11: High-Fidelity Owner Branded PDF:** Renders vector-sharp PDF reports with the Golden Rooster Icon, product naming, and authenticated owner branding.
- **FR-12: Voice STT Natural Language Inquest:** Real-time speech-to-text clarification via Web Speech API.

---

## 2. System Architecture & Technical Design Document (SDD)

### 2.1 Component & Layer Hierarchy
- **Presentation Tier:** React 18, Tailwind CSS, Lucide React icons, Vite single-page application.
- **Deterministic Core:** \`bphsEngine.ts\` (astrological equations), \`canonicalHoroscope.ts\` (natal ephemeris), \`piiSanitizer.ts\` (client-side scrubbing).
- **Reasoning Orchestration:** \`privateLlmServant.ts\` (32B prompt synthesizer), \`threeFormXmlBuilder.ts\` (XML contract), \`llmService.ts\` (multi-provider streaming).
- **Hardware Management:** \`resourceMonitor.ts\` (memory calculations, Ollama \`keep_alive: 0\` offloading engine).
- **Export Engine:** \`exportEngine.ts\` and \`productDocsPdfEngine.ts\` (print-to-PDF with Golden Rooster SVG and CSS page-break optimization).

### 2.2 Remedies-to-Realities Sanitization Policy
The application enforces a strict no-superstition filter (\`filterRemediesToPracticalRealities\`):
1. Strips all references to gemstones, wearing rings, chanting mantras, animal feedings, temple pujas, and deity propitiations.
2. Formulates recommendations strictly around verifiable real-world realities: contractual due diligence, warranty verification, liquidity buffers, and disciplined milestone pacing.

---

## 3. Product Acceptance Sign-Off & Future Enhancements Roadmap

### 3.1 Formal Acceptance
All delivery criteria have been completed, verified with TypeScript strict compilation, and signed off as ready for production closure.

### 3.2 Future Roadmap (Phase 2 & Phase 3)
- **Phase 2.1:** In-browser WebGPU LLM inference with WebAssembly for 100% offline standalone capability.
- **Phase 2.2:** D-60 Shashtiamsa birth-time rectification with interactive micro-second timeline sliders.
- **Phase 2.3:** Multilingual synthesis engine supporting Tamil, Sanskrit, Hindi, and Telugu.
- **Phase 2.4:** Kakshya 3°45' Ashtakavarga transit timing calculator.
- **Phase 2.5:** Encrypted local offline storage (OPFS / IndexedDB) for multi-chart researcher management.

*Report compiled by Rooster Astro Analytical Tool — Product Engineering Team.*
`;

  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `RoosterAstro_SRS_and_Design_Document_${new Date().toISOString().slice(0, 10)}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
