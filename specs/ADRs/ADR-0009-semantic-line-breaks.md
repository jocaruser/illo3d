# ADR-0009: All documentation uses semantic line breaks

- Status: Accepted
- Date: 2026-07-17

## Context

Documentation in this repository is read and edited as much by agents as by people,
and it lives under version control.
Hard-wrapped paragraphs produce noisy diffs when a single word changes;
unwrapped paragraphs produce unreviewable single-line diffs
and encourage the long walls of text
that ADR-0008 identifies as the main cause of spec skim-reading.

Semantic line breaks ([sembr.org](https://sembr.org/))
break lines at clause and sentence boundaries,
which renders identically in Markdown
while keeping diffs aligned with meaning.

## Decision

All prose documentation in this repository uses semantic line breaks:
behaviour specs, ADRs, READMEs, and any other Markdown prose.

- Break after each sentence,
  and within sentences at clause boundaries where it aids the reader.
- Never break purely to satisfy a line length;
  there is no column limit for prose.
- Tables, code blocks and front matter are untouched by this rule.

Existing documents adopt the convention when they are next edited;
no big-bang reflow is required.
The installed `semantic-line-breaks` skill enforces the convention
in agent-written documentation.

## Consequences

- Diffs to documentation align with changes in meaning,
  one clause per line.
- Prose paragraphs stay visually short in editors,
  reinforcing the readability rule of ADR-0008.
- Rendered output is unchanged;
  readers of the published Markdown see ordinary paragraphs.
