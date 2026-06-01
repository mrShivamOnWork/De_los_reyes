# Roadmap — De Los Reyes Doctors

---

## Phase 0 — Pre-Launch Fixes (NOW — before any real users)

**Goal:** Fix the critical bugs that block production use.

| Task | Priority | Effort |
|------|---------|--------|
| Create `billing_entries` table in Supabase | Critical | 1 hour |
| Fix admin auth routing trap (deep link hash bypass) | Critical | 1–2 hours |
| Replace all placeholder content (address, phone, email, maps) | Critical | 30 min (client input needed) |
| Wire contact form to Supabase or email service | Critical | 1–2 hours |
| Fix "0% SATISFACTION RATE" broken stat | High | 15 min |
| Fix logo white background square | High | 30 min |

**Exit criteria:** All pages load without errors. Billing section works. No placeholder content visible.

---

## Phase 1 — UI Polish Sprint (Post-Launch, Week 1–2)

**Goal:** Resolve all documented UI/UX issues from `issues_to_be_fixed.txt`.

| Task | Priority |
|------|---------|
| Fix doctor schedule red highlighting | High |
| Fix timestamp format bugs (AMAM, missing space) | High |
| Fix admin dashboard date inconsistency | High |
| Fix patient portal sidebar profile widget misalignment | Medium |
| Fix EHR records raw "s" variable bug | Medium |
| Remove duplicate "+ NEW APPOINTMENT" button | Medium |
| Add active state to filter pills | Medium |
| Fix billing date cell text wrapping | Medium |
| Remove green rule line from doctor initials | Medium |
| Demote Delete button in doctor cards | Medium |
| Fix contact form placeholder values | Medium |

---

## Phase 2 — Production Hardening (Month 1)

**Goal:** Production-ready security and reliability.

| Task | Notes |
|------|-------|
| Deploy to hosting (Vercel or Netlify) | Point custom domain |
| Verify all Supabase RLS policies with anon role | Test: anon can only read active doctors |
| Add CSP `<meta>` tags | Medium security priority |
| Add SRI hashes to CDN scripts | Medium security priority |
| Load test queue polling under concurrent users | Ensure 30s polling scales |
| Set up Supabase database backups | Configure in Supabase dashboard |

---

## Phase 3 — Enhanced Features (Month 2–3)

| Feature | Value |
|---------|-------|
| Email appointment confirmations (Resend) | Reduces no-shows |
| Supabase Realtime for queue updates | Eliminates 30s polling lag |
| PDF export for EHR records | Doctor clinical workflow |
| SMS appointment reminders (Semaphore) | Philippine patients prefer SMS |
| Doctor availability calendar | Prevents overbooking |

---

## Phase 4 — Future Growth (Month 4+)

| Feature | Notes |
|---------|-------|
| PhilHealth integration | Billing compliance |
| Lab results file upload | Attach PDFs/images to EHR |
| Analytics dashboard | Revenue + volume reports |
| Multi-clinic support | Remove hardcoded CLINIC_ID |
| Mobile app (React Native) | If web adoption validates the product |
| Telemedicine | Add if remote consultation demand exists |
