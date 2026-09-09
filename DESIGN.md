# Rooster Astro Analytical Tool
# System Design Document (SDD)

**Document ID:** RAAT-SDD-V1.0  
**Version:** 1.0.0 (Production Release)  
**Product Title:** Rooster Astro Analytical Tool  
**Product Owner:** Rooster Astro Analytical Tool (`inboxofarun@gmail.com`)  
**Lead Engineering Partner:** Google DeepMind Gemini AI Lab (Antigravity Agent)  
**Status:** Approved, Verified & Production-Delivered  
**Date:** September 9, 2026  

---

## 1. High-Level Architecture Overview

The **Rooster Astro Analytical Tool** is designed around a modular, decoupled architecture that segregates **Deterministic Mathematical Astronomy** from **Asynchronous AI Reasoning Orchestration**.

```
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
```

---

## 2. Directory Structure & Module Breakdown

```
/
├── REQUIREMENTS.md                     # Software Requirements Specification
├── DESIGN.md                           # System Design Document (This file)
├── metadata.json                       # AI Studio Applet Metadata & Permissions
├── package.json                        # Dependencies & NPM build scripts
├── vite.config.ts                      # Vite build configuration (Port 3000)
├── public/                             # Static public web assets
└── src/
    ├── main.tsx                        # Entry point mounting App
    ├── App.tsx                         # Top-level view orchestrator
    ├── index.css                       # Global Tailwind CSS imports
    ├── types.ts                        # Shared TypeScript interfaces & types
    ├── components/
    │   ├── Header.tsx                  # App bar, Seval Kodi emblem, 32B monitor pill
    │   ├── StudioView.tsx              # D1-D12 South Indian chart & bindu explorer
    │   ├── WorkbenchView.tsx           # Gochara transits, dual-model synthesis
    │   ├── ConfigLogsView.tsx          # Memory inspector, security rules, SRS/SDD export
    │   ├── SouthIndianChart.tsx        # High-precision SVG/CSS South Indian chart renderer
    │   ├── ReasoningServantModal.tsx   # Private LLM packaging & clarification dialogue
    │   ├── ResourceMonitorPane.tsx     # Hardware VRAM meter, traffic light & purge button
    │   ├── LlmConfigSettings.tsx       # Dynamic endpoints & model selection
    │   ├── VoiceClarificationModal.tsx # Web Speech STT interactive audio input
    │   └── PdfInspectModal.tsx         # 54-page Tamil Jathagam PDF reader
    ├── data/
    │   └── canonicalHoroscope.ts       # Canonical planetary longitudes & Ashtakavarga matrices
    └── utils/
        ├── bphsEngine.ts               # Core Parashari mathematical calculations
        ├── intelligentPromptEngine.ts  # Intent & Bhava domain extraction
        ├── piiSanitizer.ts             # Client-side PII scrubbing engine
        ├── threeFormXmlBuilder.ts      # 3-Form XML schema packager
        ├── privateLlmServant.ts        # Model selector, prompt builder & Ollama caller
        ├── resourceMonitor.ts          # Host RAM/VRAM allocator & keep_alive purge
        ├── llmService.ts               # Dual-model multi-provider streaming client
        ├── exportEngine.ts             # Vector print-to-PDF & practical realities filter
        └── productDocsPdfEngine.ts     # Self-contained printable SRS & SDD generator
```

---

## 3. Data Contracts & Structured Interfaces

### 3.1 Outbound 3-Form XML Packaging Standard
All analytical inquiries dispatched to private local LLM reasoning servants (DeepSeek-R1 32B, Qwen 2.5 14B) strictly conform to the 3-Form XML schema:

