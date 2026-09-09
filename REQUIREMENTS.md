# Rooster Astro Analytical Tool
# Software Requirements Specification (SRS)

**Document ID:** RAAT-SRS-V1.0  
**Version:** 1.0.0 (Production Release)  
**Product Title:** Rooster Astro Analytical Tool  
**Product Owner:** Rooster Astro Analytical Tool (`inboxofarun@gmail.com`)  
**Lead Engineering Partner:** Google DeepMind Gemini AI Lab (Antigravity Agent)  
**Status:** Approved, Verified & Production-Delivered  
**Date:** September 9, 2026  

---

## 1. Executive Summary & Purpose

### 1.1 Product Purpose
The **Rooster Astro Analytical Tool** is a desktop-grade, zero-ingress astrological computing and comparative AI reasoning platform. It executes deterministic mathematical calculations conforming strictly to Sage Parashara's *Brihat Parasara Hora Sastra (BPHS)*, integrates private local LLM reasoning servants (DeepSeek-R1 32B, Qwen 2.5 14B, and Llama 3.1 8B), and facilitates dual-model comparative cross-validation for sensitive horoscopic assessments.

### 1.2 Core Value Proposition
- **Deterministic Mathematical Precision:** Direct calculation of planetary longitudes, divisional charts (D1 to D12), Ashtakavarga bindu tallies, and Gochara transit vectors without cloud dependencies.
- **Zero-Ingress Privacy:** Client-side PII scrubbing converts querent identity into synthetic tokens (e.g. `CANONICAL-NATIVE-BPHS-01`) before any AI reasoning query is packaged or dispatched.
- **Strict Practical Realities (Zero Superstition):** All remedial advice is strictly stripped of superstitious rituals (gemstones, mantras, pujas, temple visits, animal feedings) and framed into pragmatic, real-world strategic, financial, and operational realities.
- **Hardware-Aware Local Inference:** Integrated resource monitor tracks VRAM footprints for 32B/14B/8B models and provides instant memory release (`keep_alive: 0`).

---

## 2. User Roles & Personas

1. **Vedic Astrological Researcher:** Demands mathematically exact D-1 to D-12 divisional chart calculations, South Indian glyph representations, Ashtakavarga bindu tallies, and Shadbala planetary strength vectors.
2. **Private Querent:** Inquires about timing for career transitions, vehicular/fixed asset acquisitions, and health pacing while requiring strict client-side PII redacting (names, birth coordinates, exact timestamps scrubbed).
3. **Local LLM Systems Engineer:** Operates local host hardware (Apple Silicon / NVIDIA CUDA) with strict memory thresholds, requiring instant VRAM offload (`keep_alive: 0`) and zero cloud data leaks.

---

## 3. Functional Requirements Matrix (FR-01 to FR-12)

