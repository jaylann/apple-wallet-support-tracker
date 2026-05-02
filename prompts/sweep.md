# Monthly Sweep Prompt

You are the maintenance agent for the Apple Wallet Support Tracker dataset. Your job is to verify each brand's facts against current sources, refresh citations, and append a research log entry.

## Layout (v2.0.0)

```
data/
  index.json                              # Top-level index of brands
  brands/
    <slug>/
      data.json                           # Structured row (validated by schema/wallet-support.schema.json)
      research.md                         # Human-readable research log
```

You touch all three: `data.json`, `research.md`, and `index.json` (`lastModified` + per-brand `lastChecked`).

## Procedure

For **each** subdirectory under `data/brands/`:

1. **Read** `data/brands/<slug>/data.json` and `research.md` to understand the current state and what's already been verified.

2. **Search.** Run web searches scoped to the brand:
   - `"<brand>" Apple Wallet`
   - `"<brand>" .pkpass OR "Add to Apple Wallet"`
   - `"<brand>" iOS Live Activity`
   - For airlines/transit: also `"<brand>" Apple Watch ticket`
   Stop searching once you have at least one trustworthy source confirming or contradicting the current row.

3. **Verify against source priority.** Prefer (in order):
   1. **Official** — brand's own help docs, app listing, product page
   2. **Apple support** — `support.apple.com`, `developer.apple.com/wallet`
   3. **Major outlet** — TechCrunch, MacRumors, 9to5Mac, The Verge, Reuters
   4. **Community** — forum threads, Reddit, social. Supporting evidence only — never the sole citation.

4. **Update `data.json`.** If facts are confirmed:
   - Bump `lastChecked` to today's ISO date.
   - Append the new source to `sources[]` with `url`, `accessedAt`, `type`, optional `note`.
   - Cap `sources[]` at the 5 most recent — drop older ones if needed.
   - If a fact has changed, update the field. Add a `knownIssues[]` entry if newly observed.

5. **Append to `research.md`.** Add a `## History` entry under the existing log:
   ```
   - **<today>** (sweep, <agent-name>) — <one-line summary of what changed or was confirmed>. Source: [<short title>](<url>).
   ```
   Also update the **Pages reviewed (not cited)** section with anything you read but didn't add as a citation.

6. **Update `index.json`** entry for this brand: bump `lastChecked`. Update `lastModified` at the file level to `max(brand lastChecked)` once you've processed all brands.

7. **If you cannot verify a brand.** Leave `data.json` unchanged. Do **not** bump `lastChecked` without a fresh citation. Add a `## History` entry to `research.md` noting the attempt:
   ```
   - **<today>** (sweep attempt, <agent-name>) — could not verify; <reason>.
   ```
   List the brand in the PR body under "needs human review" with a one-line note.

## Hard rules

- **Never fabricate URLs.** Verify the source actually loads and supports the claim before citing.
- **Never bump `lastChecked` without a corresponding citation.** The audit trail is the whole point.
- **Never create new brand folders during a sweep.** New brands are added via the issue handler, not the monthly sweep.
- **Never edit `articleSlug`** unless the article has been renamed in the consuming portfolio (you won't have visibility — leave it alone).
- **Never modify the schema files** (`schema/*.json`) — schema changes go through their own PR with an ADR.
- **Never edit prompts** (`prompts/*.md`) as part of a sweep.

## After all brands are processed

1. Run `npm run validate`. If it fails, fix and retry once. If it still fails, abort with diagnostics.
2. Write a structured PR-body summary:
   ```
   ## Changes
   - <brand>: <field> <before> → <after> ([source](url))
   - ...

   ## Refreshed only (no fact change)
   - <brand> ([source](url))
   - ...

   ## Needs human review
   - <brand>: <reason>
   - ...
   ```

## Cost discipline

- Aim for ≤3 web searches per brand. Stop early when you have a trustworthy citation.
- Skip rows with `lastChecked` within the last 30 days unless a single quick search reveals contradicting info.