```xml
<BPHS_Master_Package format_version="1.4" engine="Private_LLM_Reasoning_Servant">
  <System_Directives>
    Authoritative Parashari Astrological Reasoning Engine. Strict BPHS mechanics.
  </System_Directives>

  <!-- Form 1: Temporal Ephemeris & Gochara Transits -->
  <Form_1_Temporal_Ephemeris period="September 2026" anchor="2026-09-09">
    <active_dasha mahadasha="Saturn" antardasha="Mercury" pratyantardasha="Venus" />
    <transit_vectors>
      <planet name="Jupiter" sign="Cancer" degree="12.4" house_from_lagna="8" status="Exalted" />
      <planet name="Saturn" sign="Pisces" degree="04.2" house_from_lagna="4" status="Neutral" />
      <!-- (9 graha vectors) -->
    </transit_vectors>
  </Form_1_Temporal_Ephemeris>

  <!-- Form 2: Natal Astrological Coordinates -->
  <Form_2_Natal_Coordinates native_id="CANONICAL-NATIVE-BPHS-01">
    <lagna rasi="Sagittarius" degree="16.33" navamsa="Aquarius" />
    <moon rasi="Scorpio" nakshatra="Anuradha" pada="4" />
    <divisional_charts>
      <chart type="D9" /> <chart type="D10" /> <chart type="D4" />
    </divisional_charts>
  </Form_2_Natal_Coordinates>

  <!-- Form 3: Scrubbed Querent Narrative & Classified Intent -->
  <Form_3_Querent_Narrative>
    <precision_story_synopsis bhava_focus="4th_House_Conveyance">
      Inquiring regarding optimal timing for acquisition of luxury sports utility vehicle.
    </precision_story_synopsis>
  </Form_3_Querent_Narrative>

  <Output_Schema_Instructions>
    # 1. BPHS D-1 & Divisional Strength Evaluation
    # 2. Vimshottari Dasha Influence Analysis
    # 3. Gochara (Transit) Impact & Timing
    # 4. Synthesized Astrological Conclusion & Practical Realities
    CRITICAL MANDATE: Focus strictly on real-world practical realities (contractual verification, 
    liquidity buffers, milestone pacing). Zero superstitious remedies or ritual propitiations.
  </Output_Schema_Instructions>
</BPHS_Master_Package>
```

---

## 4. Subsystem Details

### 4.1 Hardware Resource Monitor & VRAM Offloading Engine
To safely operate high-parameter reasoning models (e.g. 32B models) on workstations, `resourceMonitor.ts` manages:
- **Footprint Profiles:**
  - `deepseek-r1:32b`: 19.8 GB weights + 2.4 GB KV cache (22.2 GB total).
  - `qwen2.5:14b`: 9.0 GB weights + 1.5 GB KV cache (10.5 GB total).
  - `llama3.1:8b`: 4.9 GB weights + 1.2 GB KV cache (6.1 GB total).
- **Traffic Light Safety:**
  - Green (`< 65%` RAM utilized): Safe for simultaneous chart rendering & inference.
  - Yellow (`65% – 85%` RAM utilized): High memory pressure; warning badge active.
  - Red (`> 85%` RAM utilized): Swap thrash warning; model execution guarded.
- **Immediate VRAM Purge:** Dispatches `POST /api/generate` with `{ "model": activeModel, "keep_alive": 0 }` to force instant GPU/Unified Memory deallocation.

### 4.2 Remedies-to-Realities Sanitization Pipeline
Located in `src/utils/exportEngine.ts`:
- Employs regular expressions that match and remove gemstones (yellow sapphire, blue sapphire, ruby, emerald, etc.), mantras, pujas, temple rituals, animal feedings, and deity propitiations.
- Reconstructs the recommendations block with actionable strategic milestones:
  - Contract and warranty review.
  - Liquidity and contingency capital preservation.
  - Phased timeline execution based on organizational deliverables.

### 4.3 High-Fidelity Print-to-PDF Vector Pipeline
- Generates clean, isolated HTML print blobs containing the **Rooster Icon** (golden and crimson Seval Kodi vector SVG), product owner branding, and A4 print stylesheet.
- Implements `-webkit-print-color-adjust: exact` and explicit `@page { margin: 14mm }` to avoid unformatted text clipping across page boundaries.

---

## 5. Future Enhancements Roadmap (Phases 2 & 3)

1. **Phase 2.1 — In-Browser WebGPU LLM Inference:** WebAssembly-compiled quantized model runtime enabling 100% offline inference directly in Chrome/Safari using WebGPU without host daemons.
2. **Phase 2.2 — D-60 Shashtiamsa Birth Time Rectification:** Interactive sub-second temporal slider correlating past life events with Vimshottari dasha sub-periods.
3. **Phase 2.3 — Multilingual Tamil / Sanskrit Horoscopic Engine:** Full localized reporting with traditional Tamil astrological terminology (*Lagnam, Rasi, Thasai, Bukthi, Gocharam*).
4. **Phase 2.4 — Kakshya & Ashtakavarga Ingress Engine:** Sign subdivision into 3°45' Kakshya segments to calculate micro-transit inflection dates.
5. **Phase 2.5 — Encrypted Local Offline Storage (OPFS / IndexedDB):** Zero-cloud, encrypted client-side database for managing multiple research charts.
