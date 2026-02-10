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
│   ├── Button.tsx, Button.module.css, Button.test.tsx
│   ├── Input.tsx, Input.module.css, Input.test.tsx
│   └── Label.tsx, Label.module.css, Label.test.tsx
├── layouts/
│   ├── AppLayout.tsx, AppLayout.module.css, AppLayout.test.tsx
│   ├── NavLayout.tsx, NavLayout.module.css, NavLayout.test.tsx
│   ├── VerticalCenteredLayout.tsx, .module.css, .test.tsx
│   ├── HorizontalCenteredLayout.tsx, .module.css, .test.tsx
│   ├── BoxLayout.tsx, .module.css, .test.tsx
│   ├── ListLayout.tsx, .module.css, .test.tsx
│   └── InputLayout.tsx, .module.css, .test.tsx
└── pages/
    ├── HomePage.tsx
    ├── InventoryPage.tsx
    ├── BudgetPage.tsx
    └── LoginPage.tsx, LoginPage.module.css, LoginPage.test.tsx
```

## Conventions

- **Atoms**: Smallest UI primitives (Button, Input, Label). One component per file; co-located `.module.css` and `.test.tsx`.
- **Layouts**: Structure and spacing only (AppLayout, NavLayout, VerticalCenteredLayout, etc.). Use as building blocks; do not add logic.
- **Contexts**: Theme (ThemeContext) for light/dark and persistence; Auth (AuthContext) for login state and dummy token.
- **Pages**: Screen-level components; compose atoms and layouts only.
