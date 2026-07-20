# A purchase's page

A page at `#/transactions/{id}`,
with [everything a details page has](../shared/details.spec.md)
— only purchases have one:
income rows explain themselves through their job,
and any other id here is [not found](../not-found.spec.md).

The header states the facts:
id, date, type, category,
the description (linked as
[the ledger links it](list.spec.md)),
and the client if there is one.

## Amending

Two things can be corrected here,
saved together by one "Save changes" —
a declared departure from
[the shell's no-save rule](../shared/details.spec.md),
kept because the match rule below needs a gate:

- **the expense total** — always negative, it is spending;
- **each purchase lot** — the material (linked),
  its quantity and its cost.

One rule binds them: **the lots must account for the total**.

Scenarios:

- The lot amounts and the total disagree
  → the page says exactly how —
  "Lot line amounts sum to €‹lots› but this expense total is €‹total›.
  Adjust the fields so they match before saving." —
  and Save stays blocked until they agree, to the cent.
- The purchase has no lots
  → only the total applies; nothing blocks.

Amending here fixes the record —
it does not re-run the purchase:
stock levels stay as they are.
This page is the only place a lot can be corrected;
[the material's lots table](../inventory/details/lots.spec.md)
only reads what is amended here.
