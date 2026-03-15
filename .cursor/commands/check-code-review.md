---
name: /check-code-review
id: check-code-review
category: GitHub
description: Review PR feedback, implement approved changes, commit, and reply to resolved comments
---

Check review comments on a PR, explain and advise on each, implement the approved ones, then commit and reply to each resolved comment using the same format as before.

**Input**: Optional PR number. If omitted, you are probably referring to the only open PR, the latest open PR, or the PR for the current branch—resolve in that order.

**Steps**

1. **Resolve target PR**
   - Get `owner`/`repo` from `git remote get-url origin`
   - If user specified PR number: use it
   - Else, try in order: (a) `list_pull_requests` with `head: owner:current-branch`, `state: open`; (b) if exactly one open PR exists, use it; (c) if multiple, use the latest (most recently updated) open PR
   - If no PR: ask user to specify

2. **Fetch review comments**
   - `pull_request_read` with `method: get_review_comments` to get all review threads
   - Filter to unresolved threads (`is_resolved: false`)

3. **Explain and advise**
   - For each comment: explain what it means, why it matters, and advise (e.g., "Worth doing", "Optional", "Skip—incorrect")
   - Present them in a numbered list
   - Ask the user which ones to implement (e.g., "Implement 1, 3, 5" or "All" or "None")

4. **Implement approved changes**
   - For each approved comment: make the code changes
   - Follow Clean Code (Uncle Bob) and project quality gate
   - Run `make quality-gate` before committing

5. **Commit**
   - Single commit with message like: `Address PR feedback: <brief summary>`
   - Run `git push` to update the PR

6. **Reply to each resolved comment**
   - Use `add_reply_to_pull_request_comment` for each comment that was addressed
   - Format: `Resolved in <short-sha>: <brief description of what was done>.`
   - Example: `Resolved in a67768a: added unit test for quoted-comma behavior and public/fixtures/README.md documenting the fixture convention.`
   - Use the **comment ID** from the review thread (the numeric id from the discussion URL, e.g. `r2937428476` → `2937428476`)
   - Reply only to comments you actually addressed in this commit

7. **Output**
   - Summarize changes made
   - List which comments got replies
   - Note: User must manually "Resolve conversation" in GitHub UI (MCP cannot do that)

**Guardrails**
- Only reply to comments you implemented; do not claim resolution for skipped ones
- Commit message should be descriptive but concise
- Run `make quality-gate` before pushing
