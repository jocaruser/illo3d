# Spec ↔ code divergence audit

- Date: 2026-07-18
- Method: four parallel auditors walked every claim of every spec file
  against the implementing code, the translation catalogues,
  and the unit/e2e suites, with file-and-line evidence.
- Outcome: ~110 findings. Each was given one disposition:
  **implement** (the spec is the intent, the code lags),
  **spec amended** (the code's behaviour is the better truth
  and the spec was corrected in this branch),
  or a **ruling** (genuinely ambiguous — decided here, flagged for review).

Two files audited fully clean:
`migration/v2-to-v3.spec.md` and `clients/details/timeline.spec.md`.

## 1. Implementation queue

The single ordered backlog. Replaces the shorter list previously kept in
[README.md](README.md), which now points here.

### Large

1. **In-memory migration with Confirm and close**
   ([ADR-0012](decisions/ADR-0012-in-memory-migration-with-explicit-submit.md),
   `migration/wizard.spec.md`).
   Today: persisted working copy, auto-commit after the last step,
   failed runs leave artefacts.
   The audit added a safety-relevant corollary:
   **the backup is only written at commit time**,
   so a failed run leaves no backup even when the user answered Yes —
   while the Backup card claims done.
   The rebuild must write the backup at its step, as specced.
2. **The detail-page lifecycle state machine**
   (`jobs/details/details.spec.md`, `clients/details/details.spec.md`,
   `inventory/details/item.spec.md`).
   Specced: active → Edit + Archive; archived → read-only,
   Un-archive + Soft delete; soft-deleted → not found.
   Code: archived job and client pages are fully editable,
   no Un-archive exists on any detail page,
   the job page offers Soft delete while active,
   clients cannot be soft-deleted at all,
   and an **archived material's page renders not-found** —
   with `restoreInventory` uncalled by any UI,
   the archive dialog's "You can un-archive it later" cannot be kept.
3. **Pieces table: children are history**
   (`jobs/details/details.spec.md`) — known; still holds.
   Soft-deleted pieces are hidden and archived ones unstyled.

### Medium

4. **Hop-aware migration explanation** — known; still holds.
5. **Newer-shop-than-app experience** — known; still holds,
   plus the audit's adjacent find: an **unparseable version string**
   also routes to the wizard and dead-ends on Continue.
   One fix: route both to a distinct "this shop needs a newer app /
   cannot be read" outcome instead of the wizard.
6. **Damaged-metadata overwrite guard** — known; still holds.
7. **Local folder re-permission on reopen** — known; still holds
   (no permission query/request anywhere).
8. **Sign-out confirms when dirty** — known; still holds.
   Extended: sign-out must also clear the persisted folder handle
   (today it survives in browser storage after "nothing remembered").
9. **Breadcrumbs resolve names**
   (`navigation.spec.md`): the crumb always shows the raw id today;
   the spec's name-with-id-fallback rule needs implementing.
10. **Calendar: the missing Today control**
    (`dashboard/calendar.spec.md`) plus the day list not marking today
    when nothing is due.
11. **Notes render newest first, dead mentions go quiet**
    (`clients/details/notes.spec.md`):
    notes currently render oldest-first;
    unresolvable `@CL`/`@J` mentions render as live links into
    not-found (only piece mentions degrade to plain text as specced).
12. **Client jobs table gains its Total column**
    (`clients/details/jobs-table.spec.md`) with the incomplete badge.
13. **Materials summary fixes**
    (`jobs/details/materials-summary.spec.md`):
    the material cell links to its page;
    "Overall risk" names the worst filament and stops rendering
    every band through the "Safe (…)" label
    (a zero-margin job currently reads "Safe (0 redos)" in red).
14. **Expense page saves atomically**
    (`transactions/expense-details.spec.md`):
    today the total persists before a bad lot draft fails the save,
    leaving a half-applied correction. Validate everything, then write.

### Small

15. Search piece hits append the existing `#piece-‹id›` fragment.
16. Search pins exact ids case-insensitively ("j4" pins J4).
17. The Revenue-this-month card links to transactions, as Balance does.
18. Recent transactions break same-day ties numerically
    (today "T9" outranks "T10" lexicographically).
19. Purchase lots list newest first (currently append order).
20. Consumption rows deep-link to the piece, not just the job.
21. Add-piece dialog gains its optional per-unit price field.
22. Suggested price: suppress the "Use €0.00" suggestion
    for a piece with no material lines.
23. Jobs-list search indexes the derived total the user sees,
    not the hidden legacy price field.
24. Audit-log search indexes displayed entity names and timestamps.
25. Audit-log entity links guard against dead ends for archived and
    soft-deleted targets, as the piece and transaction kinds already do.
26. Archived or soft-deleted expenses render not-found
    instead of an editable page (latent until archiving transactions exists).
27. Inventory page shows the combined
    "No purchase lots or consumption recorded…" line
    (key exists, unused) when both sections are empty.
28. The saving overlay names sheets through the existing
    `workbook.savingSheet` keys instead of raw internal ids.
