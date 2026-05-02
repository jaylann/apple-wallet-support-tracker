> PRs target `stage`, not `main`. `main` is updated exclusively by the Release workflow.

## Summary
<!-- What does this PR change in the dataset / tooling? -->

## Brands changed
<!-- For data PRs, list each brand with before → after and the source URL. Skip for tooling PRs. -->
- _none_

## Test plan
- [ ] `npm run validate` passes locally
- [ ] All `sources[].url` resolve (HEAD 2xx)
- [ ] `lastModified` bumped if `data/` changed
- [ ] `lastChecked` bumped on touched rows

## Labels
- [ ] Exactly one `type:*` label
- [ ] At least one `area:*` label (the labeler workflow may have auto-applied these)

## Related issues
<!-- Closes #X -->
