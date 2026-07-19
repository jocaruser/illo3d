# Breadcrumbs

A section of [the navbar](navbar.spec.md):
under the header, a trail places the user —
**Home → section → item**.
The item is named by what it is —
a job's description, a client's name, a material's name —
falling back to its id when it has no name.
Pages earlier in the trail are links; the last entry is where you are.

This rule is written once, here.
Every page spec that shows breadcrumbs links here
rather than restating it.
The [dashboard](../dashboard/dashboard.spec.md) — the root —
shows none; every trail starts below it.
