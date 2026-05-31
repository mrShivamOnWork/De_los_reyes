---
name: project-patient-portal
description: "Patient portal (patient-portal.html) requirements spec — screen inventory, component list, data flow, task list. Produced 2026-05-31."
metadata:
  type: project
---

Patient portal spec is fully locked per HANDOFF.md. No design decisions need re-asking.

Key facts:
- Single file: patient-portal.html
- Stack: Tailwind CDN + Playfair Display/Figtree (NOT Montserrat/Open Sans — HANDOFF.md overrides locked spec preamble)
- Supabase via supabase-client.js (already in root)
- Mobile-first, dark theme, bottom tab bar on mobile, left sidebar on desktop (>=1024px)
- 5 tabs: Home, Book, Appointments, Records, Profile
- Auth: email/password login + full registration form (12 fields)
- Role guard: sbCheckProfileRole() — only "patient" role allowed
- Demo: patient@demo.com / demo1234

**Why:** Patient portal is step 1 of the 3-portal rebuild pipeline.

**How to apply:** When building patient-portal.html, reference this spec for correct function names and screen states. Do not re-ask any design questions.

Related: [[project-delosreyes-clinic]], [[pm-session-may2026]]
