# ADR-0016: British English throughout

- Status: Accepted
- Date: 2026-07-17

## Context

The project's writing mixes dialects by accident of authorship:
identifiers such as `ColoredNumber` beside a schema column named `colour`,
and documentation written by different agents in different dialects.
Aircury's standard working language is British English,
and the ai-framework offers it as an enforced language capability.

## Decision

British English is the project's dialect for everything it authors:
application copy (the English catalogue), documentation, specs,
code identifiers, commit messages and ADRs.

Exceptions, exactly as the framework's language rules state:
external APIs, tools and established interfaces
keep their own spelling —
CSS `color`, the DOM's `input type="color"`,
and any third-party identifier remain as the platform spells them.

The framework configuration records this
(`.aircury/framework.config.json` → `language.britishEnglish: true`),
and `FRAMEWORK.md` carries the corresponding coding-standard
and agent-operating rules,
including Day-before-Month ordering for date entry controls.

## Consequences

- The English catalogue was audited at the time of this decision
  and is already clean; it stays that way.
- `ColoredNumber` is renamed `ColouredNumber` (done with this ADR);
  future identifiers are born British.
- Agents working in this repository write British English by default,
  in code and prose alike.
