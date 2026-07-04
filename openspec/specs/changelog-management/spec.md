## Purpose

Maintain a version-controlled changelog of project releases. Release notes live in `changelog/<version>.md` files and are consumed by the GitHub release workflow when present.

## Requirements

### Requirement: Changelog directory exists at repository root
The repository SHALL contain a `changelog/` directory at the git root.

#### Scenario: Directory is present
- **WHEN** the repository root is inspected
- **THEN** a `changelog/` directory exists with one Markdown file per release version

### Requirement: Each release has a dedicated changelog file
For every release, the system SHALL create a Markdown file named `changelog/<version>.md`.

#### Scenario: Release file exists for v1.7.0
- **WHEN** the `changelog/` directory is listed
- **THEN** a file named `changelog/v1.7.0.md` exists

#### Scenario: All historical releases are covered
- **WHEN** the set of files in `changelog/` is compared to the set of released versions
- **THEN** every released version has a corresponding Markdown file

### Requirement: Release files contain title, date, and changes
Each release file SHALL include the release version as a top-level heading, the release date, and a bullet list of changes.

#### Scenario: v1.7.0 file has required sections
- **WHEN** `changelog/v1.7.0.md` is read
- **THEN** it contains a `# v1.7.0` heading
- **AND** it contains the release date `2026-07-03`
- **AND** it contains the changes from the corresponding GitHub release body

### Requirement: Root CHANGELOG.md indexes all releases
The repository SHALL contain a root `CHANGELOG.md` file that lists all releases in reverse chronological order and links to each release file.

#### Scenario: Index links to latest release
- **WHEN** `CHANGELOG.md` is read
- **THEN** it contains a link to `changelog/v1.7.0.md`

#### Scenario: Index is ordered newest first
- **WHEN** the order of release links in `CHANGELOG.md` is inspected
- **THEN** v1.7.0 appears before v1.6.0, which appears before v1.5.1, and so on

### Requirement: AGENTS.md references changelog location
The `AGENTS.md` file SHALL include guidance telling agents to update the changelog for user-facing changes.

#### Scenario: Agent guidance is present
- **WHEN** `AGENTS.md` is searched for changelog guidance
- **THEN** it contains a reference to the `changelog/` directory or `CHANGELOG.md`
- **AND** it instructs agents to document user-facing changes there

### Requirement: Release workflow uses changelog file when present
The `.github/workflows/release.yml` workflow SHALL read `changelog/v<version>.md` and use its contents as the GitHub release body when the file exists.

#### Scenario: Changelog file exists for the release
- **WHEN** `changelog/v1.8.0.md` exists and the release workflow runs for version `1.8.0`
- **THEN** the created GitHub release body contains the contents of `changelog/v1.8.0.md`

### Requirement: Release workflow falls back to generated notes when changelog file is absent
The release workflow SHALL use `--generate-notes` to produce the default PR list when `changelog/v<version>.md` does not exist.

#### Scenario: Changelog file is missing
- **WHEN** `changelog/v1.8.1.md` does not exist and the release workflow runs for version `1.8.1`
- **THEN** the created GitHub release body contains the auto-generated "What's Changed" PR list

### Requirement: Every release body includes a compare URL
Regardless of whether the changelog file is used or generated notes are used, the release body SHALL contain a link comparing the previous release tag to the new release tag.

#### Scenario: Custom changelog body has compare URL
- **WHEN** the release workflow uses `changelog/v1.8.0.md` as the release body
- **THEN** the release body also contains `**Full Changelog**: https://github.com/jocaruser/illo3d/compare/v1.7.0...v1.8.0`

#### Scenario: Generated notes body has compare URL
- **WHEN** the release workflow uses `--generate-notes`
- **THEN** the generated release body contains a `Full Changelog` compare URL
