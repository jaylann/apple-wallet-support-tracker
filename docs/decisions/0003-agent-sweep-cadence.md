# 0003. Agent sweep cadence and cost

Date: 2026-05-02
Status: accepted

## Context

The dataset has 53 rows at v1.0.0. Without active maintenance, facts decay quickly — airlines drop / add Wallet support, iOS Live Activity bugs surface and get fixed, brand apps ship updates that change pkpass behaviour. We need an automated path to keep the rows fresh, and a separate path for ad-hoc community corrections.

## Decision

Two channels, different cadences:

| Channel | Cadence | Cost shape |
|---|---|---|
| Monthly sweep | `0 4 1 * *` cron (4 AM UTC, 1st of month) | Predictable, ~53 rows × 1–3 web searches |
| Issue-driven fix | On `type:correction` or `type:new-brand` label | Per-issue, scoped to one row |

Both run via `anthropics/claude-code-action@v1` against the configured `ANTHROPIC_API_KEY`. Monthly sweep is capped at `--max-turns 60`, issue handler at `--max-turns 30`.

## Why monthly

- More frequent (weekly) buys little — most rows don't change month-to-month, and the cost / noise ratio gets worse.
- Less frequent (quarterly) lets bugs and feature launches sit too long unrecorded.
- Monthly aligns with how iOS / app releases tend to ship (every few weeks).

## Cost discipline

Estimated monthly cost: $1–5 USD at current Anthropic pricing.

- 53 rows × ~2 web searches ≈ 100 searches per sweep
- Each search is ~1 short context turn
- A full sweep is well under the $5 budget for one run

If costs run hotter than expected (e.g. agent loops), the `--max-turns` cap aborts. The workflow opens a `priority:high` issue so silent runaway is impossible.

## Failure handling

- Sweep step failure → workflow opens an issue tagged `type:bug, area:ci, priority:high`
- Validation failure after sweep → same path
- Issue handler failure → label the source issue `needs-human` and comment with workflow run URL

No bad data should reach `stage` without human review, but visibility on workflow failures is a separate signal we don't want to lose.

## What the agent CAN'T do

- Edit `prompts/*.md` (CODEOWNERS gate)
- Edit `schema/*.json` (CODEOWNERS gate)
- Push directly to any branch (PR-only via `peter-evans/create-pull-request`)
- Create a release (release.yml is `workflow_dispatch` manual only)

The agent's blast radius is bounded to "open a PR against `stage`."

## Re-evaluation triggers

Revisit this ADR if:
- Average monthly cost exceeds $20
- Three consecutive sweeps fail validation
- Row count exceeds 200 (sweep budget no longer fits in one run — would need batching)

## Consequences

- The sweep is best-effort, not authoritative — humans always review.
- Cost stays bounded by `--max-turns` and the predictable monthly cadence.
- Community corrections are first-class: they don't wait for the next sweep.
