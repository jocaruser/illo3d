# Spec corpus comparison: integration baseline vs unshipped branch

## Front matter

- compared_at: 2026-09-20- baseline_ref: `origin/staging` @ `86d410b47e67e3bc5637315b86983b6d15daf9e8`- branch_ref: `origin/feat/spec-divergences-implementation` @ `12a7b50cc6d29213e2add61449daf7c70b9c2fea`- pr136_ref: `origin/docs/spec-code-divergences` @ `f3521740a6591a1109cdb445c6856b7cc09648b4`- card: kpAlk5K1Yu6M

## Summary

- Baseline spec markdown files: **27**- Branch spec markdown files: **61**- Shared paths: **27**- Branch-only paths: **34**- Baseline-only paths: **0**

## Baseline-only (informational)

## Shared paths — byte identity

| path                                                                   | identical | notes                         |
| ---------------------------------------------------------------------- | --------- | ----------------------------- |
| `specs/README.md`                                                      | False     | differs; see semantic section |
| `specs/decisions/ADR-0001-symfony-style-architecture.md`               | True      | identical;                    |
| `specs/decisions/ADR-0002-workbook-snapshot-unit-of-work.md`           | True      | identical;                    |
| `specs/decisions/ADR-0003-client-side-persistence.md`                  | True      | identical;                    |
| `specs/decisions/ADR-0004-additive-schema-and-migration-wizard.md`     | True      | identical;                    |
| `specs/decisions/ADR-0005-audit-logging-at-repository-layer.md`        | True      | identical;                    |
| `specs/decisions/ADR-0006-job-based-hybrid-kanban.md`                  | True      | identical;                    |
| `specs/decisions/ADR-0007-github-pages-platform.md`                    | True      | identical;                    |
| `specs/decisions/ADR-0008-page-focused-behaviour-specs.md`             | False     | differs; see semantic section |
| `specs/decisions/ADR-0009-semantic-line-breaks.md`                     | True      | identical;                    |
| `specs/decisions/ADR-0010-british-english.md`                          | True      | identical;                    |
| `specs/decisions/ADR-0011-semver-and-per-pr-bump.md`                   | True      | identical;                    |
| `specs/decisions/ADR-0012-in-memory-migration-with-explicit-submit.md` | True      | identical;                    |
| `specs/decisions/ADR-0013-last-save-wins.md`                           | True      | identical;                    |
| `specs/decisions/README.md`                                            | True      | identical;                    |
| `specs/features/README.md`                                             | False     | differs; see semantic section |
| `specs/migration/v1-to-v2.spec.md`                                     | False     | differs; see semantic section |
| `specs/migration/v2-to-v3.spec.md`                                     | False     | differs; see semantic section |
| `specs/migration/wizard.spec.md`                                       | False     | differs; see semantic section |
| `specs/navigation.spec.md`                                             | False     | differs; see semantic section |
| `specs/not-found.spec.md`                                              | False     | differs; see semantic section |
| `specs/saving.spec.md`                                                 | False     | differs; see semantic section |
| `specs/ui/README.md`                                                   | True      | identical;                    |
| `specs/ui/frontend-workflow.md`                                        | True      | identical;                    |
| `specs/welcome/google-drive.spec.md`                                   | False     | differs; see semantic section |
| `specs/welcome/local-folder.spec.md`                                   | False     | differs; see semantic section |
| `specs/welcome/welcome.spec.md`                                        | False     | differs; see semantic section |

## Branch-only paths — default classification

