# Shared table viewport behaviour

## Requirements

### Requirement: Canonical table contract on the integration branch

The integration branch MUST include `specs/shared/table.spec.md` as the default
contract for list and embedded data tables,
with viewport vocabulary **Always**, **Small+**, **Medium+**, and **Wide+**.

#### Scenario: A page spec references the shared table file

- **WHEN** a maintainer documents a table on the integration branch
- **THEN** they can link to `specs/shared/table.spec.md` for sort, empty-row,
  and viewport rules instead of restating them.

### Requirement: Central viewport tier mapping

The product MUST expose one authoritative mapping from viewport tiers to
responsive visibility classes,
and every in-scope list or detail table MUST declare per-column tiers through
that mapping rather than table-level `nth-child` hide strings.

#### Scenario: A detail table hides a column below medium width

- **WHEN** a column is declared **Medium+**
- **THEN** its header and body cells carry the shared medium-tier classes
  (`hidden md:table-cell`)
- **AND** the column remains visible from the medium breakpoint upward.

#### Scenario: Primary identifier columns stay always visible

- **WHEN** a table renders its primary id or navigation column
- **THEN** that column uses the **Always** tier
- **AND** no hide class is applied to its header or cells.

### Requirement: Behaviour-preserving refactor guard

Automated tests MUST fail when a file under `src/Component/detail/*Table.tsx`
reintroduces positional responsive hide strings
(`[&_tr>*:nth-child(`).

#### Scenario: A developer copies legacy hide strings into a detail table

- **WHEN** such a string is added to an in-scope detail table source file
- **THEN** the table responsive convention unit test fails.
