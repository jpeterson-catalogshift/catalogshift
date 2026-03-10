# CatalogShift — Site Changelog

| | |
|---|---|
| **Filename** | CHANGELOG_v1_0_4.md |
| **Version** | see entries below |
| **Status** | Active |
| **Created** | 2026-03-08 |
| **Last updated** | 2026-03-10 |
| **Updated by** | Jeremy Peterson |

*Every merge to main requires a changelog entry.*
*Format: [MAJOR.MINOR.PATCH] — YYYY-MM-DD*
*Versioning rules defined in context_v1_0_0.md Section 6.*

---

## [Framework] — 2026-03-10 *(no site version bump — framework files only)*

### Added
- CLAUDE.md — Claude Code session initialization file added to project root
- context files from 2026-03-10 zip: context_v1_2_3.md, content_draft_v1_0_5.md, CHANGELOG_v1_0_4.md, CatalogShift_Context_Documents_v1_0_0.md, CatalogShift_Website_Context_v1_0_0.md
- framework branch added to governance doc Section 1.1 branch strategy table

### Changed
- All framework files standardized to underscore version naming convention (v1.0.0 → v1_0_0)
- Governance doc bumped to v1.2.3 — copyright year fixed (2025 → 2026), framework branch added
- Content draft bumped to v1_0_5 — Card 5 corrected to Search & Findability (AI/LLM moved to resolved decisions)

### Removed
- Unversioned originals removed: CHANGELOG.md, content_draft.md, context_v1.0.0.md, context_v1.1.0.md

---

## [1.0.4] — 2026-03-08

### Fixed
- Nav CTA button "Let's Talk" wrapping to two lines on mobile — added `white-space: nowrap` to `.nav-cta`
- Nav link contrast on dark hero — color increased from `#8892A4` to `#c8d0e8`
- Scroll hint visibility — opacity increased from `0.18` to `0.5`, line gradient from `0.2` to `0.55`
- Nav z-index raised from `200` to `500`
- Logo click — added `pointer-events="none"` inline on SVG in all 4 HTML files
- Content sections given `min-height: 60vh` to prevent footer overlapping nav on ultrawide/short screens

### Changed
- CTA button text updated to "Email CatalogShift" across index.html, about.html, work.html
- Footer nav links removed from all 4 pages — footer now shows copyright only, centered
- Governance doc updated to v1.2.0
- Content draft updated to v1.0.4

---

## [1.0.0] — 2026-03-08

### Added
- index.html — Homepage with hero, problem statement, services grid, difference section, CTA strip
- about.html — About page with bio, services list, CTA
- work.html — Work page with project cards
- contact.html — Contact page with details and what-to-include guidance
- context_v1.0.0.md — Governance and business rules document
- content_draft.md — Single source of truth for all website copy
- CHANGELOG.md — This file

### Content
- Primary contact email: hello@catalogshift.com
- Nav: Work · About · Let's Talk
- Services: Account Health Check, Data Quality Review, Catalog Integration, Listing Optimization, AI/LLM Integration, GTM Strategy

### Decisions
- Page "Writing" launched as "Work" — writing section deferred
- Career history and credentials deferred — site leads with client value proposition
- GMV, attrition, and SKU ROI figures withheld from public site

---

*Unreleased changes go above the most recent version entry.*
