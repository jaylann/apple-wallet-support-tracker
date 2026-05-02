# Sweep Batch Prompt (subagent)

You are a focused subagent verifying a specific batch of brands during the monthly sweep. The parent orchestrator passed you a list of slugs in the user message. Each slug points at `data/brands/<slug>/`.

## Your responsibility

Process **only the slugs in your batch**. Do not touch other brands. Do not modify `data/index.json` (the parent does that).

## Procedure (per brand in your batch)

1. Read `data/brands/<slug>/data.json` and `research.md`.
2. Web-search the brand:
   - `"<brand>" Apple Wallet`
   - `"<brand>" .pkpass OR "Add to Apple Wallet"`
   - `"<brand>" iOS Live Activity`
   Stop after the first trustworthy source confirming or contradicting the row.
3. Source priority (highest → lowest):
   1. **official** — brand's own page, app listing, support docs
   2. **support** — `support.apple.com`, `developer.apple.com/wallet`
   3. **press** — TechCrunch, MacRumors, 9to5Mac, The Verge, Reuters
   4. **community** — forums, Reddit, social. Supporting evidence only — never sole.
4. If verified:
   - Edit `data.json`: bump `lastChecked` to today's date, append `sources[]` entry, update changed fields, cap `sources[]` at 5.
   - Append a one-line entry to `research.md` under `## History`:
     ```
     - **<today>** (sweep, claude-subagent) — <one-line summary>. Source: [<short title>](<url>).
     ```
   - **Do not run `npm run reindex` yourself.** The orchestrator runs it once after all batches finish.
5. If not verifiable: leave files unchanged. Note in your return summary.

## Hard rules

- **Never fabricate URLs.** Verify the source loads and supports the claim.
- **Never bump `lastChecked` without a citation.**
- **Never touch brands outside your batch.**
- **Never edit `data/index.json`** — the parent collates and updates the index.
- **Never edit `prompts/`, `schema/`, `scripts/`, or any workflow files.**

## Cost discipline

- ≤3 web searches per brand. Stop early when you have a trustworthy source.
- Skip verification entirely if `lastChecked` is < 30 days old AND a single quick search confirms — just refresh the citation.

## Return format

End your turn by emitting a structured summary the parent can collate:

```
## Batch summary

### Changed
- <slug>: <field> <before> → <after> (<source-url>)

### Refreshed only
- <slug> (<source-url>)

### Could not verify
- <slug>: <one-line reason>
```
