---
name: project-doctor-portal-spec
description: Finalized UX/UI layout spec for doctor-portal.html — dark theme, shell dims, all 4 tabs, EHR form, shift toggle, interaction patterns
metadata:
  type: project
---

Definitive layout and interaction spec for `doctor-portal.html`. All decisions are locked.

**Why:** Engineer will implement without deviation — spec must be actionable and unambiguous.

**How to apply:** All future changes to doctor-portal.html must reference this spec. Tokens mirror [[project-patient-portal-spec]].

## Shell Dimensions
- Desktop sidebar: 240px wide, sticky, 100vh
- Mobile top header: 56px
- Mobile bottom tab bar: 64px + safe-area-inset-bottom
- Desktop content-body: max-width 860px, padding 28px 32px

## Tokens (same as patient-portal dark theme)
- `--bg: #11161B`, `--bg2: #1B232C`, `--bg3: #232D38`
- `--green: #00A859`, `--crimson: #D31A22`
- `--text-primary: rgba(255,255,255,0.92)`, `--text-secondary: rgba(255,255,255,0.52)`, `--text-muted: rgba(255,255,255,0.28)`
- `--border: rgba(255,255,255,0.08)`, `--focus-ring: rgba(0,168,89,0.35)`
- `--spring: cubic-bezier(0.22,1,0.36,1)`

## Tab 1 — Queue (landing tab after login)

### Shift Toggle
- Location: Queue tab header bar, right side; "Queue" h1 on the left
- Component: pill switch 48×26px — green (#00A859) when On, --bg3 when Off
- Label: "On Shift" / "Off Shift", Open Sans 12px, --text-secondary, left of switch
- Off state: Call Next button disabled at 40% opacity

### Queue Row Structure (left to right)
- Queue number badge: 24px circle, --bg3, Montserrat 700 11px
- Patient name (Montserrat 700 14px) stacked above appointment type (Open Sans 12px --text-secondary)
- Wait time: Open Sans 12px --text-muted, right-aligned
- Status badge: pill 28px h — Waiting = --bg3 + white text | In Progress = rgba(0,168,89,0.12) + green text | Done = muted

### Call Next Button
- Desktop: sticky bottom of content column, full width minus 32px gutter, 52px h, green, box-shadow 0 4px 20px rgba(0,168,89,0.3)
- Mobile: fixed bottom above tab bar, full width minus 32px gutter, 52px h

### Current Patient Panel
- Desktop: 360px right side panel, slides in from right (transform translateX), pushes main column
- Mobile: bottom sheet, 90vh, drag handle 36×4px, border-radius 20px 20px 0 0, backdrop blur(4px) + rgba(0,0,0,0.6)
- Panel header: patient name (Montserrat 700 18px) + age | appointment type chip | wait time elapsed
- Below header: EHR form

## EHR Form (inside current patient panel)
- Field order: Diagnosis (text input, 46px h) → Notes (textarea, 120px min-height, resize:vertical) → Follow-up Date (date input, 46px h)
- All inputs: bg --bg3, border --border, br 10px, focus border --green + box-shadow 0 0 0 3px --focus-ring
- "Done" button: full-width, 48px h, green, bottom of panel — closes panel and marks patient status as Done

## Tab 2 — Schedule

### Week Strip
- 7 day pills horizontal, horizontal-scroll on mobile, today pill highlighted green
- Selected day list renders below

### Appointment Row Columns
- Time slot: Open Sans 700 13px, fixed 60px width, --text-secondary
- Patient name + service: stacked 14px/12px
- Status badge: same pill system as Queue rows
- No separate week grid — week strip + day list is the full pattern

## Tab 3 — Patients

### List View
- Search bar: full width, 46px h, --bg3, magnifier icon left, clear X right, sticky below tab header
- Row: patient name + age (stacked) | last visit date | chevron-right icon
- Tap/click: on mobile = full content-area replace; on desktop = right panel (same 360px panel slot)

### Patient Detail
- Header: name + age
- Sub-tabs: "History" | "Info"
  - History: EHR records as collapsed cards, expand in-place (no slide), chevron toggles
  - Info: DOB, contact, address — all read-only

## Tab 4 — Profile

- All fields read-only: name, specialty, PRC license number, clinic, email
- Availability toggle: same 48×26px pill switch, labeled "Accepting Patients"
- Sign Out: text-only button, crimson (#D31A22), bottom of tab, no card wrapper
- No editable fields — admin manages doctor records

## Mobile Bottom Tab Bar
- Queue: Heroicons `queue-list`
- Schedule: Heroicons `calendar-days`
- Patients: Heroicons `users`
- Profile: Heroicons `user-circle`
- Active state: icon + label in --green, 3×3px green dot below label (matches patient-portal nav pattern)
- role="tablist", each item role="tab", aria-selected

## Accessibility
- All focus states: box-shadow 0 0 0 3px var(--focus-ring), no outline
- Touch targets: 44×44px minimum
- Bottom sheet: role="dialog", aria-modal="true", focus trap, Escape closes
- Shift toggle: role="switch", aria-checked

[[project-patient-portal-spec]]
[[project-design-tokens]]
