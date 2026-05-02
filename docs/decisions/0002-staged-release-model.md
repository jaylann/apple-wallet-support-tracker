# 0002. Staged release model

Date: 2026-05-02
Status: accepted

## Context

The repository is consumed by the `neatpass.app` portfolio at build time. Bad data shipped to the consumed branch goes live on a public, indexed, SEO-relevant page. We have two automated change paths (monthly sweep, issue-driven fixes) that run an LLM agent — both are useful, both are capable of producing plausible-looking nonsense.

We need a model where:
- Agent and community changes can land continuously
- Human review happens before anything reaches the consumed branch
- The consumed branch is never a moving target without an explicit, auditable promotion step

## Decision

Two long-lived branches:

- **`stage`** — default branch. All PRs target it. CI runs on every push and PR. Monthly sweeps and issue-driven fixes open PRs against it.
- **`main`** — release-only. Updated **exclusively** by `.github/workflows/release.yml`, which:
  1. Validates input version is semver and not already tagged
  2. Validates `CHANGELOG.md` contains a section for the new version
  3. Validates the latest `test.yml` run on `stage` is green and matches `stage` HEAD
  4. Fast-forwards `main` to `stage` (`git push origin stage:main` — server rejects non-fast-forward)
  5. Tags `vX.Y.Z` and creates a GitHub Release

Downstream consumers (the portfolio's `sync-wallet-support.ts` script) fetch from `main` or a pinned tag — never `stage`.

## Branch protection rulesets

Apply via Settings → Rules → Rulesets.

**Ruleset for `stage`:**
- Restrict deletions
- Block force pushes
- Require PR before merging
  - Required approvals: 1
  - Require review from CODEOWNERS for protected paths
  - Dismiss stale approvals on new commits
  - Require approval of most recent reviewable push
- Required status checks: `test`, `required-labels`
- Bypass: repo owner only

**Ruleset for `main`:**
- Restrict deletions
- Block force pushes
- Restrict updates: only fast-forward updates allowed
- Bypass: `github-actions[bot]` running `release.yml` only

Document the exact JSON form of the rulesets here once configured (TODO after first push to GitHub).

## Why not GitFlow / trunk-based / single-branch

- **Single branch with auto-deploy** — too dangerous given LLM authorship. No quarantine.
- **GitFlow** — too heavy for a dataset with no in-flight feature branches. Stage already gives us the soak window.
- **Trunk-based with feature flags** — feature flags don't apply to a JSON file consumed by a build script. The "flag" is "did the data merge to main yet."

The chosen model is the lightest viable separation between "agent landed something" and "the world sees it."

## Release ritual

1. Verify `stage` CI is green.
2. Bump `CHANGELOG.md`: move `[Unreleased]` items into a new versioned section, commit to `stage`.
3. Wait for `test.yml` to be green on the new `stage` HEAD.
4. Trigger `release.yml` via Actions UI with the version (e.g. `1.0.1`).
5. Workflow handles tag creation, fast-forward, GitHub Release.

## Consequences

- Every change flows through PR review on `stage`. The agent has no path to publish unreviewed.
- The portfolio can pin to a specific tag for reproducible builds.
- Releases are explicit human acts. Sweeps don't auto-release.
- `CHANGELOG.md` is human-edited, not auto-generated — release notes are curated.

## Inspiration

Adapted from `jaylann/Cast`'s release model (`docs/decisions/0004-staged-release-model.md` in that repo).
