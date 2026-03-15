---
name: /create-pr
id: create-pr
category: GitHub
description: Create a branch, push it, and open a PR using GitHub MCP
---

Create a new branch, push your changes, and open a pull request using GitHub MCP.

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
   - Run `openspec list --json`. If active (non-archived) changes exist, warn and ask for confirmation before proceeding.
   - Ensure working tree is ready: commit any uncommitted changes with a sensible message (ask if message unclear)

4. **Create branch and push**
   - If current branch is `main` (or default): create local branch `git checkout -b <branch-name>`
   - If already on a feature branch: use it as-is
   - Use GitHub MCP `create_branch` with `owner`, `repo`, `branch`, `from_branch: main` to create the remote branch
   - Run `git push -u origin <branch-name>` (requires network)
   - If push fails (e.g., auth), report and stop

5. **Create PR via GitHub MCP**
   - Use `create_pull_request` tool: `owner`, `repo`, `title`, `head` = branch name, `base` = `main`
   - PR body: summarize key changes (from last commit(s) or diff). Keep concise.
   - If draft PR preferred: pass `draft: true` (ask user if unsure)

6. **Output**
   - Print the PR URL and branch name
   - Remind to run `make quality-gate` before merge

**Guardrails**
- Do not push if `make quality-gate` has not passed on the branch
- Use `main` as base unless user specifies otherwise
- Branch names: `feat/`, `fix/`, `docs/` prefix recommended
