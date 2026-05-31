# De Los Reyes Doctors — Full Session Handoff

Paste this into a new Claude Code session to resume with complete context.

---

## What We're Building

Full redesign of the **De Los Reyes Doctors** clinic website — a private clinic in the Philippines. This is a clinic website (NOT a SaaS). Patients visit to learn about the clinic and book appointments.

The site has 4 portals:
- `index.html` — Public landing page (WHAT WE ARE REDESIGNING)
- `patient-portal.html` — Patient SPA (login, register, book, records)
- `doctor-portal.html` — Doctor SPA (queue, EHR, schedule)
- `admin-portal.html` — Admin SPA (overview, queue, appointments, doctors, patients)

---

## Project Location

```
d:\websitesShyt\projects\De_los_reyes\
```

Dev server: `node serve.mjs` → `http://localhost:3000`
Screenshot: `node screenshot.mjs http://localhost:3000`

---

## Brand

- **Logo:** `brand_assets/brand_logo.jpg` (D-R-D with stethoscope cross, red letters, green border)
- **Tagline:** "Professional Care You Can Trust"
- **Crimson Red:** #D31A22 (primary accent, CTAs)
- **Clinical Green:** #00A859 (secondary accent, booking buttons)
- **Dark Base:** #11161B
- **Dark Secondary:** #1B232C
- **Mid Gray:** #7F8C8D
- **Green Tint:** #EAF7F0
- **Light:** #F4F6F7
- **White:** #FFFFFF
- **Fonts:** Montserrat (headers) + Open Sans (body)

---

## Tech Stack

- Pure HTML/CSS/JS — single-file pages, all styles inline
- Tailwind CSS via CDN
- Google Fonts: Montserrat + Open Sans
- Supabase (doctors loaded dynamically from DB — fallback to 3 hardcoded cards)
- `supabase-client.js` in project root handles DB connection

---

## Demo Credentials

- Patient: patient@demo.com / demo1234
- Doctor: santos@delosreyes.com / doctor1234
- Admin: admin@delosreyes.com / admin1234

---

## Market Research Insights (Reddit — May 2026)

From `issues/clinic_saas_reddit_market_research.html`:

- **#1 pain:** Clunky UX — too many clicks, software gets in the way
- **#2 pain:** Doesn't work on mobile
- **#3 pain:** Too complicated, overwhelming
- Patients want: simplicity, fast-feeling, clear CTAs, trust signals
- "A clean, fast, mobile-friendly app that just works wins on UX alone"

---

## What's Wrong with the Current index.html

Client reported all 4 problems:
1. Visual design — looks too complicated/overwhelming
2. UX/flow — too many clicks, confusing
3. Mobile — broken
4. Missing features — no FAQ, no location map, no distinct Patient Portal CTA section

---

## Decisions Already Made

- Keep brand colors (Crimson Red + Clinical Green + Dark base) — modernize execution
- Full responsive: desktop AND mobile equally
- Landing page is patient-facing (primary audience: patients booking appointments)
- Hero copy: Claude decides (based on brand + market research)
- Page structure (all sections confirmed by client):
  1. Navbar (sticky, hamburger on mobile)
  2. Hero — banner, tagline, Book Appointment CTA
  3. Services offered
  4. Meet the Doctors (dynamic from Supabase, fallback to 3 cards)
  5. How to Book — 3-step visual
  6. Testimonials
  7. FAQ (accordion) ← MISSING, needs to be added
  8. Location + Hours (map + hours table) ← MISSING, needs to be added
  9. Patient Portal CTA section ← MISSING, needs to be added
  10. Footer

---

## Current index.html State

The file exists and has a working dark-premium design. It has:
- ✅ Floating pill navbar
- ✅ Hero with ECG canvas animation + word-swap headline
- ✅ Red marquee strip
- ✅ Bento services grid (4 services)
- ✅ How it works (3 steps)
- ✅ Doctors section (loads from Supabase, fallback to 3)
- ✅ Testimonials (3 cards)
- ✅ CTA banner (red)
- ✅ Contact section (form + info)
- ✅ Footer
- ❌ FAQ accordion (missing)
- ❌ Location map embed (missing)
- ❌ Dedicated Patient Portal CTA section (missing)
- ❌ Mobile is not fully polished

---

## Agent Pipeline to Run

Use these built-in Claude Code agents in this order:

```
1. product-manager    → Requirements, user stories, prioritized task list
2. ui-ux-designer     → UX flow, layout decisions, simplification, mobile-first
3. frontend-engineer  → Build the full index.html (all missing sections + fixes)
4. security-engineer  → Audit (XSS, form handling, any exposed data)
5. qa-engineer        → Test plan, edge cases, bug report
6. code-reviewer      → Code quality, architecture, production readiness
7. cto-ship-ready     → Final approval — ship or don't ship
```

backend-engineer, database-architect, devops-engineer are lower priority for this task (frontend-only work with existing Supabase integration).

---

## How to Invoke Agents

In Claude Code, use the Agent tool with `subagent_type`:

- `product-manager`
- `ui-ux-designer`
- `frontend-engineer`
- `backend-engineer`
- `database-architect`
- `security-engineer`
- `qa-engineer`
- `devops-engineer`
- `code-reviewer`
- `cto-ship-ready`

---

## First Thing to Do in New Session

1. Read `CLAUDE.md` — project rules (always invoke `frontend-design` skill before writing frontend code)
2. Read `brand_assets/brand_guidelines.png` and `brand_assets/brand_logo.jpg`
3. Run the agent pipeline above
4. Start server with `node serve.mjs`, screenshot after each major change
5. Do at least 2 screenshot comparison rounds before calling done

---

## Key Files

| File | Purpose |
|---|---|
| `index.html` | Landing page — main target |
| `patient-portal.html` | Patient SPA |
| `doctor-portal.html` | Doctor SPA |
| `admin-portal.html` | Admin SPA |
| `serve.mjs` | Dev server (port 3000) |
| `screenshot.mjs` | Puppeteer screenshot helper |
| `supabase-client.js` | Supabase DB connection |
| `brand_assets/brand_logo.jpg` | Clinic logo |
| `brand_assets/brand_guidelines.png` | Full brand spec |
| `issues/clinic_saas_reddit_market_research.html` | Market research |
| `CLAUDE.md` | Project rules — READ FIRST |
