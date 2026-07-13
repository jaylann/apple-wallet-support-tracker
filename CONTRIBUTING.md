# Contributing

Thanks for helping keep the Apple Wallet Support Tracker accurate.

## How to contribute

| What you have | Where to go |
|---|---|
| You spotted wrong data | File a [correction issue](https://github.com/jaylann/apple-wallet-support-tracker/issues/new?template=correction.yml). Bring a source URL. |
| A brand isn't tracked yet | File a [new brand issue](https://github.com/jaylann/apple-wallet-support-tracker/issues/new?template=new_brand.yml). |
| You want to fix data yourself | Open a PR against `stage`. |
| You want to improve tooling, schema, or docs | Open a PR against `stage`. |
| You found a security issue | See [SECURITY.md](SECURITY.md) — do **not** file a public issue. |

## Branching and release model

- **`stage`** is the default branch. **PRs target `stage`.** CI runs on every push and PR.
- **`main`** is release-only. It is advanced exclusively by `.github/workflows/release.yml`, which fast-forwards `stage → main`, tags `vX.Y.Z`, and creates a GitHub Release.
- Never open a PR against `main`.

See [`docs/decisions/0002-staged-release-model.md`](docs/decisions/0002-staged-release-model.md) for the full reasoning.

## Versioning and changelog

This dataset follows [Semantic Versioning](https://semver.org/):

| Bump | When | Examples |
|---|---|---|
| **major** (`X`) | Breaking schema change | Restructure `data/`, rename/remove a field, bump `$schemaVersion` |
| **minor** (`Y`) | Backward-compatible additions | New brand(s), the **monthly sweep**, a new optional field |
| **patch** (`Z`) | Corrections / housekeeping | Fix a wrong field, refresh a citation, docs, CI |

All changes accumulate under the `## [Unreleased]` heading of [`CHANGELOG.md`](CHANGELOG.md) as they land — **never** under a versioned heading. At release time, `release.yml` renames `## [Unreleased]` to `## [X.Y.Z] — <date>` (the version you dispatch) and opens a fresh, empty `## [Unreleased]`. Concretely:

- **Contributors and agents:** add your entry under `## [Unreleased]`. Do not invent a version number — there is exactly one place the version is written, and the release workflow owns it.
- **Releasing:** pick the version from the table above and dispatch the **Release** workflow (`Actions → Release → Run workflow`, enter e.g. `2.1.0`). It verifies `[Unreleased]` is non-empty, cuts it into the version, fast-forwards `stage → main`, tags `vX.Y.Z`, and publishes the GitHub Release.

## Local development

```bash
git clone https://github.com/jaylann/apple-wallet-support-tracker.git
cd apple-wallet-support-tracker
npm install
npm run validate
```

`npm run validate` runs JSON Schema validation, checks for duplicate brands, validates slug format, and HEADs every `sources[].url`. Add `--strict` to also fail on rows with empty `sources[]`.

## Branch naming

- `data/<brand>` — data correction or addition
- `feat/<short>` — schema change, new field, new workflow
- `fix/<short>` — tooling or workflow bug
- `docs/<short>` — documentation
- `chore/<short>` — dependency bumps, CI hygiene

## Pull request process

1. Branch off `stage`.
2. Make your changes. For data PRs:
   - Bump `lastChecked` on rows you touch.
   - Add at least one entry to `sources[]` with a valid URL, `accessedAt` (today's ISO date), and `type`.
   - Bump top-level `lastModified` to the latest `lastChecked`.
   - Add a `## [Unreleased]` entry to `CHANGELOG.md` (see [Versioning and changelog](#versioning-and-changelog)).
3. Run `npm run validate` locally — must be green.
4. Push and open a PR against `stage`. Fill out the PR template.
5. Wait for `test` and `required-labels` checks. CodeRabbit (when enabled) will leave inline comments.
6. Squash-merge once approved.

### Required labels

Every PR **must** carry exactly one `type:*` label and at least one `area:*` label. CI gate `pr-conventions.yml` blocks merge otherwise.

| Prefix | Use for |
|---|---|
| `type:correction` | Fix a wrong field on an existing row |
| `type:new-brand` | Add a new brand to the dataset |
| `type:bug` | Tooling, workflow, or schema bug |
| `type:feature` | New field, new category, new workflow |
| `type:enhancement` | Improve existing tooling/docs |
| `type:refactor` | Restructure without behaviour change |
| `type:chore` | Deps, CI hygiene, formatting |
| `type:docs` | README, methodology, ADRs |
| `area:data` / `area:schema` / `area:prompts` / `area:ci` / `area:scripts` / `area:docs` | Subsystem (one or more) |

The labeler workflow auto-applies `area:*` based on changed paths — you usually only need to add the `type:*` yourself.

## Source priority

When citing a source for a fact, prefer (in order):

1. **Official** — the brand's own help docs, app listing, or product page
2. **Apple support docs** — `support.apple.com`, `developer.apple.com/wallet`
3. **Major outlet** — TechCrunch, MacRumors, 9to5Mac, The Verge, Reuters
4. **Community** — forum threads, Reddit, social media (only as supporting evidence, never the sole citation)

Never fabricate URLs. If you can't find a source, leave the field unchanged and explain in the PR body.

See [`docs/methodology.md`](docs/methodology.md) for `full` / `partial` / `none` definitions.

## License

By contributing, you agree your contributions are licensed under [CC BY 4.0](LICENSE).
