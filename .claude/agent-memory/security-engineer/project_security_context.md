---
name: project-security-context
description: Security architecture, known vulnerabilities, and key findings for the De Los Reyes clinic landing page and portals
metadata:
  type: project
---

This is a public-facing clinic web app (index.html + patient/doctor/admin portals) backed by Supabase.

**Stack:** Pure HTML/CSS/JS (no framework), Tailwind CDN, Supabase JS SDK via jsDelivr CDN, no build toolchain.

**Auth model:** Supabase anon key is exposed client-side (by design for this SDK pattern), but Row-Level Security (RLS) is relied upon to enforce data isolation. RLS correctness has NOT been verified — this is the highest-risk unknown.

**Key security findings from first audit (2026-05-31):**

1. CRITICAL — Exposed Supabase anon key in supabase-client.js (line 3). Key is `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`. This is expected for Supabase anon keys but requires RLS to be correctly configured on ALL tables. If RLS is misconfigured, this key allows unauthenticated reads/writes.

2. HIGH — `loadDoctors()` in index.html (lines 1623–1643) uses unescaped template literals `${p.name}`, `${p.spec}`, `${p.bio}`, `${p.photo}`, `${p.sched}` injected directly into `grid.innerHTML`. If Supabase DB is compromised or an admin inserts malicious data, stored XSS executes for all visitors.

3. HIGH — `card()` function sets `src="${p.photo}"` and `alt="${p.name}"` without escaping. A photo URL containing `"` breaks out of attribute context. A name containing `"` breaks the alt attribute.

4. MEDIUM — `submitContact()` uses `alert(\`Thank you, ${name}!\`)`. Native alert() does NOT execute HTML/JS, so this is NOT an XSS vector. The name value is safe here.

5. MEDIUM — No CDN SRI (Subresource Integrity) on Supabase JS CDN or Tailwind CDN scripts.

6. MEDIUM — Google Maps iframe has no `sandbox` attribute.

7. LOW — No Content-Security-Policy header (static HTML, so requires server config).

8. LOW — `sbCancelAppointment` and `sbRescheduleAppointment` in supabase-client.js update by appointment ID only, with no ownership check in the JS layer (relies entirely on Supabase RLS).

9. INFO — Admin/Doctor portal links are visible in the page footer and contact section, exposing their URLs to all visitors.

**RLS verification is the most critical outstanding item** — without confirming RLS policies, the anon key exposure is unquantifiable risk.

**Why:** First full security audit of the project. Use this as baseline for future sessions.

**How to apply:** When reviewing any future changes to supabase-client.js, doctor card rendering, or portal auth flows, reference these findings to avoid re-introducing them.