Branch-only page and shared specs are **missing_on_baseline** intent imports; first-edition `specs/DIVERGENCES.md` is **not** promoted (superseded for queue mapping by PR #136 on conflict).

| path                                                             | bucket                | relationship                  |
| ---------------------------------------------------------------- | --------------------- | ----------------------------- |
| `specs/DIVERGENCES.md`                                           | deliberate_enrichment | branch_only; audit input only |
| `specs/audit-log/audit-log.spec.md`                              | missing_on_baseline   | branch_only                   |
| `specs/clients/details/details.spec.md`                          | missing_on_baseline   | branch_only                   |
| `specs/clients/details/jobs-table.spec.md`                       | missing_on_baseline   | branch_only                   |
| `specs/clients/details/metrics.spec.md`                          | missing_on_baseline   | branch_only                   |
| `specs/clients/details/timeline.spec.md`                         | missing_on_baseline   | branch_only                   |
| `specs/clients/list.spec.md`                                     | missing_on_baseline   | branch_only                   |
| `specs/dashboard/calendar.spec.md`                               | missing_on_baseline   | branch_only                   |
| `specs/dashboard/dashboard.spec.md`                              | missing_on_baseline   | branch_only                   |
| `specs/dashboard/kanban.spec.md`                                 | missing_on_baseline   | branch_only                   |
| `specs/dashboard/recent-transactions.spec.md`                    | missing_on_baseline   | branch_only                   |
| `specs/dashboard/stats.spec.md`                                  | missing_on_baseline   | branch_only                   |
| `specs/dashboard/stock-alerts.spec.md`                           | missing_on_baseline   | branch_only                   |
| `specs/decisions/ADR-0014-archive-then-delete-lifecycle.md`      | deliberate_enrichment | branch_only                   |
| `specs/decisions/ADR-0015-derived-pricing-and-income-on-paid.md` | deliberate_enrichment | branch_only                   |
| `specs/entities/metadata.spec.md`                                | missing_on_baseline   | branch_only                   |
| `specs/inventory/details/consumption.spec.md`                    | missing_on_baseline   | branch_only                   |
| `specs/inventory/details/item.spec.md`                           | missing_on_baseline   | branch_only                   |
| `specs/inventory/details/lots.spec.md`                           | missing_on_baseline   | branch_only                   |
| `specs/inventory/list.spec.md`                                   | missing_on_baseline   | branch_only                   |
| `specs/jobs/details/details.spec.md`                             | missing_on_baseline   | branch_only                   |
| `specs/jobs/details/materials-summary.spec.md`                   | missing_on_baseline   | branch_only                   |
| `specs/jobs/details/pieces-table.spec.md`                        | missing_on_baseline   | branch_only                   |
| `specs/jobs/details/widgets.spec.md`                             | missing_on_baseline   | branch_only                   |
| `specs/jobs/list.spec.md`                                        | missing_on_baseline   | branch_only                   |
| `specs/profile.spec.md`                                          | missing_on_baseline   | branch_only                   |
| `specs/search.spec.md`                                           | missing_on_baseline   | branch_only                   |
| `specs/shared/lifecycle.spec.md`                                 | missing_on_baseline   | branch_only                   |
| `specs/shared/lists.spec.md`                                     | missing_on_baseline   | branch_only                   |
| `specs/shared/notes.spec.md`                                     | missing_on_baseline   | branch_only                   |
| `specs/shared/tags.spec.md`                                      | missing_on_baseline   | branch_only                   |
| `specs/transactions/expense-details.spec.md`                     | missing_on_baseline   | branch_only                   |
| `specs/transactions/list.spec.md`                                | missing_on_baseline   | branch_only                   |
| `specs/transactions/purchase.spec.md`                            | missing_on_baseline   | branch_only                   |

## Shared paths with diffs — semantic notes

### `specs/README.md`

- **relationship**: enriched (branch adds acceptance detail without retiring baseline layout)
- **bucket**: extra_detail
- **evidence**: `specs/README.md | 99 +++++++++++++++++++++++++++------------------------------  1 file changed, 46 insertions(+), 53 deletions(-)`

### `specs/decisions/ADR-0008-page-focused-behaviour-specs.md`

- **relationship**: enriched (branch adds acceptance detail without retiring baseline layout)
- **bucket**: extra_detail
- **evidence**: `specs/decisions/ADR-0008-page-focused-behaviour-specs.md | 16 ++++++++++------  1 file changed, 10 insertions(+), 6 deletions(-)`

### `specs/features/README.md`

- **relationship**: enriched (branch adds acceptance detail without retiring baseline layout)
- **bucket**: extra_detail
- **evidence**: `specs/features/README.md | 41 ++++++++++++++++++++++++++---------------  1 file changed, 26 insertions(+), 15 deletions(-)`

### `specs/migration/v1-to-v2.spec.md`

- **relationship**: enriched (branch adds acceptance detail without retiring baseline layout)
- **bucket**: extra_detail
- **evidence**: `specs/migration/v1-to-v2.spec.md | 10 ++++++++++  1 file changed, 10 insertions(+)`

### `specs/migration/v2-to-v3.spec.md`

- **relationship**: enriched (branch adds acceptance detail without retiring baseline layout)
- **bucket**: extra_detail
- **evidence**: `specs/migration/v2-to-v3.spec.md | 10 ++++++++++  1 file changed, 10 insertions(+)`

### `specs/migration/wizard.spec.md`

- **relationship**: enriched (branch adds acceptance detail without retiring baseline layout)
- **bucket**: extra_detail
- **evidence**: `specs/migration/wizard.spec.md | 12 ++++++++++--  1 file changed, 10 insertions(+), 2 deletions(-)`

### `specs/navigation.spec.md`

- **relationship**: enriched (branch adds acceptance detail without retiring baseline layout)
- **bucket**: extra_detail
- **evidence**: `specs/navigation.spec.md | 8 ++++----  1 file changed, 4 insertions(+), 4 deletions(-)`

### `specs/not-found.spec.md`

- **relationship**: enriched (branch adds acceptance detail without retiring baseline layout)
- **bucket**: extra_detail
- **evidence**: `specs/not-found.spec.md | 28 ++++++++++++++++------------  1 file changed, 16 insertions(+), 12 deletions(-)`

### `specs/saving.spec.md`

- **relationship**: enriched (branch adds acceptance detail without retiring baseline layout)
- **bucket**: extra_detail
- **evidence**: `specs/saving.spec.md | 12 ++++++++----  1 file changed, 8 insertions(+), 4 deletions(-)`

### `specs/welcome/google-drive.spec.md`

- **relationship**: enriched (branch adds acceptance detail without retiring baseline layout)
- **bucket**: extra_detail
- **evidence**: `specs/welcome/google-drive.spec.md | 15 ++++++++++-----  1 file changed, 10 insertions(+), 5 deletions(-)`

### `specs/welcome/local-folder.spec.md`

- **relationship**: enriched (branch adds acceptance detail without retiring baseline layout)
- **bucket**: extra_detail
- **evidence**: `specs/welcome/local-folder.spec.md | 12 ++++++++++--  1 file changed, 10 insertions(+), 2 deletions(-)`

### `specs/welcome/welcome.spec.md`

- **relationship**: enriched (branch adds acceptance detail without retiring baseline layout)
- **bucket**: extra_detail
- **evidence**: `specs/welcome/welcome.spec.md | 15 ++++++++++-----  1 file changed, 10 insertions(+), 5 deletions(-)`

## Four-bucket rollup (branch corpus)

| bucket                | count | examples                                                                            |
| --------------------- | ----- | ----------------------------------------------------------------------------------- |
| missing_on_baseline   | 31    | dashboard, clients, jobs, inventory, transactions, search                           |
| extra_detail          | 27    | shared paths with non-empty diff                                                    |
| behaviour_change      | 3     | queue Large/Medium items naming lifecycle, in-memory migration, atomic expense save |
| deliberate_enrichment | 2     | ADR-0014, ADR-0015 on branch                                                        |
