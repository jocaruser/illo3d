# illo3d style guide

The design system **as built**, extracted from the living code
(2026-07-18).
Unlike the behaviour specs, this file is deliberately technical:
it names classes, tokens and files,
so UI work reuses what exists instead of reinventing it.
Sources of truth it summarises:
[`src/Theme/tokens.css`](../../src/Theme/tokens.css),
[`tailwind.config.js`](../../tailwind.config.js),
[`src/Theme/index.css`](../../src/Theme/index.css).

## Colour tokens

All colours are RGB-triplet CSS variables defined twice —
`:root` (light) and `.dark` — and exposed to Tailwind
as semantic names with alpha support (`bg-warning/10` works).
Components use tokens, never raw palette classes
(the stock-tier yellow is the one sanctioned exception, below).

| Token | Light | Dark |
|---|---|---|
| `surface` | `#F9FAFB` gray-50 | `#030712` gray-950 |
| `surface-elevated` | `#FFFFFF` | `#111827` gray-900 |
| `surface-alt` | `#F3F4F6` gray-100 | `#1F2937` gray-800 |
| `border` | `#E5E7EB` gray-200 | `#374151` gray-700 |
| `text` | `#111827` gray-900 | `#F3F4F6` gray-100 |
| `text-muted` | `#6B7280` gray-500 | `#9CA3AF` gray-400 |
| `primary` | `#2563EB` blue-600 | `#3B82F6` blue-500 |
| `primary-hover` | `#1D4ED8` blue-700 | `#60A5FA` blue-400 |
| `accent` | `#0EA5E9` sky-500 | `#38BDF8` sky-400 |
| `success` | `#16A34A` green-600 | `#4ADE80` green-400 |
| `danger` | `#DC2626` red-600 | `#F87171` red-400 |
| `warning` | `#D97706` amber-600 | `#FBBF24` amber-400 |

Dark mode is Tailwind's `class` strategy:
`initTheme.ts` toggles `dark` on `<html>` before React mounts
(no flash), reading the persisted preference
from the user-preferences store.

There are **no** custom spacing, radius or shadow extensions:
geometry uses stock Tailwind
(`rounded-md`/`rounded-lg`, `shadow-sm`/`shadow-lg`/`shadow-xl`).

## Typography

Self-hosted woff2, preloaded in `index.html`:

- **Display** (`font-display`, all headings via `@layer base`):
  Barlow Condensed 400/600.
- **Body** (`font-body`, on `body`): Manrope 400/500.
- No 700 face is loaded — the heaviest weight is `font-semibold`.

Scale in use:
page `h1` and stat values `text-2xl font-semibold`;
wordmark and dialog titles `text-xl font-semibold`;
card/section headings `text-lg font-semibold`;
the workhorse is `text-sm`;
meta, labels and column headers are `text-xs`,
eyebrows adding `font-semibold uppercase tracking-wider text-text-muted`.

## Buttons

Two classes, defined once in `index.css` `@layer components`:

- `.btn-primary` —
  `inline-flex items-center justify-center gap-2 rounded-md
  bg-primary px-4 py-2 text-sm font-medium text-white`,
  hover to `primary-hover`, `focus-visible` ring,
  `active:scale-[0.98]`, `disabled:opacity-50`.
- `.btn-secondary` — same geometry,
  `border border-border bg-surface-elevated text-text
  hover:bg-surface-alt`.

## Primitives (`src/Component/`)

- `cx.ts` — the classname joiner; use it, not string concat.
- `Card` / `CardHeader` / `CardTitle` / `CardBody` —
  `rounded-lg border border-border bg-surface-elevated shadow-sm`;
  header `border-b px-4 py-3`; body `p-4`;
  add `card-hover-lift` only when interactive.
- `AlertBox` (block, `rounded-md border p-4 text-sm`) and
  `AlertStrip` (inline, `border-l-4 px-3 py-2 text-sm`) —
  both take the severity variants below.
- `DataTable` family — the only way to build tables (below).
- `DialogShell` / `ConfirmDialog` — the only modal (below).
- `FormInput` / `FormTextarea` / `FormSelect` / `Select` /
  `Combobox` — all wrap one `formControlClasses` string:
  `w-full rounded-md border border-border bg-surface-elevated
  px-3 py-2 text-sm` with `focus:ring-1 focus:ring-primary`.
  `FormLabel` `text-sm font-medium`; `FormError` `text-sm
  text-danger` with `role="alert"`; `FormGroup` `space-y-1`.