29. Attaching an already-attached tag stops showing a success toast.
30. Client detail hides empty email/phone rows
    (spec: fields shown only when filled).
31. The address field becomes a textarea (spec: multiline).
32. Welcome-screen open failures show a translated message
    (today the raw exception text) and "Try again" genuinely retries.
33. The profile menu honours `metadata.iconsrc`
    (declared, documented, read by nothing).
34. Catalogue copy: `inventoryDetail.qtyInvalid` still says
    "whole number" for a two-decimal field.
35. Dead catalogue keys removed:
    `dashboard.kanban.moveToColumn`, `wizard.errorShopStructure`,
    `wizard.errorVersion` (superseded), unused only if 28 lands: none.

## 2. Spec amendments applied in this branch

Where the code's behaviour was the better truth —
or simply the truth with no intent against it —
the spec was corrected rather than the code. Applied here:

- Stats: the pieces figure counts **done pieces created** in the last
  seven days (the model has no finished-at moment); the card's blanket
  lifecycle sentence carves out the benefit estimate's archived pieces;
  zero balance is neutral.
- Kanban: the description opens the job (the card body is a drag handle);
  the keyboard control is named by its real label;
  the benefit bracket can accompany the incomplete marker;
  the progress line needs at least one piece;
  the badge carries "Due ‹date›" and neutral colours when not late;
  columns show a card count; the no-due-date fallback applies
  to retiring too.
- Calendar: adjacent-month cells stay empty; days follow universal time
  (flagged as ruling 6).
- Stock alerts: the third tier is named yellow; the header links
  to the inventory.
- Welcome: the doors stay enabled during Google sign-in
  (deliberate — the retry hint depends on it);
  the error surface is described.
- Google Drive: the connect screen shows the email too;
  the expired-session banner is quoted.
- Saving: Refresh shows its progress card (not "quietly");
  the expired-session path re-signs-in then saves again
  (no Retry button on that toast).
- Search: Escape closes the list but keeps the text;
  note snippets show the note's opening;
  transaction and tag destinations stated.
- Profile: app and shop versions differ permanently after
  minor/patch releases (only majors close the gap);
  the menu says "Español" where the welcome toggle says "ES";
  Drive shops also show their folder name.
- Not found: the card adapts its message and way out to what
  was missed (job, client, material, transaction);
  the two legacy addresses that redirect instead are recorded
  in navigation.
- Jobs: page section order matches the page;
  Soft delete's current placement noted as part of queue item 2;
  a job with no pieces counts as incomplete and cannot be paid;
  unset-units pieces aggregate as one unit;
  material cost is quantity-derived and therefore exempt from
  the incomplete rule; the paid→cancelled precedence stated;
  the run margin lives in the expanded piece;
  suggested-price is present-but-disabled when costs are missing;
  the shortfall line names the material;
  "Est. benefit" and the filament picker's "g" unit quoted correctly;
  done↔failed switches commit silently.
- Clients: metrics count lifecycle-active jobs only ("in any state"
  scoped to status); the materials estimate's one-unit fallback noted;
  new tags are Title-Cased into the pool;
  the embedded jobs table's opener is its ID column.
- Inventory: thresholds are whole numbers; "Qty (current)" quoted
  as the UI writes it; lot transaction links fall back to the id.
- Transactions: the lot-sum rule passes within one cent
  (float honesty); unreadable figures suspend the warning;
  the no-lots section has its own empty line; the concept unlinks
  when a purchase's materials were archived;
  zero costs are refused at purchase time and allowed as corrections;
  the empty-ledger copy fix is already in.
- Audit log: tags and notes resolve names without pages;
  "Timestamp" and "Parent Entity" as the UI writes them;
  the three degradation modes (flagged row, Unknown pill,
  raw-id fallback) distinguished.

## 3. Rulings (decided here, flagged for review)

1. **Purchase concept stores the category identifier** ("filament"),
   untranslated, when the note is empty.
   Ruled: keep — stored data should be language-neutral;
   spec notes the identifier appears verbatim.
2. **Kanban keyboard move control** keeps its per-job label
   ("Status for job ‹id›"); the unused "Move to column" key is removed
   (queue 35).
3. **Suggested price stays visible-but-disabled** when costs are
   unknown (better than the specced disappearance); spec amended.
4. **Lot-sum tolerance of one cent** ruled correct
   (floating-point honesty beats false precision); spec amended.
5. **Materials summary column order** follows the code
   (Redos before Remaining); spec amended.
6. **Calendar computes days in universal time** — recorded in the spec
   for now; a local-time calendar is future work if it ever bites.
7. **Job page section order** follows the code
   (materials summary after the widgets); spec amended.

## 4. Known deviations re-verified

All previously listed spec-led deviations were independently
re-confirmed by the auditors and fold into queue items 1–8 above.

## 5. What this queue does not include

Anything already tracked as review questions in [README.md](README.md)
(ownership calls, catalogue wording choices),
and the details pages for entities that have none —
a separate piece of work with its own specs first.
