# Recording a purchase

One dialog records money spent —
and, when the purchase bought materials,
feeds the [inventory](../inventory/list.spec.md) in the same stroke.

Always asked:
the date (today, editable),
a category — filament, consumable, equipment,
electric, maintenance or other —
and an optional note,
which becomes the transaction's description
(the category stands in when the note is empty,
as its stored identifier — "filament", say —
verbatim in every language).

A cost of zero is refused anywhere in this dialog —
"Amount must be greater than zero";
a genuinely free batch is recorded afterwards
as [a lot correction](../inventory/details/lots.spec.md).

## Without "Add to inventory"

Overheads — electricity, maintenance:
just the amount, recorded as spending. Done.

## With "Add to inventory"

The purchase becomes lines, one per material bought:

- each line picks an existing material —
  or "New item", naming and typing a material
  created by this very purchase
  (that is [the only way materials are born](../inventory/list.spec.md));
- each line takes a quantity —
  hinted "(g)" for filament, "(units)" otherwise —
  and what that line cost;
- the total — "Total (line items)" — sums itself
  and stops being editable;
- another line is one press away;
  at least one line is required,
  and only material categories
  (filament, consumable, equipment) apply.

Recording writes it all at once:
the spending,
one [purchase lot](../inventory/details/lots.spec.md) per line,
new materials born,
existing ones' stock increased.
Then the purchase's [own page](expense-details.spec.md) opens.

Closing the dialog any other way records nothing.
