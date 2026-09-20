# Search

One search box in the [header](navigation.spec.md),
promising exactly what it says: **"Search everything…"** —
clients, jobs, pieces, notes, transactions, materials and tags,
all at once, as you type.

Search reads what is currently loaded
(including unsaved edits — see [saving](saving.spec.md));
archived and deleted things do not appear.

## Typing

Nothing happens until the query is two characters long.
From there, every keystroke refreshes a list of up to ten suggestions.

Matching is forgiving:
small typos still match ("Acme Coorp" finds Acme Corp),
and searching an id (like "J4") puts that exact thing first.
Dates match as fragments —
"2026-06" finds everything dated that month.
When nothing matches: "No matches".

## Reading a suggestion

Each suggestion has two lines:
what kind of thing it is (Client, Job, Piece, Client note, …),
then its name with its context —
a piece shows its job,
a note shows its opening words and what it is written on.

## Scenarios — choosing

- Pressing a suggestion, or Enter on a highlighted one,
  → goes to that thing:
  clients, jobs and materials open their own pages;
  a piece opens its job, scrolled to the piece;
  a note opens whatever it is written on;
  a transaction opens the ledger;
  a tag opens the clients list,
  or the jobs list when only jobs carry it.
- Enter with nothing highlighted → the first suggestion.
- Arrow keys move the highlight, stopping at the ends.
- Escape → closes the list; the typed text stays.

Searching never changes which section of
[the header](navigation.spec.md) is lit — only going somewhere does.
