# docker-dev-env Specification

## Purpose
TBD - created by archiving change docker-dev-environment. Update Purpose after archive.
## Requirements
### Requirement: Container provides Node.js development environment

The Docker container SHALL provide Node.js 20 LTS with pnpm package manager pre-installed. The container SHALL keep running until explicitly stopped.

#### Scenario: Container starts successfully
- **WHEN** user runs `make up` or `docker compose up -d`
- **THEN** container starts and remains running

#### Scenario: Node and pnpm are available
- **WHEN** user runs `make bash-exec CMD="node --version"`
- **THEN** output shows Node.js version 20.x

### Requirement: Makefile provides development workflow commands

The Makefile SHALL provide shortcuts for all common development operations. Commands SHALL execute inside the Docker container.

#### Scenario: Initialize project
- **WHEN** user runs `make init` on a fresh clone
- **THEN** Docker image is built, container starts, and dependencies are installed

#### Scenario: Start development server
- **WHEN** user runs `make dev`
- **THEN** Vite dev server starts and is accessible at http://localhost:5173

#### Scenario: Install dependencies
- **WHEN** user runs `make install`
- **THEN** pnpm install executes in container and node_modules appears on host

#### Scenario: Add new package
- **WHEN** user runs `make add PKG=lodash`
- **THEN** lodash is added to dependencies via pnpm

#### Scenario: Run arbitrary command
- **WHEN** user runs `make bash-exec CMD="pnpm outdated"`
- **THEN** the command executes inside the container

#### Scenario: Open interactive shell
- **WHEN** user runs `make shell`
- **THEN** user gets an interactive shell inside the container

### Requirement: Project files are bind-mounted to container

The project directory SHALL be bind-mounted so changes on host are immediately visible in container and vice versa. This includes node_modules.

#### Scenario: Code changes reflect immediately
- **WHEN** user edits a source file on host
- **THEN** Vite dev server detects the change and triggers HMR

#### Scenario: node_modules visible on host
- **WHEN** dependencies are installed via `make install`
- **THEN** node_modules directory appears on host filesystem for IDE access

### Requirement: Ignore files protect secrets and reduce noise

The project SHALL include .gitignore, .cursorignore, and .dockerignore files that prevent secrets from being committed, indexed by AI, or included in Docker builds.

#### Scenario: .env files are git-ignored
- **WHEN** user creates or modifies .env file
- **THEN** git status does not show .env as a tracked or modified file

#### Scenario: AI agents cannot read secrets
- **WHEN** AI agent attempts to read .env file
- **THEN** .cursorignore prevents the file from being indexed or read

#### Scenario: node_modules excluded from Docker build context
- **WHEN** Docker image is built
- **THEN** node_modules is not copied into the build context (uses .dockerignore)

### Requirement: Environment template documents required configuration

The project SHALL include a .env.example file documenting required environment variables without actual secret values.

#### Scenario: New developer setup
- **WHEN** developer clones repository and runs `make init`
- **THEN** .env.example is copied to .env if .env does not exist

### Requirement: React application scaffold is initialized

The project SHALL include a complete React + TypeScript + Vite scaffold with Tailwind CSS, ESLint, Prettier, and testing infrastructure.

#### Scenario: Build produces static files
- **WHEN** user runs `make build`
- **THEN** dist/ directory contains index.html and bundled assets

#### Scenario: Tests can be executed
- **WHEN** user runs `make test`
- **THEN** vitest runs and reports test results

#### Scenario: Linting works
- **WHEN** user runs `make lint`
- **THEN** ESLint checks source files and reports any issues

