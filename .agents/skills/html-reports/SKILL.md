---
name: html-reports
description: Create interactive HTML playgrounds for comparing design copy, UI variants, or visual alternatives. Use when the user asks for "html", "playground", "playable", or "alternatives in html".
license: MIT
---

# HTML Reports / Playgrounds

When the user asks for HTML alternatives (e.g. "send me alternatives in html", "playable html", "playground"), generate a **single self-contained HTML file** with interactive tabbed browsing of the options.

## Output Rules

1. **Single file** — no external CSS/JS files. CDN font imports are fine (Google Fonts).
2. **Interactive tabs** — clickable pills/tabs at the top that swap between alternatives without page reload.
3. **Visual fidelity** — match the app's design language as closely as possible:
   - Font: Inter (via Google Fonts)
   - Border radius: `0.5rem` (cards), `0.375rem` (small elements), `9999px` (pills)
   - Colors: neutral palette matching Tailwind slate/gray scales
   - Shadows: subtle (`0 1px 3px rgba(0,0,0,0.08)`)
4. **Save location** — save to `playground/<description>-playground.html`
5. **Include a reference table** at the bottom summarizing each option's tone/vibe.

## Typical Structure

- Page title + subtitle
- Tab pill bar
- Card container with:
  - Version/info display row (if relevant)
  - Content area with the alternatives (shown/hidden by tab selection)
  - Supporting UI elements to provide context (buttons, grids, etc.)
- Tone reference table

## When to Use

- User asks for "html" alternatives
- User asks for a "playground" or "playable" comparison
- User wants to compare copy, design, or UX variants visually
- Any request to "see them in the browser"
