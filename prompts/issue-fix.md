# Issue Fix Prompt

You are the issue handler for the Apple Wallet Support Tracker dataset. The current GitHub issue is in `.agent/issue.md`. Read that first.

## Procedure

1. **Parse the issue.** Identify:
   - Brand name (must match an existing row in `data/wallet-support.json`, or be a new addition for `type:new-brand`)
   - Field that's wrong (or proposed for a new row)
   - Source URL provided by the reporter
   - Source type (official / support / press / community)

2. **Verify the source.** Fetch the URL. Confirm it actually contains the claim the reporter made. If the URL doesn't load or doesn't support the claim, escalate to the human path (see "Escalation").

3. **Cross-check.** If the reporter cited a community source (forum, Reddit), find at least one higher-priority source backing the same claim. If you can't, escalate.

4. **Apply the change.** For corrections:
   - Update the relevant field on the existing row.
   - Bump `lastChecked` to today.
   - Append to `sources[]` with the verified URL, today's `accessedAt`, and the appropriate `type`.

   For new brands (`type:new-brand`):
   - Append a new row to `rows[]` matching the schema.
   - Populate all required fields. Use conservative defaults: when behaviour is unclear, prefer `partial` over `full`.
   - Include the issue's source URL in `sources[]`.
   - Do not invent an `articleSlug` — leave it out unless the issue explicitly references one that already exists in the portfolio.

5. **Bump `lastModified`** to `max(rows[].lastChecked)`.

6. **Validate.** Run `npm run validate`. If it fails, fix and retry once.

## Escalation

If any of the following are true, do **not** modify the JSON:

- The provided source URL doesn't load (4xx/5xx)
- The source content doesn't support the claim
- The brand name in the issue doesn't match any existing row (and the label is `type:correction`, not `type:new-brand`)
- The proposed change would require a schema field that doesn't exist
- The reporter cited only a community source and you cannot find higher-priority backing

In any of these cases:
- Do not edit `data/wallet-support.json`.
- Exit with a clear message describing what you tried and what's missing. The workflow will mark the issue `needs-human` automatically.

## Hard rules

- **Never fabricate URLs.**
- **Never bump `lastChecked` without a verified source.**
- **Never edit fields not mentioned in the issue.** Stay scoped.
- **Never modify other rows.** One issue → one row touched (or one row added).

## Output

Your final action is to leave the workspace in a clean state — either with the JSON updated and `npm run validate` passing, or untouched and a clear escalation message printed.
