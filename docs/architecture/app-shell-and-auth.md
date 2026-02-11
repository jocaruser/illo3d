# App shell and auth flow

## Component tree (providers and routing)

```mermaid
flowchart TB
  subgraph providers [Providers]
    I18nProvider
    ThemeProvider
    PrimeReactProvider
    AuthProvider
    BrowserRouter
  end
  I18nProvider --> ThemeProvider
  ThemeProvider --> PrimeReactProvider
  PrimeReactProvider --> AuthProvider
  AuthProvider --> BrowserRouter
  BrowserRouter --> AppRoutes

  subgraph routes [AppRoutes]
    LoginRoute["/login: LoginPage or Redirect"]
    AppRoute["/: AppLayout or Redirect"]
  end

  AppRoutes --> LoginRoute
  AppRoutes --> AppRoute

  subgraph whenLoggedOut [When not logged in]
    LoginPageOnly[LoginPage only, no sidebar]
  end

  subgraph whenLoggedIn [When logged in]
    AppLayoutShell[AppLayout]
    Sidebar[NavLayout: title, nav links, Log out, theme toggle]
    Main[Outlet: HomePage, InventoryPage, BudgetPage]
    AppLayoutShell --> Sidebar
    AppLayoutShell --> Main
  end
```

## Auth flow

```mermaid
flowchart LR
  subgraph unauthenticated [Unauthenticated]
    A[User visits any path] --> B[Redirect to /login]
    B --> C[LoginPage]
    C --> D[User clicks placeholder login]
    D --> E[Save dummy token to localStorage]
    E --> F[Navigate to /]
  end

  subgraph authenticated [Authenticated]
    F --> G[AppLayout with sidebar]
    G --> H[User clicks Log out]
    H --> I[Clear token, navigate to /login]
    I --> C
  end
```

- **Token key:** `illo3d-token` (AuthContext).
- **Route protection:** No token → only `/login` renders LoginPage; all other paths redirect to `/login`. Token present → `/login` redirects to `/`; `/`, `/inventory`, `/budget` render AppLayout with Outlet.

## Translations (i18n)

- **I18nProvider** wraps the app; provides `t(key, params?)` via useI18n(). Locale files: `src/locales/en.json`, `es.json` (structure ready for Spanish; only EN filled for now).
- **User-facing strings:** All UI copy goes through `t('key')`. Key names: `app.title`, `nav.*`, `auth.*`, `home.*`, `inventory.*`, `budget.*`.
- **Configurable from data:** Currency, company name, markup, etc. come from database (e.g. company.currency) when loaded; do not use translation keys for those.

## UI stack

- **PrimeReact** (Lara theme, light/dark via ThemeContext). **PrimeReactProvider** wraps the app; theme CSS is loaded by `PrimeReactThemeLink` from ThemeProvider.
- **Atoms** (Button, Input, Checkbox) are thin wrappers over PrimeReact; Label unchanged. **TabsLayout** uses TabView (tab strip only). **Inventory tables** use DataTable on the page; TableLayout was removed.
