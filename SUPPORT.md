# Getting Support

## Reporting incorrect data

The fastest way to fix wrong data is to open a [correction issue](https://github.com/jaylann/apple-wallet-support-tracker/issues/new?template=correction.yml). Include:

- The brand name as it appears in `data/wallet-support.json`
- The field that's wrong (`nativePkpass`, `iosLiveActivity`, `watchSync`, `notes`, `knownIssues`, `region`, or `category`)
- The value you observed
- A source URL backing your claim

The issue handler workflow runs the researcher agent against your source, opens a PR with the fix, and comments back on the issue with the result. If the agent can't verify the source, the issue is labeled `needs-human` for manual review.

## Requesting a new brand

Use the [new brand template](https://github.com/jaylann/apple-wallet-support-tracker/issues/new?template=new_brand.yml). Required: brand name, category, region, and at least one source URL.

## Bugs in tooling

For bugs in the workflows, validation script, or schema, use the [bug report template](https://github.com/jaylann/apple-wallet-support-tracker/issues/new?template=bug_report.yml).

## Feature requests

For new fields, categories, regions, or workflow changes, use the [feature request template](https://github.com/jaylann/apple-wallet-support-tracker/issues/new?template=feature_request.yml).

## Security issues

**Do not** file a public issue. See [SECURITY.md](SECURITY.md).

## Contributing code

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Commercial support

There is no paid support tier. This dataset is maintained best-effort by [@jaylann](https://github.com/jaylann) under [CC BY 4.0](LICENSE).
