---
name: project-admin-portal-spec
description: Admin portal exact layout dimensions and interaction patterns for engineer handoff — all 6 sections, modal, right panel
metadata:
  type: project
---

Locked layout spec for admin-portal.html. Design tokens: `--bg:#11161B`, `--bg2:#1B232C`, `--bg3:#232D38`, green `#00A859`, crimson `#D31A22`. Montserrat headers, Open Sans body. Desktop-first, tablet-tolerant.

**Why:** Needed precise measurements before frontend engineer implements the 6-section admin SPA.

**How to apply:** Use these dimensions verbatim. Do not redesign — the spec is locked.

## Shell
- `display: grid; grid-template-columns: 240px 1fr;` — sidebar 100vh fixed, content scrollable
- Sidebar bg: `--bg2`, content bg: `--bg`
- Sidebar nav items: 44px tall, 16px horizontal padding, 3px green left-border on active

## Dashboard
- Header bar: 64px tall, `--bg2`, sticky top 0, full content-column width
- "New Walk-in" button: top-right of header, 40px height, green fill, Montserrat 700 12px uppercase
- Stats row: `grid-template-columns: repeat(3, 1fr)`, 16px gap, cards 100px tall, `--bg3`, 12px radius
- Queue grid: `grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))`, max 4 cols, 16px gap, `--bg2` cards
- Recent appointments: full-width table below queue grid, 10 entries, no pagination

## Queue Section
- Same column grid as Dashboard queue
- Entry row: 44px tall, patient name left, "Remove" right (12px crimson text, no bg, hover underline)
- No drag-and-drop

## Appointments Section
- Filter bar: 56px tall, `--bg2`, flexrow gap 12px — date input 160px, doctor select 180px, status select 140px, all 36px height
- Table: sticky thead, 48px row height, alternating `--bg2`/`--bg3` rows
- Actions column: pencil + X icon-buttons, 32x32px each

## Billing Section
- Same table structure as Appointments
- Status toggle: 52x24px pill, green=Paid, crimson=Unpaid, in-place toggle
- "Add Entry": top-right of section header, same style as Walk-in button
- Daily total: sticky tfoot, right-aligned, Montserrat 700, green text

## Doctors Section
- Grid: `grid-template-columns: repeat(3, 1fr)`, 20px gap, cards 200px tall
- Status badge: 24px pill, green=Active, gray=Inactive
- Delete: inline confirm (replace button with "Sure? Yes/No" for 5s, then revert)
- Edit: opens right panel

## Patients Section
- Search: 320px wide, 40px height, top-left of section
- Table: 48px row height
- Click row: opens right panel with patient detail

## Walk-in Modal
- Center modal, 480px wide, `--bg2`, 16px radius, 24px padding
- Fields stacked: patient search input (autocomplete 4 items, `--bg3` dropdown) + doctor select + service select, 16px gap
- Confirm button: full-width green at bottom
- Backdrop: `rgba(0,0,0,0.6)`, click-outside closes

## Right Panel (Doctor Edit + Patient Detail)
- `position: fixed; right: 0; top: 0; width: 320px; height: 100vh; background: var(--bg2); z-index: 200`
- Animation: `transform: translateX(100%)` → `translateX(0)`, `transition: transform 0.25s cubic-bezier(0.4,0,0.2,1)`
- Close button: 32x32px, top-right corner, 16px from each edge
- Backdrop: `rgba(0,0,0,0.4)`, click closes
