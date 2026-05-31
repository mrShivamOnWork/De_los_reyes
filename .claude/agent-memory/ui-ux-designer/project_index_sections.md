---
name: project-index-sections
description: Background rhythm and section order for index.html — which sections exist, their backgrounds, and where new sections slot in
metadata:
  type: project
---

Full page section order and background values for index.html:

1. Hero — `#080E14` (--bg)
2. Marquee Strip — `#D31A22` (crimson)
3. Services Bento — `#080E14` (--bg)
4. How It Works — `#0C1520` (--bg-2)
5. Doctors — `#080E14` (--bg)
6. Testimonials — `#0C1520` (--bg-2)
7. FAQ (new) — `#080E14` (--bg)
8. Location + Hours (new) — `#0C1520` (--bg-2)
9. Patient Portal CTA (new) — `#11161B` (--bg-portal, new token)
10. Contact — `#080E14` (--bg)
11. Footer — `#080E14` (--bg)

**Why:** The existing mid-page crimson CTA band (`cta-sec`) sits between Testimonials and Contact. With the 3 new sections added, it conflicts with the Patient Portal CTA. Decision: remove the existing crimson CTA band, as Patient Portal CTA replaces its function. Alternative: move it between Services and How It Works.

**How to apply:** When adding or redesigning sections, maintain the alternating --bg / --bg-2 rhythm. The Patient Portal CTA uses --bg-portal (#11161B) as a distinct terminal panel before Contact. Do not reuse crimson section background except for the marquee strip.

**New CSS token needed:** `--bg-portal: #11161B;` — add to `:root` block.
