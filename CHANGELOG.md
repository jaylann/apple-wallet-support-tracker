# Changelog

All notable changes to this dataset are documented here. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) for the schema and the dataset as a whole.

## [Unreleased]

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
