---
name: project-design-tokens
description: Established design tokens for De Los Reyes index.html — colors, spacing, animation, typography
metadata:
  type: project
---

## Color tokens (defined in :root)

- `--green: #00A859` — Clinical Green, primary CTAs (Book, success states)
- `--green-dark: #007A42` — hover state for green buttons
- `--green-bright: #00D46C` — accent highlight
- `--crimson: #D31A22` — Crimson Red, secondary CTAs, marquee, Directions button
- `--crimson-dark: #A8141B` — hover state for crimson buttons
- `--gold: #E4A726` — italic/em highlight color in section-h2
- `--gold-light: #F5C842`
- `--bg: #080E14` — darkest base
- `--bg-2: #0C1520` — slightly lighter layer
- `--bg-3: #111E2B` — elevated cards
- `--bg-portal: #11161B` — NEW token for Patient Portal CTA section (add to :root)
- `--bg-card: rgba(255,255,255,0.035)` — card surface
- `--bg-card-h: rgba(255,255,255,0.062)` — card hover surface
- `--border: rgba(255,255,255,0.07)`
- `--border-b: rgba(255,255,255,0.14)` — bolder border
- `--text: rgba(255,255,255,0.90)`
- `--text-m: rgba(255,255,255,0.50)` — secondary text
- `--text-s: rgba(255,255,255,0.28)` — tertiary text
- `--r: 16px` — default border radius
- `--r-lg: 24px` — card/large element border radius
- `--spring: cubic-bezier(0.22,1,0.36,1)` — spring easing for all transitions

## Typography

- Headings: Playfair Display — weights 400, 600, 700, 900
- Body: Figtree — weights 300, 400, 500, 600, 700, 800, 900
- section-h2: clamp(28px, 3.5vw, 46px), weight 700, letter-spacing -0.02em, line-height 1.08
- section-h2 em: italic, color var(--gold)
- eyebrow: 11px, weight 700, letter-spacing 0.2em, uppercase, color var(--green)
- eyebrow has ::before green bar (20px × 2px)
- section-lead: 16px, color var(--text-m), line-height 1.75, max-width 520px
- body: 16px, line-height 1.6

## Spacing

- Section padding: `100px 6%` (desktop), `72px 5%` (mobile <768px)
- Container max-width: 1160px
- section-head margin-bottom: 60px (desktop), 40px (mobile)
- Standard gap: 16px (bento), 20px (portal cards), 24px (doctors grid), 32px (steps)

## Animation rules

- Never `transition-all`
- Only animate `transform` and `opacity` (occasionally `box-shadow`, `background`, `border-color` for state changes)
- Spring easing: `cubic-bezier(0.22,1,0.36,1)` (--spring)
- Hover translateY: -1px (buttons), -4px (cards)
- Card hover transition: 0.3s --spring
- Button hover transition: 0.15s --spring
- Max 2 concurrent animations per viewport
- prefers-reduced-motion: strip all animations globally (already in :root block)

## Button variants

- `.btn-green` — green bg, white text, green shadow
- `.btn-ghost-nav` — transparent, border var(--border-b)
- `.btn-outline-white` — transparent, white border
- `.btn-white` — white bg, crimson text
- `.btn-crimson-outline` — NEW: transparent bg, crimson border and text (#D31A22), hover: rgba(211,26,34,0.10) bg, #FF4D55 text
- `.btn-lg` — 14-15px font, 12px border-radius, larger padding

## Pattern conventions

- Card top-edge accent line: `::before` with `background: linear-gradient(90deg, var(--green), transparent)`, scaleX(0→1) on hover
- Section radial glow background: `radial-gradient(ellipse, rgba(0,168,89,0.055) 0%, transparent 65%)`
- Icon containers: 44-64px square, border-radius 12-18px, rgba(0,168,89,0.10) bg, green stroke SVGs
- fade-up class: IntersectionObserver-driven entrance animation (already implemented in JS)
