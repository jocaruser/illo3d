---
name: github-create-pr
description: Sync and archive the thread's OpenSpec change, then create a branch, push, and open a PR via GitHub MCP. Use when the user wants to create a pull request.
license: MIT
compatibility: Requires GitHub MCP, git, and OpenSpec CLI.
metadata:
  author: agent-commands
  version: "1.0"
---

Create a new branch, push your changes, and open a pull request using GitHub MCP. **First**, close out the OpenSpec change this thread implemented: sync delta specs into main specs, then archive the change.

**Do not run `make quality-gate`**—the repository's GitHub workflow runs the quality gate on the PR.

## Input

Optional branch name (e.g., `feat/add-auth`) and PR title. If omitted, infer from current changes or ask.

## Steps

### 1. Get repo info

- Run `git remote get-url origin` to get `owner/repo`
- Run `git branch --show-current` for current branch

### 2. OpenSpec: sync and archive (default for implementation PRs)

- **Identify the change**: Infer the active change name from this thread. If unclear, run `openspec list --json` and **ask the user** which change to sync and archive. **Do not guess** when multiple changes could apply.
- **Sync specs**: Use **openspec-sync-specs** skill for that change: merge deltas from `openspec/changes/<name>/specs/` into `openspec/specs/<capability>/spec.md`. If no delta specs, skip sync.
- **Archive**: Use **openspec-archive-change** skill for the **same** change. If user cancels or archive cannot complete, **stop** unless they explicitly want a PR without archiving.

### 3. Determine branch name

- If user provided: use it (ensure kebab-case, e.g., `feat/add-auth`)
- Else infer from staged/unstaged changes or recent commits
- If unclear: ask the user for branch name and PR title

### 4. Pre-commit checks

- Run `openspec list --json`. If unexpected active changes remain, warn and ask whether to proceed.
- **Do not commit `openspec/changes/archive/`**. That path is in `.gitignore`; archived changes stay local-only.
- Ensure working tree is ready: commit any uncommitted changes

### 5. Create branch and push

- If current branch is `main`: create local branch `git checkout -b <branch-name>`
- If already on a feature branch: use it as-is
- Use GitHub MCP `create_branch` with `owner`, `repo`, `branch`, `from_branch: main`
- Run `git push -u origin <branch-name>`
- If push fails, report and stop

### 6. Create PR via GitHub MCP

- Use `create_pull_request` tool: `owner`, `repo`, `title`, `head` = branch name, `base` = `main`
- PR body: summarize key changes (OpenSpec sync to main specs, code, etc.). Keep concise.
- If draft PR preferred: pass `draft: true` (ask user if unsure)

### 7. Output

- Print the PR URL and branch name
- Note that CI runs the quality gate on the PR

## Guardrails

- Do not run `make quality-gate` as part of this command; rely on GitHub CI
- Use `main` as base unless user specifies otherwise
- Branch names: `feat/`, `fix/`, `docs/` prefix recommended
- Never stage `openspec/changes/archive/` for commit
- Never auto-pick an OpenSpec change when ambiguous; ask
