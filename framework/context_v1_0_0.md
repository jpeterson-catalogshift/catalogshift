# CatalogShift — Site Governance & Business Rules

| | |
|---|---|
| **Filename** | context_v1.1.0.md |
| **Document version** | 1.1.0 |
| **Status** | Active |
| **Created** | 2026-03-08 |
| **Last updated** | 2026-03-08 |
| **Updated by** | Jeremy Peterson |
| **Changes** | Updated metrics policy and decisions log — adidas/Staples/Petco, 6M+ rows, 30-50% reduction, AI section all moved to do not publish |

*This document governs all changes to the CatalogShift website codebase and content.*
*All contributors — human and AI — must read this document before making any changes.*

---

## Document Changelog

| Version | Date | Updated by | Changes |
|---|---|---|---|
| 1.1.0 | 2026-03-08 | Jeremy Peterson | Updated metrics policy — adidas/Staples/Petco, 6M+ rows, 30-50% reduction, AI section moved to do not publish. Updated decisions log with exact dates and reasoning. |
| 1.0.0 | 2026-03-08 | Jeremy Peterson | Initial document created |

---

## Table of Contents

1. [Change Management Protocol](#1-change-management-protocol)
2. [Content Governance](#2-content-governance)
3. [Code Standards](#3-code-standards)
4. [AI-Assisted Work Rules](#4-ai-assisted-work-rules)
5. [Review & Deployment Gates](#5-review--deployment-gates)
6. [Versioning & Changelog](#6-versioning--changelog)

---

## 1. Change Management Protocol

### 1.1 Branch Strategy

All changes follow a two-branch model:

| Branch | Purpose | Who deploys |
|---|---|---|
| `main` | Production — what is live on catalogshift.com | Amplify auto-deploys |
| `content` | Content edits — copy, email, labels, CTAs | Merge to main after review |
| `dev` | Code changes — structure, CSS, JS, new features | Merge to main after testing |

**Rules:**
- No direct edits to `main` — ever
- Content changes branch from and merge back to `main` via `content`
- Code changes branch from and merge back to `main` via `dev`
- Every merge to `main` requires a changelog entry (see Section 6)

### 1.2 Change Classification

Before starting any change, classify it:

| Type | Definition | Branch | Review required |
|---|---|---|---|
| **Content** | Copy, headlines, CTAs, email addresses, labels | `content` | Owner review |
| **Style** | Colors, fonts, spacing, layout adjustments | `dev` | Owner review + visual check |
| **Code** | JS logic, HTML structure, new components | `dev` | Owner review + browser test |
| **Config** | Email addresses, URLs, meta tags, file names | `content` or `dev` | Owner review |
| **Hotfix** | Broken link, typo on live site, urgent correction | `hotfix` branch | Expedited review |

### 1.3 The KEEP / CHANGE / WHY Protocol

**Before any revision to an existing file — code or content — the following must be explicitly stated and confirmed before any edits are made:**

- **KEEP** — what is working and must not be changed, and why
- **CHANGE** — what is being revised and why
- **WHY** — the specific reason the change improves the current state

This applies to:
- All copy and content edits
- All CSS and styling changes
- All HTML structural changes
- All JS logic changes
- Any file touched as a downstream dependency of a primary change

No exceptions. If the scope is unclear, ask before touching anything.

---

## 2. Content Governance

### 2.1 Single Source of Truth

- Copy lives in one place only — never duplicated across files
- Email addresses, CTAs, and contact details are defined once and referenced consistently
- If the same content appears on multiple pages, a change to one requires a change to all — this must be called out explicitly before editing

**Current single-source values (update here first):**
```
Primary contact email:  hello@catalogshift.com
LinkedIn URL:           linkedin.com/in/jeremypetersononlinemarketing
Copyright line:         © 2025 CatalogShift · Jeremy Peterson · hello@catalogshift.com
Location:               Graham, WA — available remotely
```

### 2.2 Content Edit Markers

All editable content in HTML files is wrapped in content markers:

```html
<!-- CONTENT: [description of what this is] -->
  Your editable content here
<!-- END CONTENT -->
```

**Rules:**
- Only edit content between markers
- Never move or delete the markers themselves
- Never add HTML structural elements (divs, sections, classes) inside a content block — that is a code change, not a content change
- If a content change requires a structural change, stop — reclassify as a code change and follow the code change process

### 2.3 Content Freeze

Once a section of content is reviewed and approved by the owner it is considered **frozen** until deliberately reopened.

Frozen sections are marked:
```html
<!-- CONTENT: hero headline | STATUS: FROZEN — do not edit without owner approval -->
```

To unfreeze a section: owner must explicitly state intent to revise, KEEP/CHANGE/WHY must be documented, then the status marker is updated to `IN REVISION` before editing begins.

### 2.4 Metrics & Claims Policy

The following information is approved for public use on the site:

| Claim | Approved | Notes |
|---|---|---|
| 28 years experience | ✅ | Safe |
| 200+ global channels | ✅ | Industry-known figure |
| Fortune 50 clients | ✅ | Generic — no names |
| 6M+ rows/month pipeline | ❌ | Do not publish — no client context, deferred for review |
| 30–50% launch timeline reduction | ❌ | Do not publish — no client context, deferred for review |
| adidas, Staples, Petco by name | ❌ | Do not publish — implies CatalogShift client relationship which is not accurate |
| AI/LLM integration content | ❌ | Do not publish — expertise level not yet sufficient to make public claims; revisit when depth increases |
| $50B+ GMV | ❌ | Do not publish |
| Sub-2% attrition | ❌ | Do not publish |
| $1.23 / $123,000 SKU figures | ❌ | Do not publish — reference as "longitudinal analysis" only |
| Specific client volume numbers | ❌ | Do not publish |

---

## 3. Code Standards

### 3.1 Commenting Convention

Comments are mandatory throughout the codebase. Three levels apply consistently:

**Level 1 — File header (every file)**
```html
<!-- ============================================================
     FILE: index.html
     PURPOSE: Homepage — hero, problem statement, services, CTA
     LAST UPDATED: YYYY-MM
     CONTENT EDITS: Find <!-- CONTENT: --> markers throughout
     CODE CHANGES: Branch dev, test in preview before merging to main
     ============================================================ -->
```

**Level 2 — Section headers (every major block)**
```html
<!-- ============================================================
     SECTION: NAVIGATION
     Sticky nav fixed to top, 68px height
     Switches between dark/light class on scroll past hero
     Logo SVG color classes swap via JS scroll listener
     ============================================================ -->
```

**Level 3 — Inline component comments (explain what and why)**
```html
<!-- Logo SVG: class swapped between logo-d (dark bg) and logo-l (light bg) by updateNav() -->
<!-- Nav CTA: always visible, links to mailto — not a page link -->
<!-- Scroll hint: fade animation, hidden on mobile via @media -->
```

**CSS comments:**
```css
/* ── SECTION: Navigation ── */
/* Nav dark state: used when scrolled within hero section */
/* Nav light state: used when scrolled below hero — triggered by JS */
/* --blue-glow: used for btn-glow hover state box-shadow only */
```

**JS comments:**
```javascript
// updateNav() — runs on scroll, switches nav class and logo class
// Threshold: hero height minus 80px to trigger before full scroll
// passive: true — performance optimization for scroll listener
```

### 3.2 No Inline Styles

- All styling goes through CSS classes — no `style=""` attributes in HTML
- Exception: one-off positioning adjustments during active development, but must be moved to CSS before merging to main
- If a style is applied inline temporarily, comment it: `<!-- TEMP STYLE: move to CSS before merge -->`

### 3.3 No Magic Numbers

Any value in CSS or JS that isn't self-explanatory gets a comment:

```css
height: 68px; /* Nav height — referenced in hero padding calc() */
padding-top: calc(68px + 5rem); /* 68px = nav height, 5rem = hero top breathing room */
```

```javascript
const threshold = heroHeight - 80; // 80px early trigger so nav transition feels smooth
```

### 3.4 File Naming Convention

| File | Purpose |
|---|---|
| `index.html` | Homepage |
| `about.html` | About page |
| `work.html` | Work / portfolio page |
| `contact.html` | Contact page |
| `style.css` | Shared stylesheet (when split from inline) |
| `context_v{MAJOR}.{MINOR}.{PATCH}.md` | Governance document — versioned filename, old versions retained for rollback |
| `content_draft.md` | Working content document |
| `CHANGELOG.md` | Site version history |

---

## 4. AI-Assisted Work Rules

### 4.1 Session Initialization

Every Claude session that involves changes to the site must begin by reading:
1. This governance document (`context.md`)
2. The content draft (`content_draft.md`)
3. Any files that will be touched in the session

No changes should be proposed or made until these documents have been confirmed as read.

### 4.2 Dependency Mapping Before Any Edit

Before touching any file, Claude must identify the full dependency chain:

- **What other files does this change impact?**
- **What downstream elements depend on the thing being changed?**
- **Are there other pages with the same content that need the same update?**

This must be stated explicitly and confirmed by the owner before any edits begin. Claude must never make a change silently that has known downstream consequences.

Example:
> "Changing the email address in index.html also requires the same change in about.html, work.html, contact.html, and the footer of all four pages. Confirming all five locations before I proceed."

### 4.3 KEEP / CHANGE / WHY Required

Claude must apply the KEEP / CHANGE / WHY protocol before every edit — no exceptions. This applies even for small changes. The protocol is a forcing function, not a formality.

### 4.4 Scope Boundaries

- Claude must not edit files not shown or confirmed in the current session — unless dependency mapping has identified them as required and the owner has confirmed
- If a required file is not in the current session, Claude must ask for it before proceeding — not assume, not guess, not skip
- If a change would require touching more files than were anticipated at session start, Claude must pause, re-map the full scope, and get confirmation before continuing

### 4.5 Uncertainty Protocol

If Claude is uncertain about:
- Whether a change is content or code
- Whether a file has downstream dependencies
- Whether a metric or claim is approved for public use
- Whether a section is frozen

— Claude must ask. Never assume. Never proceed without confirmation on ambiguous scope.

---

## 5. Review & Deployment Gates

### 5.1 Content Change Checklist

Before merging a content branch to main:

- [ ] KEEP / CHANGE / WHY documented and confirmed
- [ ] Only content between `<!-- CONTENT: -->` markers was changed
- [ ] No HTML structure, classes, or attributes were modified
- [ ] Single-source values (email, LinkedIn, copyright) are consistent across all pages
- [ ] Metrics and claims comply with Section 2.4 policy
- [ ] Changelog entry written
- [ ] Owner has reviewed the change in browser preview

### 5.2 Code Change Checklist

Before merging a dev branch to main:

- [ ] KEEP / CHANGE / WHY documented and confirmed
- [ ] Dependency mapping completed — all impacted files identified and updated
- [ ] File header comment updated with new date
- [ ] All new code sections have Level 2 and Level 3 comments
- [ ] No inline styles remaining (or all marked `TEMP STYLE`)
- [ ] No magic numbers without comments
- [ ] Tested in Chrome and Safari (mobile and desktop)
- [ ] No console errors
- [ ] Changelog entry written
- [ ] Owner has reviewed in browser preview

### 5.3 Deployment

- Amplify auto-deploys on merge to `main`
- Confirm live site after every deployment — spot check all four pages
- If something looks wrong after deployment, do not push a fix directly to main — create a `hotfix` branch, fix, preview, then merge

---

## 6. Versioning & Changelog

### 6.1 Semantic Versioning

The site follows `MAJOR.MINOR.PATCH` versioning:

| Increment | When to use | Example |
|---|---|---|
| `PATCH` | Copy edits, typos, email/URL updates | 1.0.0 → 1.0.1 |
| `MINOR` | New section, new page, new service card | 1.0.0 → 1.1.0 |
| `MAJOR` | Full redesign, structural rebuild, new site direction | 1.0.0 → 2.0.0 |

Current version: **1.0.0**

### 6.2 Changelog Format

Every merge to main gets a changelog entry in `CHANGELOG.md`:

```markdown
## [1.0.1] — 2026-03-08
### Changed
- Updated primary contact email to hello@catalogshift.com across all pages

### Fixed
- (nothing)

### Added
- (nothing)
```

---

## 7. Open Items & Decisions Log

*Use this section to track decisions that were made and why — so context isn't lost between sessions.*

| Date | Decision | Reason |
|---|---|---|
| 2026-03-08 | Primary email set to hello@catalogshift.com | Confirmed live as of 2026-03-08 — jpeterson@ retired from public use |
| 2026-03-08 | Page "Writing" renamed to "Work" | Better fits consulting positioning — writing section to be added later |
| 2026-03-08 | GMV, attrition, and SKU ROI figures removed from public site | Confidential — reference as methodology only |
| 2026-03-08 | Site leads with "what I can do for you" not career history | Strategic choice — consulting audience, not recruiter audience — history to be added later |
| 2026-03-08 | adidas, Staples, Petco not published | Implies CatalogShift client relationship which is not accurate — these are prior employer engagements not CatalogShift engagements |
| 2026-03-08 | 6M+ rows/month not published | Without employer context the stat is an unanchored claim — deferred for review |
| 2026-03-08 | 30–50% timeline reduction not published | Without employer context the stat is an unanchored claim — deferred for review |
| 2026-03-08 | AI/LLM section removed from About page | Current expertise level not sufficient to make public consulting claims — revisit as depth increases |

---

*This is a living document. Update it when rules change, decisions are made, or new patterns emerge.*
*Every change to this document requires a Document Changelog entry at the top and a version increment.*
*Governance changes follow the same semantic versioning as the site — a rule change is a MINOR increment, a typo fix is a PATCH.*
