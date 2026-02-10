# Frontend file tree

Source of truth for `src/` structure. Update this file in the same commit when adding, removing, or renaming frontend files.

## Tree

Do not list files when the folder name implies them (e.g. `Button/` implies `Button.tsx`, `.module.css`, `.test.tsx`, `index.ts`).

```
src/
├── main.tsx
├── App.tsx
├── App.test.tsx
├── index.css
├── vite-env.d.ts
├── test/
│   └── setup.ts
├── contexts/
│   ├── I18nContext/
│   ├── ThemeContext/
│   └── AuthContext/
├── locales/
│   ├── en.json
│   └── es.json
├── atoms/
│   ├── Button/
│   ├── Input/
│   └── Label/
├── layouts/
│   ├── AppLayout/
│   ├── NavLayout/
│   ├── VerticalCenteredLayout/
│   ├── HorizontalCenteredLayout/
│   ├── BoxLayout/
│   ├── ListLayout/
│   └── InputLayout/
└── pages/
    ├── HomePage/
    ├── InventoryPage/
    ├── BudgetPage/
    └── LoginPage/
```

## Conventions

- **Atoms**: Smallest UI primitives. One component per folder; co-located `.module.css` and `.test.tsx`; `index.ts` as public export. Button has `variant` and `size`; use design palette (CSS variables).
- **Layouts**: Structure and spacing only. One per folder with `index.ts`. Use as building blocks; do not add logic.
- **Contexts**: One context per folder with `index.ts` and `.test.tsx`. I18nContext (locale, t(key)); ThemeContext (light/dark, persistence); AuthContext (login state, dummy token).
- **Pages**: Screen-level; one per folder with `index.ts`; compose atoms and layouts only.
