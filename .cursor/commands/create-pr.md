---
name: /create-pr
id: create-pr
category: GitHub
description: Sync and archive the thread’s OpenSpec change, then create a branch, push, and open a PR via GitHub MCP
---

Create a new branch, push your changes, and open a pull request using GitHub MCP. **First**, close out the OpenSpec change this thread implemented: sync delta specs into main specs, then archive the change (unless the user says this PR is unrelated to OpenSpec—then skip the OpenSpec block after confirming).

**Do not run `make quality-gate` (or build/lint/test/e2e) as part of this command**—the repository’s GitHub workflow runs the quality gate on the PR. The user may still run it locally if they want; `/create-pr` must not block on it.

**Input**: Optional branch name (e.g., `feat/add-auth`) and PR title. If omitted, infer from current changes or ask.

**Steps**

1. **Get repo info**
   - Run `git remote get-url origin` to get `owner/repo` (e.g., `jocaruser/illo3d` from `https://github.com/jocaruser/illo3d.git`)
   - Run `git branch --show-current` for current branch

2. **OpenSpec: sync and archive (default for implementation PRs)**
   - **Identify the change**: Infer the active change name from this thread (work under `openspec/changes/<name>/`, conversation, or explicit user mention). If it is **not clear** which change this PR closes, run `openspec list --json`, list active (non-archived) changes, and **ask the user** which change to sync and archive. **Do not guess** when multiple changes could apply.
   - **Sync specs**: Follow the **openspec-sync-specs** skill for that change: merge deltas from `openspec/changes/<name>/specs/` into `openspec/specs/<capability>/spec.md`. If there are no delta specs under the change, skip sync and state that.
   - **Archive**: Follow the **openspec-archive-change** skill for the **same** change (status/tasks checks, user confirmations as needed, then `mv` to `openspec/changes/archive/YYYY-MM-DD-<name>`). If the user cancels or archive cannot complete, **stop** unless they explicitly want a PR without archiving.
   - **Note**: When archive is run **standalone**, the archive skill may say to run `/create-pr` afterward; when using `/create-pr`, perform sync+archive here and do not recurse.

3. **Determine branch name**
   - If user provided: use it (ensure kebab-case, e.g., `feat/add-auth`)
   - Else infer from staged/unstaged changes or recent commits (e.g., `feat/description`)
   - If unclear: ask the user for branch name and PR title

4. **Pre-commit checks**
   - Run `openspec list --json`. If **unexpected** active changes remain (e.g. parallel work), warn and ask whether to proceed with the PR.
   - **Do not commit `openspec/changes/archive/`**. That path is in `.gitignore`; archived OpenSpec changes stay local-only. Never `git add -f` archive folders unless the user explicitly overrides repo policy.
   - Ensure working tree is ready: commit any uncommitted changes with a sensible message (ask if message unclear)

5. **Create branch and push**
   - If current branch is `main` (or default): create local branch `git checkout -b <branch-name>`
   - If already on a feature branch: use it as-is
   - Use GitHub MCP `create_branch` with `owner`, `repo`, `branch`, `from_branch: main` to create the remote branch
   - Run `git push -u origin <branch-name>` (requires network)
   - If push fails (e.g., auth), report and stop

6. **Create PR via GitHub MCP**
   - Use `create_pull_request` tool: `owner`, `repo`, `title`, `head` = branch name, `base` = `main`
   - PR body: summarize key changes (OpenSpec sync to main specs, code, etc.). Keep concise.
   - If draft PR preferred: pass `draft: true` (ask user if unsure)

7. **Output**
   - Print the PR URL and branch name
   - Note that CI runs the quality gate on the PR; wait for checks (or fix failures in follow-up commits) before merge

**Guardrails**
- Do not run `make quality-gate` as part of `/create-pr`; rely on GitHub CI for that
- Use `main` as base unless user specifies otherwise
- Branch names: `feat/`, `fix/`, `docs/` prefix recommended
- Never stage `openspec/changes/archive/` for commit (see pre-commit checks)
- Never auto-pick an OpenSpec change when ambiguous; ask
