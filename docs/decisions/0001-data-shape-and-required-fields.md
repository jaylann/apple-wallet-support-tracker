# 0001. Data shape and required fields

Date: 2026-05-02
Status: accepted

## Context

We're standing up a public dataset tracking native Apple Wallet support across brands. The dataset replaces a hand-authored TypeScript array embedded in a portfolio repo. The shape needs to be:

- Self-describing (consumers can validate without reading prose)
- Auditable (every fact tied to a source)
- Stable enough to commit to (downstream pinning by tag or `main`)
- Loose enough to be filled in by an LLM-driven sweep

## Decision

The row shape is fixed at v1.0.0 with these required fields: `brand`, `category`, `region`, `nativePkpass`, `iosLiveActivity`, `watchSync`, `lastChecked`, `sources`.

Optional fields: `knownIssues`, `articleSlug`, `notes`.

`sources[]` is required to be present (so the schema check enforces structural conformance) but is allowed to be empty at v1.0.0 bootstrap. The first monthly sweep populates citations across all rows. Strict validation (`npm run validate:strict`) fails on empty `sources[]` and is run before tagging a release post-bootstrap.

## Why these specific fields

- **`nativePkpass`** is the single most useful column for an end user — discriminated enum (`full|partial|none`) avoids the trap of a boolean that hides the messy middle.
- **`iosLiveActivity`** and **`watchSync`** are independent enough that combining them into a single "polish score" would lose information. They stay boolean.
- **`region`** uses regional buckets, not country codes. The dataset is too coarse for ISO 3166 — most rows are valid across multiple countries (DACH, UK+IE).
- **`sources`** has its own type (`official|press|support|community`) so the audit trail captures *quality of evidence*, not just URL count. A row with one official source is more trustworthy than a row with five Reddit links.
- **`articleSlug`** is portfolio-coupled but harmless to other consumers — it's a string identifier that consuming apps can use or ignore.
- **`lastChecked`** is per-row, not per-fact. Finer granularity (per-field timestamps) was rejected as low value for high schema cost.

## Why `sources[]` is required

A dataset of unsourced claims is worse than no dataset. Once an LLM agent is involved, the only thing standing between us and confident hallucinations is the requirement that every fact be tied to a working URL with a typed authority tier. Removing this requirement was rejected.

## Why empty `sources[]` is allowed at v1.0.0

The hand-authored data we're migrating from doesn't have URLs. Demanding citations on day 1 would either:
1. Block the migration indefinitely, or
2. Tempt the agent (or a human) to fabricate plausible-looking URLs to pass validation.

Both are bad. Instead: let v1.0.0 ship with empty arrays, run a sweep, then promote the strict-validation gate.

## Consequences

- The schema is the source of truth — anyone consuming the JSON validates against `schema/wallet-support.schema.json`.
- Schema changes require version bumps (see `docs/methodology.md`) and major bumps require an ADR.
- The `sources[]` audit trail makes the dataset usable as a citation source itself for SEO / E-E-A-T purposes on consuming sites.
