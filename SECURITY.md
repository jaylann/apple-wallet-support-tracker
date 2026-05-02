# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this repository — for example a workflow that could be coerced into running attacker code, a permissions misconfiguration, or a supply-chain risk — please report it privately.

**Do not open a public GitHub issue for security vulnerabilities.**

Use [GitHub's private vulnerability reporting](https://github.com/jaylann/apple-wallet-support-tracker/security/advisories/new) to submit your report.

### What to include

- Description of the vulnerability
- Steps to reproduce or proof-of-concept
- Potential impact (data exfiltration, supply-chain compromise, etc.)
- Suggested fix (if any)

### Response timeline

- **Acknowledgment**: within 48 hours
- **Initial assessment**: within 1 week
- **Fix timeline**: depends on severity, typically within 2 weeks for critical issues

## Scope

This is a public dataset and tooling repository. Security-relevant areas:

- GitHub Actions workflows (especially `pull_request_target` usage)
- The `claude-code-action` configuration in `sweep.yml` and `issue-handler.yml` — token scope, prompt-injection vectors via issue body
- `scripts/validate.ts` — only fetches HEAD from declared sources
- Branch protection rulesets and bypass lists

The dataset itself is non-sensitive (public information about brand support).

## Supported Versions

Only the latest tagged release on `main` receives security updates. `stage` is rolling.