| Req ID | Feature / Capability | Functional Specification | Verification Status |
| :--- | :--- | :--- | :--- |
| **FR-01** | **Canonical BPHS Chart Engine** | Computes and displays D1 Rasi, D2 Hora, D3 Drekkana, D4 Chaturthamsa, D7 Saptamsa, D9 Navamsa, D10 Dasamsa, D12 Dwadasamsa in authentic South Indian rectangular grid format with house-from-Lagna numbers, bindu counts, and retrograde markers. | **PASSED & VERIFIED** |
| **FR-02** | **9-Graha Gochara Transits** | Determines active planetary ingresses (Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu) for any target period (e.g., September 2026) calculating exact degrees, nakshatra pada, house from Lagna, house from Moon, and classical dignity. | **PASSED & VERIFIED** |
| **FR-03** | **Vimshottari Dasha Engine** | Calculates three-tier dasha sequence (Mahadasha, Antardasha, Pratyantardasha) with active temporal dates, lord placements, and fractional balances based on Moon longitude in Janma Nakshatra. | **PASSED & VERIFIED** |
| **FR-04** | **Zero-Ingress PII Sanitizer** | Client-side regular-expression engine that sanitizes names, birthdates, locations, phone numbers, and addresses into deterministic tokens (e.g., `CANONICAL-NATIVE-BPHS-01`) before any LLM dispatch. | **PASSED & VERIFIED** |
| **FR-05** | **Tamil Jathagam PDF Parser** | Supports drag-and-drop ingestion of 54-page Tamil Jathagam horoscope PDFs, rendering structured JSON extracts while enforcing local-only processing. | **PASSED & VERIFIED** |
| **FR-06** | **Reasoning Servant 3-Form XML** | Constructs an outbound 3-form XML payload: Form 1 (9-Planet Transit vectors), Form 2 (Natal Chart & D-Charts), Form 3 (Preprocessed Querent narrative with domain-specific Bhava classifications). | **PASSED & VERIFIED** |
| **FR-07** | **Dual-Model Cross Synthesis** | Dispatches queries simultaneously to a Primary Model and Secondary Auditor (Gemini, Claude, OpenAI, or Ollama local models), computing consensus parity score (e.g., 99.2%). | **PASSED & VERIFIED** |
| **FR-08** | **Hardware Resource Monitor** | Real-time memory tracking pane with Traffic Light Status (Green <65%, Yellow 65-85%, Red >85%), host RAM configuration selector (16GB–128GB), and one-click immediate VRAM purge via `keep_alive: 0`. | **PASSED & VERIFIED** |
| **FR-09** | **32B Model Sizing Profiles** | Pre-calibrated memory allocation profiles for DeepSeek-R1 32B (22.2 GB footprint), Qwen 2.5 14B (10.5 GB), and Llama 3.1 8B (6.1 GB). | **PASSED & VERIFIED** |
| **FR-10** | **Practical Realities Enforcement** | Removes all mystical and superstitious remedies (gemstones, mantras, pujas, temple rituals, animal feedings) from synthesized reports, strictly enforcing pragmatic, real-world strategic, financial, and operational realities. | **PASSED & VERIFIED** |
| **FR-11** | **Owner Branded PDF Export** | Produces high-fidelity A4 vector print-to-PDF reports featuring the Golden Rooster Icon, official product naming, authenticated owner branding, transit matrix, and dual-model audit. | **PASSED & VERIFIED** |
| **FR-12** | **Voice STT Interactive Clarification** | Provides hands-free voice audio interaction via Web Speech API with keyword transcription and automatic inquiry slot extraction. | **PASSED & VERIFIED** |

---

## 4. Non-Functional Requirements (NFRs)

- **NFR-01 Security & Isolation:** The system transmits zero natal coordinates or querent PII to third-party endpoints. API keys are managed exclusively through server-side environment variables or client-side non-persisted headers.
- **NFR-02 Computational Performance:** Pure deterministic BPHS planetary positions, Ashtakavarga charts, and Vimshottari dasha calculations execute in less than 25 milliseconds client-side.
- **NFR-03 Hardware Safety:** The application automatically calculates memory headroom for host system RAM and warns users if the selected model footprint risks out-of-memory crashes or thrashing.
- **NFR-04 Output Fidelity:** All PDF print outputs maintain crisp vector resolution, high-contrast typography, and strictly eliminate clipping across page breaks.

---

## 5. Remedial Policy Standard (Practical Realities Mandate)

All recommendation and remedial sections in generated reports are governed by the **Practical Realities Mandate**:
1. **Forbidden Elements:** Any mention of wearing gemstones, astrological rings, chanting mantras, performing pujas/homas, feeding animals, visiting specific temples, or propitiating planetary deities is completely barred.
2. **Mandatory Realistic Replacements:**
   - *Financial / Conveyance:* Contractual term review, comprehensive warranty verification, emergency liquidity preservation, debt interest optimization.
   - *Career / Occupation:* Milestone pacing, documented deliverables, stakeholder political alignment, negotiation timing.
   - *Health / Vitality:* Work-rest rhythm pacing, lifestyle habits, preventive health screenings.

---

## 6. Acceptance Criteria & Sign-Off

- [x] All 12 Functional Requirements fully operational in production build.
- [x] Verified zero-compilation errors (`tsc --noEmit` clean).
- [x] High-fidelity PDF export with Golden Rooster Icon and Product Owner branding.
- [x] Practical Realities filter validated across all report pipelines.
