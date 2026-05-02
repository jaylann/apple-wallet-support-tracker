# Apple Wallet Support Tracker

[![Validation](https://github.com/jaylann/apple-wallet-support-tracker/actions/workflows/test.yml/badge.svg?branch=stage)](https://github.com/jaylann/apple-wallet-support-tracker/actions/workflows/test.yml)
[![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](LICENSE)
[![Schema: v1.0.0](https://img.shields.io/badge/Schema-v1.0.0-blue.svg)](schema/wallet-support.schema.json)

An open dataset tracking native Apple Wallet (`.pkpass`) support across airlines, transit operators, loyalty programs, event ticketing, sports, hotels, cinemas, and credentials. Each row records:

- Whether the brand ships a native pkpass (`full` / `partial` / `none`)
- Whether its iOS app exposes a Live Activity
- Whether passes sync to Apple Watch
- Known issues observed in the wild
- A list of cited sources backing the row's facts

The dataset powers the [Apple Wallet Support Tracker page](https://neatpass.app/wallet-support-tracker) on neatpass.app. It is maintained by a monthly automated agent sweep plus community-filed corrections.

## Consuming the data

### Direct JSON

```bash
curl https://raw.githubusercontent.com/jaylann/apple-wallet-support-tracker/main/data/wallet-support.json
```

Pin to a release tag for reproducibility:

```bash
curl https://raw.githubusercontent.com/jaylann/apple-wallet-support-tracker/v1.0.0/data/wallet-support.json
```

### Schema

The shape is defined in [`schema/wallet-support.schema.json`](schema/wallet-support.schema.json) (JSON Schema draft-07). Validate locally:

```bash
npm install
npm run validate
```

### TypeScript

```ts
interface WalletSupportRow {
  brand: string;
  category: "airline" | "transit" | "loyalty" | "event" | "sports" | "hotel" | "cinema" | "credentials";
  region: "global" | "north-america" | "europe" | "dach" | "uk-ireland" | "asia-pacific" | "gulf";
  nativePkpass: "full" | "partial" | "none";
  iosLiveActivity: boolean;
  watchSync: boolean;
  knownIssues?: string[];
  lastChecked: string; // ISO date
  articleSlug?: string;
  notes?: string;
  sources: { url: string; accessedAt: string; type: "official" | "press" | "support" | "community"; note?: string }[];
}
```

## Branches and releases

This repo uses a staged release model:

- **`stage`** — default branch. PRs target this. CI runs on every push and PR.
- **`main`** — release-only. Updated exclusively by the [Release workflow](.github/workflows/release.yml) (fast-forward from `stage`, tag, GitHub Release).

Downstream consumers should pin to `main` or a specific tag (e.g. `v1.0.0`) — never to `stage`.

## Maintenance model

| Channel | Trigger | Workflow |
|---|---|---|
| Monthly sweep | `0 4 1 * *` cron + manual dispatch | [`sweep.yml`](.github/workflows/sweep.yml) |
| Issue-driven correction | `type:correction` or `type:new-brand` label on an issue | [`issue-handler.yml`](.github/workflows/issue-handler.yml) |
| Manual edit | PR against `stage` | [`test.yml`](.github/workflows/test.yml) gates merge |

Every change — agent or human — flows through a PR with required validation, label gates, and CODEOWNERS review.

### Agent backends

Both agent workflows accept an `agent` input on `workflow_dispatch` (`claude` or `codex`). Cron always uses `claude`. Both bill against personal subscription tokens (`CLAUDE_CODE_OAUTH_TOKEN` or `CODEX_AUTH_JSON`); no API-key fallback. See [`CLAUDE.md`](CLAUDE.md) for token setup.

See [`docs/methodology.md`](docs/methodology.md) for source priority rules and `full`/`partial`/`none` definitions.

## Reporting incorrect data

File a [correction issue](https://github.com/jaylann/apple-wallet-support-tracker/issues/new?template=correction.yml) with the brand name, the field that's wrong, and a source URL. The issue handler picks it up automatically.

For brands not yet in the dataset, use the [new brand template](https://github.com/jaylann/apple-wallet-support-tracker/issues/new?template=new_brand.yml).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Quick version: PRs target `stage`, must carry `type:*` and `area:*` labels, must pass `npm run validate`.

## License

Dataset: [CC BY 4.0](LICENSE). Code (workflows, validation scripts, prompts): MIT (see individual file headers where applicable; otherwise also CC BY 4.0).

## Disclaimer

This is a community-maintained dataset and is not affiliated with Apple Inc. Facts decay quickly; verify against the cited sources before acting on a row.
