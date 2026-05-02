# Claude Code Instructions

This repo is the source of truth for the Apple Wallet Support Tracker dataset consumed by [neatpass.app](https://neatpass.app/wallet-support-tracker).

## Branch and release model

- **`stage`** is the default branch. All PRs target `stage`.
- **`main`** is release-only and updated exclusively by `.github/workflows/release.yml`.
- Never push directly to `main`. Never open a PR against `main`.

## Data quality bar

Every change to `data/wallet-support.json` must:

1. Bump `lastChecked` on touched rows to today's ISO date.
2. Add at least one `sources[]` entry per touched row with `url`, `accessedAt`, `type`.
3. Bump top-level `lastModified` to `max(rows[].lastChecked)`.
4. Pass `npm run validate`.

If a fact cannot be verified, leave the row alone. Do **not** invent sources, do **not** bump `lastChecked` without a citation. Mark the row in PR notes for human review.

## Source priority

When citing a source for a row's facts, prefer (in order):

1. **Official** — the brand's own help docs, app listing, or product page.
2. **Apple support docs** — `support.apple.com`, `developer.apple.com/wallet`.
3. **Major outlet** — TechCrunch, MacRumors, 9to5Mac, The Verge, Reuters.
4. **Community** — forum threads, Reddit, social posts. Only as supporting evidence, never as the sole citation.

## Required labels on PRs

CI blocks merges that don't carry exactly one `type:*` label and at least one `area:*` label. The labeler workflow auto-applies `area:*` from changed paths. Add `type:*` yourself.

Available labels: see [CONTRIBUTING.md](CONTRIBUTING.md).

## Schema rules

- The shape is defined in `schema/wallet-support.schema.json` (JSON Schema draft-07).
- Adding a field is a minor version bump. Removing or restricting a field is a major version bump and requires an ADR in `docs/decisions/`.
- `nativePkpass` definitions:
  - `full` — the brand consistently ships a native pkpass.
  - `partial` — a Wallet path exists but is inconsistent, hidden, or limited to specific products.
  - `none` — no native Wallet path; users must convert manually.
- See `docs/methodology.md` for the canonical definitions.

## Working with the agent workflows

- `prompts/sweep.md` is the prompt for the monthly sweep. Edit with care — drift in this file changes data quality across all 53 rows.
- `prompts/issue-fix.md` is the narrow per-issue prompt. Should always close the loop with a comment on the issue.
- Prompt edits are `area:prompts` and require CODEOWNERS review.

## Local commands

```bash
npm run validate           # full validation (warns on empty sources)
npm run validate:strict    # also fails on empty sources — use before release
```

## Commit style

- Imperative mood, lower case start where the linter doesn't override.
- Reference issues via `Closes #X` in the PR body, not in commit messages.
- Squash-merge only.
