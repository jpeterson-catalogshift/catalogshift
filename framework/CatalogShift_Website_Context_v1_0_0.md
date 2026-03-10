# CatalogShift — Website Setup Context

| | |
|---|---|
| **Filename** | CatalogShift_Website_Context.md |
| **Document version** | 1.0.0 |
| **Status** | Active |
| **Created** | 2026-03-08 |
| **Last updated** | 2026-03-09 |
| **Updated by** | Jeremy Peterson |

---

## Purpose of This Document

This document provides context for all work related to building and deploying the CatalogShift website. It is intended for use with AI systems, collaborators, or developers to ensure consistent direction across sessions.

---

## Current Infrastructure State

| Component | Status | Details |
|---|---|---|
| Domain | Configured | catalogshift.com — managed via AWS Route 53 |
| GitHub | Active | https://github.com/jpeterson-catalogshift/catalogshift |
| Logo | Active | assets/logo/ in GitHub repo |
| Hosting | Live | AWS Amplify — auto-deploys from main branch |
| Live Site | Deployed | https://catalogshift.com |

---

## Architecture: AWS Amplify

The site is hosted on **AWS Amplify**, connected directly to the GitHub repository.

**Why Amplify:**
- Native integration with AWS Route 53 (same account as domain)
- Direct GitHub connection — deploys automatically on every push
- No server configuration required
- Free tier covers a basic content site
- SSL certificate provisioned automatically
- DNS records configured automatically because domain is in Route 53 on the same account

**Deployment workflow:**
```
Edit files locally → push to GitHub → Amplify auto-deploys → live at catalogshift.com
```

---

## Site Structure

**Format:** Multi-page static HTML site

**Live pages:**
- `index.html` — Homepage
- `about.html` — Jeremy's background and CatalogShift origin
- `work.html` — Portfolio / selected projects
- `contact.html` — Contact section

**Future expansion possibilities:**
- Blog/articles section
- Consulting services page
- Resources or frameworks page

---

## Visual Style

**Style:** Clean, light, professional — consultant/advisor aesthetic

**Design principles:**
- No hype language in design or copy
- Calm, analytical tone that matches the CatalogShift voice
- Typography-forward — content and clarity over decoration
- Stripe/Linear inspired: dark hero, blue accent, frosted glass nav

**Fonts:** Bricolage Grotesque (display) + Figtree (body)
**Accent color:** #2F6FDB / #5A93F0
**Hero background:** #080B14 with blue gradient mesh

---

## GitHub Repo Structure

```
catalogshift/
  index.html
  about.html
  work.html
  contact.html
  assets/
    style.css
    logo/
      catalogshift-logo-vg.svg
      catalogshift_logo.png
      catalogshift-favicon32.png
      catalogshiftfavicon-16.png
    images/
      readme.md
  framework/
  infrastructure/
  research/
  README.md
  CHANGELOG.md
  content_draft.md
  context_v1_2_0.md
```

Note: A duplicate style.css at the repo root was removed on 2026-03-09. Canonical CSS is at `assets/style.css` only.

---

## Primary Call to Action

**Email CatalogShift** → mailto:hello@catalogshift.com

Secondary:
- Connect on LinkedIn: linkedin.com/in/jeremypetersononlinemarketing

---

## Owner Context

**Jeremy Peterson** — systems practitioner, 28 years enterprise experience. GitHub and Route 53 configured. Site live and deployed via Amplify.

---

## Voice and Tone Reference

All site content reflects the CatalogShift voice:
- Practical and grounded in real operational experience
- Reflective and observational — not declarative or hype-driven
- Calm and analytical — systems thinking, not marketing

> The most important part of an AI system is the context it operates within.

---

## Related Context Documents

- **context_v1_2_0.md** — Site governance, change management, AI work rules (current active version)
- **content_draft.md** — Single source of truth for all website copy (v1.0.4)
- **CHANGELOG.md** — Site version history
- **CatalogShift_Context_Documents.md** — Core concept, audience, themes, voice
