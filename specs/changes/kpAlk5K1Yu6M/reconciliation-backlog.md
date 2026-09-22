# Reconciliation backlog (kpAlk5K1Yu6M)

Operator clarifications: **1b** (PR #136 tie-break on conflict), **2b** (file delivery cards during implementation).

## Branch queue — Large

| id        | source                 | action    | target_path                              | follow_on_card | evidence                                                                                                                            |
| --------- | ---------------------- | --------- | ---------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| QUEUE-L01 | DIVERGENCES §1 Large 1 | file_card | `migration/wizard.spec.md`, ADR-0012     | DagbzVUJbVxG   | Staging code still auto-commits migration; no in-memory workbook repository on integration tip.                                     |
| QUEUE-L02 | DIVERGENCES §1 Large 2 | file_card | `shared/lifecycle.spec.md`, detail pages | O73tSFWriSol   | Archived job/client pages remain editable; inventory archive shows not-found; soft-delete rules diverge from specced state machine. |
| QUEUE-L03 | DIVERGENCES §1 Large 3 | file_card | `jobs/details/pieces-table.spec.md`      | qei7MjzP0HUI   | Soft-deleted pieces hidden; archived pieces lack struck styling per branch audit.                                                   |

## Branch queue — Medium

| id        | source                   | action    | target_path                                             | follow_on_card | evidence                                                                                    |
| --------- | ------------------------ | --------- | ------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| QUEUE-M04 | DIVERGENCES §1 Medium 4  | file_card | `migration/wizard.spec.md`                              | PqNfjMiJXAnp   | Wizard copy always narrates v2 hop regardless of actual hop chain.                          |
| QUEUE-M05 | DIVERGENCES §1 Medium 5  | file_card | `migration/wizard.spec.md`, `welcome/`                  | G2XC3Ak6LTaM   | Newer-major and unparseable version strings route into wizard dead-end on integration tip.  |
| QUEUE-M06 | DIVERGENCES §1 Medium 6  | file_card | `welcome/local-folder.spec.md`                          | A7qDl4lkdYvo   | Corrupt metadata can be overwritten via create-new-shop path.                               |
| QUEUE-M07 | DIVERGENCES §1 Medium 7  | file_card | `welcome/local-folder.spec.md`                          | VUGscdtTczvy   | No re-permission prompt on lapsed folder handle.                                            |
| QUEUE-M08 | DIVERGENCES §1 Medium 8  | file_card | `profile.spec.md`                                       | MoNsc6fRRn3a   | Sign-out does not confirm when dirty; folder handle persists after sign-out.                |
| QUEUE-M09 | DIVERGENCES §1 Medium 9  | update    | `navigation.spec.md`                                    | —              | Breadcrumb shows raw id; branch spec names name-with-id fallback (imported on card branch). |
| QUEUE-M10 | DIVERGENCES §1 Medium 10 | file_card | `dashboard/calendar.spec.md`                            | Wm1ahVtQTQzT   | Missing Today control; today not marked when no due items.                                  |
| QUEUE-M11 | DIVERGENCES §1 Medium 11 | file_card | `clients/details/notes.spec.md`, `shared/notes.spec.md` | uMtatbfJyvIg   | Notes oldest-first; dead @mentions link to not-found.                                       |
| QUEUE-M12 | DIVERGENCES §1 Medium 12 | file_card | `clients/details/jobs-table.spec.md`                    | Z4ppvlsme2gz   | Total column and incomplete badge absent in UI.                                             |
| QUEUE-M13 | DIVERGENCES §1 Medium 13 | file_card | `jobs/details/materials-summary.spec.md`                | 5hpsneSGiY1n   | Material cell link and overall-risk labelling wrong for zero-margin jobs.                   |
| QUEUE-M14 | DIVERGENCES §1 Medium 14 | file_card | `transactions/expense-details.spec.md`                  | VzL3ks5vsLwm   | Amount persists before lot validation fails (PR #136 item 10 agrees).                       |

## ADR disposition

| id       | source                                                  | action      | target_path                                                      | follow_on_card | evidence                                                                                                                                                                          |
| -------- | ------------------------------------------------------- | ----------- | ---------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-0014 | branch `ADR-0014-archive-then-delete-lifecycle.md`      | promote_adr | `specs/decisions/ADR-0014-archive-then-delete-lifecycle.md`      | —              | Lifecycle behaviour not implemented on tip; decision documents intended archive→soft-delete model aligned with imported `shared/lifecycle.spec.md`. Does not contradict ADR-0012. |
| ADR-0015 | branch `ADR-0015-derived-pricing-and-income-on-paid.md` | promote_adr | `specs/decisions/ADR-0015-derived-pricing-and-income-on-paid.md` | —              | Pricing derivations scattered in code; ADR captures paid-state income rule branch specs assume.                                                                                   |

## PR #136 structural queue (integration specs; absent from branch first-edition)

| id        | source          | action    | target_path                                   | follow_on_card | evidence                                                                             |
| --------- | --------------- | --------- | --------------------------------------------- | -------------- | ------------------------------------------------------------------------------------ |
| PR136-S01 | PR #136 queue 1 | file_card | `shared/linking.spec.md` (to draft)           | X2asO4fZ08h9   | No central entity path resolver; piece search anchor and audit links wrong per #136. |
| PR136-S02 | PR #136 queue 2 | file_card | `shared/lists.spec.md`                        | vwv967HxPUJj   | List search harness duplicated across five list controllers.                         |
| PR136-S03 | PR #136 queue 3 | file_card | `shared/dropdown.spec.md` (to draft)          | 31YsKGUCQUcu   | Combobox vs native select divergence across forms.                                   |
| PR136-S04 | PR #136 queue 4 | file_card | `shared/widgets.spec.md` (to draft)           | TGcIELGfxaB8   | Parallel widget systems on jobs vs clients vs entity detail.                         |
| PR136-S05 | PR #136 queue 5 | file_card | `shared/pricing.spec.md` (to draft)           | ILzUNOokqaQu   | Material cost / benefit derived in four places.                                      |
| PR136-S06 | PR #136 queue 6 | file_card | `shared/lifecycle.spec.md`                    | uggshRonvjda   | Overlaps QUEUE-L02; #136 authoritative on archived inventory not-found bug.          |
| PR136-S07 | PR #136 queue 7 | file_card | `shared/table.spec.md` (to draft)             | G3B5MkwHnC76   | Column viewport tiers not centralised.                                               |
| PR136-S08 | PR #136 queue 8 | file_card | `shared/notes.spec.md`, `shared/tags.spec.md` | Y7YUkFApNhFG   | Entity type hard-coded to client\|job ternary.                                       |
| PR136-S09 | PR #136 queue 9 | file_card | `shared/dialogs.spec.md` (to draft)           | tFCC8LkERys7   | Migration and setup wizards use bespoke overlays.                                    |

## Spec corpus imports (this card branch)

| id                      | source                        | action | target_path                                                                                                                                       | follow_on_card | evidence                                                                                                         |
| ----------------------- | ----------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------- |
| ADD-PAGES               | branch-only tree              | add    | `specs/dashboard/`, `clients/`, `jobs/`, `inventory/`, `transactions/`, `audit-log/`, `search.spec.md`, `profile.spec.md`, `entities/`, `shared/` | —              | Page-focused paths validated against ADR-0008; prose imported from branch tip for reviewer confirmation.         |
| REJECT-DIVERGENCES-ROOT | branch `specs/DIVERGENCES.md` | reject | —                                                                                                                                                 | —              | First-edition audit; queue mapping uses #136 on conflict; canonical backlog is this file plus comparison report. |