- `StatCard` — KPI tile; eyebrow label + `text-2xl` value,
  tone-tinted.
- `Breadcrumbs` — `text-sm text-text-muted`, `/` separators,
  current crumb `font-medium text-text`.
- `ThemeToggle` / `LanguageToggle` — segmented control:
  `inline-flex overflow-hidden rounded-md border border-border`,
  selected segment `bg-primary text-white`.
- `LoadingSpinner` (`h-5 w-5 animate-spin text-primary`,
  `role="status"`), `EmptyState`, `NotFoundCard`,
  `ColouredNumber`, `ColourSwatch`
  (`h-4 w-4 rounded-full border border-border`),
  `AuditActionPill`, `StepCard`/`StepGrid`,
  `RelativeTime`, `Toast` (the sole sonner entry point).

Two badge geometries recur; reuse them, do not invent a third:

- **Pill**: `rounded-full px-2 py-0.5 text-xs font-semibold`
  (audit actions, due-date badges, job totals).
- **Chip**: `rounded border px-1.5 py-0.5 text-xs`
  (kanban and calendar job chips).

## Colour semantics

- **Severities** (`alertVariants.ts`) — border+tint+text triads:
  `info` accent, `success`, `warning`, `danger`,
  `primary`, `secondary` (muted).
  `danger`/`warning` render `role="alert"`, the rest `role="status"`.
- **Due-date bands** (`dueDate.ts`): days late `≥ 7` red,
  `≥ 5` orange, `≥ 3` yellow, else none.
  Rendered as danger / warning / a lighter wash of warning —
  there is no yellow token; the mild band is `warning/5`–`/30`.
- **Stock tiers** (`InventoryItem.ts`): stock at or below
  red / orange / yellow thresholds, severest wins.
  The one raw-palette exception lives here:
  the yellow tier uses `text-yellow-600 dark:text-yellow-400`
  in the inventory table so the three tiers stay distinguishable.
- **Money** (`ColouredNumber`): positive `text-success`,
  negative `text-danger`, zero muted;
  expenses force red regardless of sign.
- **Audit actions** (`AuditActionPill`): create/restore success,
  update primary, archive/delete danger,
  migration and unknown muted — all `/15` fills.
- **Job statuses have no colour** — urgency is carried by
  the due-date band, never the status.

## Layout contracts

- **Page well**: `mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8` —
  identical in header, breadcrumb bar and `<main>` (`py-6`).
- **Header**: `sticky top-0 z-30 border-b border-border
  bg-surface-elevated`; nav links `rounded-md px-3 py-2 text-sm
  font-medium`, active `bg-primary/10 text-primary`
  (route-prefix matching).
- **Tables** (`DataTable`): wrapper `overflow-x-auto rounded-lg
  border border-border`; head `bg-surface-alt`, header cells
  `px-4 py-3 text-xs font-semibold uppercase tracking-wider
  text-text-muted`; body zebra-striped via `nth-child`
  (even `surface-alt`, odd `surface-elevated`), no hover state;
  cells `px-4 py-3`; the empty row `px-4 py-8 text-center text-sm
  text-text-muted`.
  Responsive column hiding uses arbitrary variants
  (`[&_tr>*:nth-child(3)]:hidden sm:…:table-cell`).
- **Dialogs** (`DialogShell`): portal;
  backdrop `bg-black/40` click-to-close;
  panel `w-full max-w-md rounded-lg border border-border
  bg-surface-elevated p-6 shadow-xl`,
  `role="dialog" aria-modal`, focus-trapped, Escape closes;
  footer `mt-6 flex justify-end gap-2`,
  cancel `.btn-secondary`, confirm `.btn-primary`.
- **Toasts**: sonner, bottom-right, `richColors closeButton`,
  theme-bound — always via `Toast.ts`.

## Motion

Defined in `tokens.css`, all wrapped in a
`prefers-reduced-motion: reduce` reset:
`dialog-overlay-enter` (150ms fade),
`dialog-panel-enter` (200ms scale-in),
`fade-in`, `slide-up`,
`btn-hover-scale` (1.02/0.98),
`card-hover-lift` (−2px + shadow).

## Known gaps

- No `Badge` primitive — the pill/chip shapes above are
  re-declared inline per feature; extract on next touch.
- No yellow token — the mild tier is improvised twice
  (raw palette in the inventory table,
  reduced-opacity `warning` elsewhere); tokenise on next touch.
- Job statuses render as plain translated text —
  deliberate for now, revisit with the kanban respec.
