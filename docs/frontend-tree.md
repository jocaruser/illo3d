# Frontend file tree

Source of truth for `src/` structure. Update this file in the same commit when adding, removing, or renaming frontend files.

## Tree

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
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── atoms/
│   ├── Button/
│   │   ├── Button.tsx, Button.module.css, Button.test.tsx
│   │   └── index.ts
│   ├── Input/
│   │   ├── Input.tsx, Input.module.css, Input.test.tsx
│   │   └── index.ts
│   └── Label/
│       ├── Label.tsx, Label.module.css, Label.test.tsx
│       └── index.ts
├── layouts/
│   ├── AppLayout/
│   │   ├── AppLayout.tsx, AppLayout.module.css, AppLayout.test.tsx
│   │   └── index.ts
│   ├── NavLayout/
│   │   ├── NavLayout.tsx, NavLayout.module.css, NavLayout.test.tsx
│   │   └── index.ts
│   ├── VerticalCenteredLayout/
│   │   ├── VerticalCenteredLayout.tsx, .module.css, .test.tsx
│   │   └── index.ts
│   ├── HorizontalCenteredLayout/
│   │   ├── HorizontalCenteredLayout.tsx, .module.css, .test.tsx
│   │   └── index.ts
│   ├── BoxLayout/
│   │   ├── BoxLayout.tsx, .module.css, .test.tsx
│   │   └── index.ts
│   ├── ListLayout/
│   │   ├── ListLayout.tsx, .module.css, .test.tsx
│   │   └── index.ts
│   └── InputLayout/
│       ├── InputLayout.tsx, .module.css, .test.tsx
│       └── index.ts
└── pages/
    ├── HomePage/
    │   ├── HomePage.tsx
    │   └── index.ts
    ├── InventoryPage/
    │   ├── InventoryPage.tsx
    │   └── index.ts
    ├── BudgetPage/
    │   ├── BudgetPage.tsx
    │   └── index.ts
    └── LoginPage/
        ├── LoginPage.tsx, LoginPage.module.css, LoginPage.test.tsx
        └── index.ts
```

## Conventions

- **Atoms**: Smallest UI primitives (Button, Input, Label). One component per folder; co-located `.module.css` and `.test.tsx`, with `index.ts` as the public export. Button has `variant` (primary, secondary, default) and `size` (sm, md, lg) and uses the design palette (CSS variables).
- **Layouts**: Structure and spacing only (AppLayout, NavLayout, VerticalCenteredLayout, etc.). One layout per folder with `index.ts`. Use as building blocks; do not add logic.
- **Contexts**: Theme (ThemeContext) for light/dark and persistence; Auth (AuthContext) for login state and dummy token.
- **Pages**: Screen-level components; one page per folder with `index.ts`; compose atoms and layouts only.
