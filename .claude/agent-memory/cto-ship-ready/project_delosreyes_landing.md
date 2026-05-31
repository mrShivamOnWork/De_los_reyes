---
name: project-delosreyes-landing
description: De Los Reyes Doctors clinic landing page — architecture, known risks, and ship-readiness context
metadata:
  type: project
---

Public landing page for De Los Reyes Doctors, a private clinic in Manila, Philippines.
Single `index.html` file, all styles/scripts inline (no build step, no CI/CD).
Stack: Tailwind CSS CDN, Google Fonts CDN, Supabase JS CDN, plain inline JS.
Supabase anon key is hardcoded in `supabase-client.js` — safe ONLY if RLS policies are properly configured in the Supabase dashboard.

**Known technical debt at time of first ship-readiness review (2026-05-31):**
- No SRI hashes on Supabase or Tailwind CDN scripts — supply-chain risk, medium priority.
- No Content-Security-Policy header — medium priority.
- `setInterval` for word-swap headline never cleared — trivial memory non-issue in practice for a landing page.
- `.hours-table tr.today` CSS class exists but no JS sets it — dead CSS, no functional impact.
- Contact form `submitContact()` uses `alert()` dialogs — functional but not polished; no backend delivery (form is cosmetic).
- Five client content placeholders live in production: address, phone, email, Google Maps embed URL, and Supabase RLS verification.

**Why:** All blocking issues were resolved by 7-agent pipeline before CTO review.
**How to apply:** When reviewing future changes to index.html, check whether any of the above debt items have been resolved or worsened. Prioritize SRI hashes and CSP before any future security audit.
