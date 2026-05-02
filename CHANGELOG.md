# Changelog

All notable changes to this dataset are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for the schema and the dataset as a whole.

## [Unreleased]

## [2.0.0] — 2026-05-02

### Changed (BREAKING)

- Restructured `data/` from a single `wallet-support.json` to a per-brand folder layout:
  - `data/index.json` — top-level directory of brands (slug, brand, category, region, lastChecked).
  - `data/brands/<slug>/data.json` — full structured row for one brand.
  - `data/brands/<slug>/research.md` — research log, sources cited as proof, pages reviewed but not cited, chronological history.
- Added required `slug` and `$schemaVersion` fields to each brand row.
- Split schema into two files: `schema/wallet-support.schema.json` (per-brand row) + `schema/index.schema.json` (index).
- `validate.ts` rewritten to walk the new layout and verify index ↔ folders consistency.
- `prompts/sweep.md` and `prompts/issue-fix.md` updated for the new layout. Issue handler explicitly handles `type:new-brand` by creating the folder + research log.

### Why

Per-brand folders give each row its own git history, scoped diffs, and a first-class research log so anyone (human or agent) can audit why a fact was claimed and what was reviewed before it landed. The index keeps fast-path consumers (filter/list) fast.

## [1.0.0] — 2026-05-02

### Added

- Initial dataset with 53 brands across airlines, transit, loyalty, events, sports, hotel, cinema, and credentials.
- JSON Schema (`schema/wallet-support.schema.json`) defining the row shape.
- Validation tooling (`scripts/validate.ts`) — schema check, brand dedupe, slug format, source URL reachability.
- GitHub Actions workflows: `test`, `pr-conventions`, `labeler`, `sweep`, `issue-handler`, `release`.
- Issue templates for corrections, new brands, bugs, and features.
- Contributor docs: README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, SUPPORT.
- Methodology doc and three ADRs explaining data shape, staged release model, and sweep cadence.

### Notes

- All rows ship with empty `sources[]` arrays. The first monthly sweep is expected to populate citations across all rows.

[Unreleased]: https://github.com/jaylann/apple-wallet-support-tracker/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/jaylann/apple-wallet-support-tracker/releases/tag/v1.0.0
