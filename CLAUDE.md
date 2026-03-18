# CatalogShift — Claude Code Instructions

## Project
Static consulting website for CatalogShift (Jeremy Peterson).
Deployed via AWS Amplify from GitHub: https://github.com/jpeterson-catalogshift/catalogshift
Four pages: index.html, about.html, work.html, contact.html + assets/style.css

## Session Initialization (required before any changes)
Read both of these files at the start of every session:
1. `framework/context_v1_2_3.md` — governance and business rules (active version)
2. `framework/content_draft_v1_0_5.md` — single source of truth for all copy (active version)

Do not propose or make any changes until both are confirmed as read.

## Key Rules

**KEEP / CHANGE / WHY** — required before every edit. Present it, then stop and wait
for explicit owner confirmation before touching any file. Never present and immediately proceed.

**Branch strategy**
- `main` — production, auto-deploys via Amplify. No direct edits ever.
- `content` — copy, labels, CTAs, email addresses
- `dev` — HTML structure, CSS, JS, new features
- `hotfix` — urgent live-site corrections only

**Metrics & claims** — several items are blocked from the public site.
Check governance doc Section 2.4 before publishing any stats, client names, or claims.

**Dependency mapping** — before any edit, identify all files affected and confirm
with owner before proceeding.

## Active File Versions
| File | Active version |
|---|---|
| Governance | `framework/context_v1_2_3.md` |
| Content draft | `framework/content_draft_v1_0_5.md` |
| Changelog | `framework/CHANGELOG_v1_0_4.md` |
| Site version | 1.0.4 |

## Easter Egg — Echoes RPG (Separate Sub-Project)

The `easter-egg/` folder contains a hidden text-based RPG game. It is a completely
separate project from the CatalogShift consulting website.

**When working on CatalogShift:**
- Never touch anything inside `easter-egg/`
- Governance rules, content drafts, and metrics restrictions do not apply to it
- Session initialization (framework files) is not required for Easter Egg work

**When working on the Easter Egg:**
- Governance and content rules do not apply
- Branch strategy still applies — use `dev` for new level development, `hotfix` for live bug fixes
- Design reference: `easter-egg/DESIGN.md`
- Full design docs: Notion (page IDs in memory file)
- The easter-egg folder deploys automatically alongside the main site via Amplify — this is intentional
