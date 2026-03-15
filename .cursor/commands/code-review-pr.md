---
name: /code-review-pr
id: code-review-pr
category: GitHub
description: Code review a PR with inline comments only (no positives), using GitHub MCP
---

Perform a code review on a pull request. Focus **only on issues and improvements**—do not mention positive aspects. Add inline review comments using GitHub MCP.

**Input**: Optional PR number or branch name. If omitted, you are probably referring to the only open PR, the latest open PR, or the PR for the current branch—resolve in that order.

**Steps**

1. **Resolve target PR**
   - Get `owner`/`repo` from `git remote get-url origin`
   - If user specified PR number: use it
   - Else, try in order: (a) `list_pull_requests` with `head: owner:current-branch`, `state: open`; (b) if exactly one open PR exists, use it; (c) if multiple, use the latest (most recently updated) open PR
   - If no PR found: ask user to specify PR number or create one first

2. **Fetch PR diff and files**
   - `pull_request_read` with `method: get_diff` to get the full diff
   - `pull_request_read` with `method: get` for PR title, commit SHA
   - `pull_request_read` with `method: get_files` for changed file list

3. **Code review**
   - Read the changed files and diff carefully
   - Identify issues only: bugs, security risks, unclear names, violations of Clean Code (Uncle Bob), missing tests, performance problems, maintainability issues
   - **Do NOT** add comments about good practices, nice structure, or positives
   - For each issue: note `path`, `line` (line number in the new version), `body` (concise, actionable comment)
   - Comment on `side: RIGHT` (the new code)

4. **Create review with inline comments**
   - Call `pull_request_review_write` with `method: create` (no `event`) to create a **pending** review
   - For each issue: call `add_comment_to_pending_review` with `path`, `line`, `body`, `subjectType: LINE`, `side: RIGHT`
   - Call `pull_request_review_write` with `method: submit_pending`, `event: REQUEST_CHANGES`, and `body` summarizing the number of comments (e.g., "5 inline comments")

5. **Output**
   - List the number of comments added and the PR URL
   - Do not summarize positives

**Guardrails**
- Only comment on issues. No "looks good" or "nice refactor" comments
- Keep each comment short and actionable
- Use `commitID` from PR head SHA when creating the review if the tool requires it
