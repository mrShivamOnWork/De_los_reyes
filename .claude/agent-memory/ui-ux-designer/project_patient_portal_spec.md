---
name: project-patient-portal-spec
description: Finalized UX/UI layout spec for patient-portal.html — dark theme tokens, shell, all 10 screens, empty/loading/sheet patterns
metadata:
  type: project
---

Definitive layout and visual spec for `patient-portal.html`. All decisions are locked.

**Why:** Engineer will implement without deviation — spec must be pixel-precise.

**How to apply:** All future changes to patient-portal.html must reference this spec for token values, spacing, component structure, and interaction states.

## Dark Theme Tokens (override existing :root)
- `--bg-base: #11161B` — page background (replaces --light / white body bg)
- `--bg-surface: #1B232C` — card/panel background (replaces #fff cards)
- `--bg-elevated: #222C38` — inputs, chips, active states
- `--bg-overlay: #0D1318` — deepest layer, modal underlay
- `--border: rgba(255,255,255,0.08)`
- `--border-strong: rgba(255,255,255,0.15)`
- `--text-primary: rgba(255,255,255,0.92)`
- `--text-secondary: rgba(255,255,255,0.52)`
- `--text-muted: rgba(255,255,255,0.28)` — decorative/supplementary only
- `--focus-ring: rgba(0,168,89,0.35)`
- `--spring: cubic-bezier(0.22,1,0.36,1)` — all transitions
- Brand colors unchanged: `--green: #00A859`, `--crimson: #D31A22`

## Shell Dimensions
- Mobile top header: 56px
- Mobile bottom tab bar: 60px + safe-area-inset-bottom
- Mobile content area: calc(100vh - 56px - 60px)
- Desktop sidebar: 248px wide, sticky, 100vh
- Desktop main-header: 64px
- Desktop content-body: max-width 860px, padding 28px 32px

## Navigation
- Mobile: bottom tab bar, 5 tabs (Home / Book / Appts / Records / Profile)
  Active indicator: 3×3px green dot below icon group (not pill/underline)
  Icon: 22px stroke; Label: Montserrat 700 9px uppercase
- Desktop: left sidebar 248px
  Active nav item: bg rgba(0,168,89,0.12), color var(--green), 3px left accent bar via ::before

## Auth Screen
- Desktop: split-screen (420px brand panel left + flex form right)
- Mobile: brand panel hidden, compact logo header + full-width form card
- Auth card: bg var(--bg-surface), border var(--border), br 18px, p 44px 40px
- Form input height: 46px, bg var(--bg-elevated), focus border var(--green)
- Login CTA: full-width, h 48px, green, box-shadow 0 4px 20px rgba(0,168,89,0.3)

## Key Component Specs
- Doctor cards (Book tab): full-width horizontal, photo 70×70px circle, 3 slot buttons (h36px each), single column
- Service filter: horizontal scroll chips (h36px pill), NOT dropdown
- Bottom sheets: slide-up on mobile (border-radius 20px 20px 0 0), centered modal on desktop
  max-height 90vh, drag handle 36×4px, backdrop blur(4px) + rgba(0,0,0,0.6)
- Appointment sub-tabs: pill toggle inside bg-elevated container, NOT filter buttons
- Record cards: collapsed = header row only with chevron, expand in-place (no slide)
- Profile edit: IN PLACE transform, NOT slide panel
- Change password: inline accordion below profile card, collapsed by default

## Empty State Pattern
- Container: padding 64px 24px, center flex column
- Icon box: 64×64px, bg var(--bg-elevated), br 16px, icon stroke rgba(255,255,255,0.3)
- Heading: Montserrat 700 16px text-primary
- Sub: Open Sans 14px text-secondary, max-width 280px, lh 1.65

## Loading State
- Skeleton shimmer ONLY, no spinners
- Shimmer: bg var(--bg-elevated), ::after gradient sweep animation 1.8s infinite
- prefers-reduced-motion: strip shimmer, keep base bg

## Accessibility
- --text-muted NEVER used for interactive labels
- All focus states: box-shadow 0 0 0 3px var(--focus-ring), no outline
- Touch targets: 44×44px minimum
- Bottom nav: role="tablist", each item role="tab"
- Bottom sheet: role="dialog", aria-modal="true", focus trap, Escape closes

See full spec in agent message from 2026-05-31 session.

[[project-design-tokens]]
