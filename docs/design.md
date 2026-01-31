# Design

## Colour palette (logo-derived)

Source: ILLO 3D logo (green "ILLO", olive shape, blue waves, orange "3D"). Palette is analogous (green + blue) with complementary accent (orange); use with hierarchy so colours do not compete.

| Role | Use | Light | Dark | Hex (placeholder) |
|------|-----|-------|------|------------------|
| Primary | Main actions, links, focus | Green (ILLO) | Same green | ~#2E8B57 |
| Secondary | Hover, accents, details | Blue (waves) | Same blue | ~#1E90FF |
| Accent | Highlights, badges, "3D" | Orange (3D) | Same orange | ~#CC7A00 / #B8860B |
| Text | Body, headings | Black / dark gray | White / light gray | Neutrals |
| Background | Page, surfaces | White | Dark gray | Neutrals |
| Border | Dividers | Light gray | Mid gray | Neutrals |

Rules:
- Primary = one main colour (green); secondary = supporting (blue); accent = sparse (orange).
- Text and background use neutrals for contrast; check WCAG (e.g. 4.5:1 for body text).
- Do not introduce new colours outside this palette without asking; use CSS variables when implementing.
