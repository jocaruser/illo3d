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
│   ├── InventoryContext/
│   ├── ThemeContext/
│   ├── AuthContext/
│   └── DriveContext/
├── locales/
│   └── en.json
├── types/
│   ├── inventory.ts
│   └── database.ts
├── services/
│   └── driveApi.ts
├── atoms/
│   ├── Button/
│   ├── Checkbox/
│   ├── Input/
│   └── Label/
├── layouts/
│   ├── AppLayout/
│   ├── NavLayout/
│   ├── VerticalCenteredLayout/
│   ├── HorizontalCenteredLayout/
│   ├── BoxLayout/
│   ├── ListLayout/
│   ├── InputLayout/
│   └── TabsLayout/
└── pages/
    ├── HomePage/
    ├── InventoryPage/
    ├── BudgetPage/
    └── LoginPage/
```

## Conventions

- **Atoms**: Smallest UI primitives. One component per folder; co-located `.module.css` and `.test.tsx`; `index.ts` as public export. Button, Input, Checkbox implemented with PrimeReact (thin wrappers); Label unchanged. Use design palette (CSS variables) where applicable.
- **Layouts**: Structure and spacing only. One per folder with `index.ts`. TabsLayout uses PrimeReact TabView (tab strip only; panel area hidden). Inventory tables use PrimeReact DataTable in the page; no TableLayout. Use as building blocks; do not add logic.
- **Contexts**: One context per folder with `index.ts` and `.test.tsx`. I18nContext (locale, t(key)); InventoryContext (printers, filaments, consumables, CRUD, loadFromDatabase); ThemeContext (light/dark, persistence); AuthContext (login state, Google ID token); DriveContext (Drive access token, requestDriveAccess, lastLoadedDatabase for Load/Save).
- **Pages**: Screen-level; one per folder with `index.ts`; compose atoms and layouts only.
