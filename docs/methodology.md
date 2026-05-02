# Methodology

How rows in `data/wallet-support.json` are evaluated, sourced, and maintained.

## Field definitions

### `nativePkpass`

What the dataset means by each value:

| Value | Meaning |
|---|---|
| `full` | The brand consistently ships a native `.pkpass` via app or website. The "Add to Apple Wallet" button is reachable on the primary purchase / boarding / loyalty flow. |
| `partial` | A Wallet path exists but is inconsistent, hidden behind extra steps, limited to specific products or regions, or known to fail intermittently. Most rows fall here. |
| `none` | No native Wallet path exists. Users must convert manually (e.g. screenshot/PDF → third-party converter). The brand may still have an in-app digital pass that is **not** a pkpass. |

The bar for `full` is high. If you've seen the button miss on transferred tickets, rebookings, or non-primary products, the row should be `partial`.

### `iosLiveActivity`

`true` only when the brand's iOS app exposes a Live Activity (lock screen / Dynamic Island) for an actively-tracked event — e.g. a boarding pass live update or a real-time delivery state. Rumours and "announced for next iOS" do **not** count until shipped.

### `watchSync`

`true` when passes from this brand reliably show up on Apple Watch when paired. Rough heuristic: if the brand ships native pkpass, this is usually `true`. If the digital pass is in-app only, this is `false`.

### `region`

Where the brand primarily operates. `global` is reserved for brands with truly worldwide presence (Starbucks, Eventbrite, Klarna). Region-specific subsidiaries (e.g. Lidl Plus in Germany vs. UK) keep the parent brand in `europe` unless the difference is material.

### `category`

Primary category of the brand. A brand with multiple products picks the dominant category — e.g. "Hotel keys (Hilton, Marriott, Hyatt)" is `hotel`, not `loyalty`, even though chains have loyalty programs.

## Source priority

When a row's facts are verified, the cited source must come from one of these tiers, in preference order:

1. **`official`** — the brand's own help docs, app listing, support article, or product page. Highest authority.
2. **`support`** — Apple support pages (`support.apple.com`, `developer.apple.com/wallet`).
3. **`press`** — major outlets: TechCrunch, MacRumors, 9to5Mac, The Verge, Reuters, Bloomberg, Wired. Reliable but second-hand.
4. **`community`** — forum threads, Reddit, social media. Useful as **supporting evidence** for a claim from a higher tier. **Never used as the sole citation.**

A row's `sources[]` array should contain at least one tier-1 or tier-2 source whenever possible. If only tier-3 / tier-4 sources are available, the row's facts should be conservative (`partial` over `full`, `false` over `true`).

## Maintenance cadence

| Channel | Trigger | Workflow |
|---|---|---|
| Monthly sweep | `0 4 1 * *` cron | `.github/workflows/sweep.yml` |
| Issue-driven correction | `type:correction` or `type:new-brand` label | `.github/workflows/issue-handler.yml` |
| Manual edit | PR against `stage` | gated by `test.yml` + `pr-conventions.yml` |

The agent prompts (`prompts/sweep.md`, `prompts/issue-fix.md`) embed these source rules. Drift in those files is a quality risk — they're CODEOWNED.

## Data freshness expectations

- Rows touched in the last sweep show `lastChecked` within ~30 days of `lastModified`.
- Rows that consistently fail to verify are flagged in sweep PRs under "needs human review" and may be dropped or downgraded.
- The dataset is **never** a real-time source. Treat `lastChecked` as the maximum age you should trust without re-checking yourself.

## Schema versioning

The current schema is `v1.0.0` (see `schema/wallet-support.schema.json`).

- **Patch** (`v1.0.x`) — clarification of constraints, no structural change.
- **Minor** (`v1.x.0`) — additive: new optional fields, new enum values, new `sources[]` types.
- **Major** (`v2.0.0`) — breaking: removed fields, restricted enums, required-field changes, renames.

Major bumps require an ADR in `docs/decisions/`.

## License and attribution

Dataset is [CC BY 4.0](../LICENSE). Attribution string for downstream consumers:

> Apple Wallet Support Tracker — © Justin Lanfermann, CC BY 4.0
> https://github.com/jaylann/apple-wallet-support-tracker

See [`NOTICE`](../NOTICE) for the full text and trademark disclaimer.
