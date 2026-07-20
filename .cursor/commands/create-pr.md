---
name: /create-pr
id: create-pr
category: GitHub
description: Create a branch, push, and open a PR via `gh` CLI
---

Create a new branch, push your changes, and open a pull request using `gh` CLI.

**Do not run `make quality-gate` (or build/lint/test/e2e) as part of this command**—the repository’s GitHub workflow runs the quality gate on the PR. The user may still run it locally if they want; `/create-pr` must not block on it.

**Input**: Optional branch name (e.g., `feat/add-auth`) and PR title. If omitted, infer from current changes or ask.

**Steps**

1. **Get repo info**
   - Run `git remote get-url origin` to get `owner/repo` (e.g., `jocaruser/illo3d` from `https://github.com/jocaruser/illo3d.git`)
   - Run `git branch --show-current` for current branch

2. **Determine branch name**
   - If user provided: use it (ensure kebab-case, e.g., `feat/add-auth`)
   - Else infer from staged/unstaged changes or recent commits (e.g., `feat/description`)
   - If unclear: ask the user for branch name and PR title

3. **Pre-commit checks**
   - Ensure working tree is ready: commit any uncommitted changes with a sensible message (ask if message unclear)

4. **Create branch and push**
   - If current branch is `main` (or default): create local branch `git checkout -b <branch-name>`
   - If already on a feature branch: use it as-is
    - Run `git push -u origin <branch-name>` (requires network). GitHub auto-creates the remote branch on push.
    - If push fails (e.g., auth), report and stop

5. **Create PR via `gh` CLI**
    - Run `gh pr create --repo <owner>/<repo> --head <branch-name> --base main --title "..." --body "..."`
    - PR body: summarize key changes. Keep concise.
    - If draft PR preferred: add `--draft` (ask user if unsure)

6. **Output**
   - Print the PR URL and branch name
   - Note that CI runs the quality gate on the PR; wait for checks (or fix failures in follow-up commits) before merge

**Guardrails**
- Do not run `make quality-gate` as part of `/create-pr`; rely on GitHub CI for that
- Use `main` as base unless user specifies otherwise
- Branch names: `feat/`, `fix/`, `docs/` prefix recommended
