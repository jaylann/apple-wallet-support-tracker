# Claude Code Instructions

This repo is the source of truth for the Apple Wallet Support Tracker dataset consumed by [neatpass.app](https://neatpass.app/wallet-support-tracker).

## Branch and release model

- **`stage`** is the default branch. All PRs target `stage`.
- **`main`** is release-only and updated exclusively by `.github/workflows/release.yml`.
- Never push directly to `main`. Never open a PR against `main`.

## Layout (v2.0.0+)

```
data/
  index.json                      # Top-level directory of all brands
  brands/
    <slug>/
      data.json                   # Per-brand structured row
      research.md                 # Human-readable research log + provenance
```

`data.json` carries the facts; `research.md` carries why we believe them. Both must move together.

## Data quality bar

Every change to a brand must:

1. Bump `lastChecked` on the touched `brands/<slug>/data.json` to today's ISO date.
2. Add at least one `sources[]` entry per touched row with `url`, `accessedAt`, `type`.
3. Append a `## History` entry to `brands/<slug>/research.md` describing what changed and why.
4. Update the matching entry in `data/index.json` (mirror the new `lastChecked`) and bump top-level `lastModified` to `max(brand lastChecked)`.
5. Pass `npm run validate` (which checks index ↔ folder consistency).

If a fact cannot be verified, leave the data alone. Do **not** invent sources, do **not** bump `lastChecked` without a citation. Mark the row in PR notes for human review and add a `research.md` history entry noting the failed attempt.

## Adding a new brand

Triggered by an issue with the `type:new-brand` label. The issue handler workflow:

1. Picks a slug (lowercase, ASCII, hyphen-separated).
2. Creates `data/brands/<slug>/data.json` matching `schema/wallet-support.schema.json`.
3. Creates `data/brands/<slug>/research.md` with the initial research log.
4. Inserts a new entry in `data/index.json` (sorted by slug) and bumps `brandCount`.
5. Opens a PR.

Manual addition follows the same shape — see `prompts/issue-fix.md` for the exact procedure the agent uses.

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

- Per-brand row shape: `schema/wallet-support.schema.json`.
- Index shape: `schema/index.schema.json`.
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

### Switching between Claude and Codex

Both `sweep.yml` and `issue-handler.yml` accept an `agent` input (`claude` | `codex`) on `workflow_dispatch`. Cron always runs Claude.

Required secrets — workflows fail loudly if the chosen agent's secret is missing:

| Agent | Secret | How to generate |
|---|---|---|
| `claude` | `CLAUDE_CODE_OAUTH_TOKEN` | `claude setup-token` locally, paste output as repo secret |
| `codex` | `CODEX_AUTH_JSON` | `codex login` locally, paste contents of `~/.codex/auth.json` as repo secret |

Both routes bill against your personal subscription, not API credits. No API-key fallback is configured by design.

## Local commands

```bash
npm run validate           # full validation (warns on empty sources & unreachable URLs)
npm run validate:strict    # also fails on empty sources & unreachable URLs — use before release
npm run reindex            # regenerate data/index.json from data/brands/*/data.json
```

URL reachability is a warning by default because many brand sites (Akamai/Cloudflare/Imperva-fronted) refuse automated probes regardless of method or User-Agent — a probe failure is not always a real broken link. Run `validate:strict` before tagging a release to surface them as hard errors.

After editing any `data/brands/<slug>/data.json`, always run `npm run reindex` instead of editing `data/index.json` by hand. Validate then runs as a check.

## Commit style

- Imperative mood, lower case start where the linter doesn't override.
- Reference issues via `Closes #X` in the PR body, not in commit messages.
- Squash-merge only.
