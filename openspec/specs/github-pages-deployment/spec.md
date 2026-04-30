# github-pages-deployment Specification

## Purpose

Define the deployment pipeline and build configuration for hosting illo3d on GitHub Pages.

## Requirements

### Requirement: GitHub Pages deployment pipeline

The system SHALL build and deploy the application to GitHub Pages automatically on every push to the `main` branch. The deployment SHALL use a GitHub Actions workflow that builds the app with Vite and deploys the `dist/` directory to GitHub Pages.

#### Scenario: Push to main triggers deployment

- **WHEN** a commit is pushed to the `main` branch
- **THEN** the GitHub Actions workflow builds the application
- **AND** deploys the built artifacts to GitHub Pages

#### Scenario: Deployment uses repository secrets

- **WHEN** the deployment workflow runs
- **THEN** it reads `VITE_GOOGLE_CLIENT_ID` from repository secrets
- **AND** injects it as an environment variable during the Vite build

### Requirement: Vite base path configured for repository subpath

The system SHALL configure Vite with `base: '/illo3d/'` so that all asset URLs in the built HTML resolve correctly under the repository's GitHub Pages subpath.

#### Scenario: Asset URLs include repository name

- **WHEN** the app is built for production
- **THEN** script and link tags in `index.html` reference `/illo3d/assets/...`
- **AND** assets load correctly on `https://<user>.github.io/illo3d/`

### Requirement: HashRouter handles client-side routing on static host

The system SHALL use `HashRouter` from `react-router-dom` instead of `BrowserRouter` so that deep links work correctly on GitHub Pages without server-side rewrite support.

#### Scenario: Direct link to entity detail works

- **WHEN** a user navigates directly to `https://<user>.github.io/illo3d/#/clients/CL1`
- **THEN** the app loads and renders the client detail page
- **AND** no 404 error occurs

#### Scenario: In-app navigation uses hash URLs

- **WHEN** a user clicks a `<Link>` or `navigate()` within the app
- **THEN** the URL updates to `/#/<path>` format
- **AND** the corresponding page renders correctly

### Requirement: Content Security Policy protects against XSS

The system SHALL include a `<meta http-equiv="Content-Security-Policy">` tag in `index.html` that restricts resource loading to known origins. The policy SHALL allow self-hosted scripts and styles, Google Identity Services, Google APIs, and user profile images.

#### Scenario: CSP meta tag is present in built HTML

- **WHEN** the app builds for production
- **THEN** `index.html` contains a CSP meta tag with appropriate directives

#### Scenario: External scripts from Google load correctly

- **WHEN** the app initializes Google Identity Services
- **THEN** the CSP allows scripts from `https://accounts.google.com` and `https://apis.google.com`

#### Scenario: Google API calls succeed

- **WHEN** the app makes fetch requests to Google Sheets or Drive APIs
- **THEN** the CSP `connect-src` directive allows `https://sheets.googleapis.com` and `https://www.googleapis.com`
