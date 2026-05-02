#!/usr/bin/env bash
# Pre-public safety check for apple-wallet-support-tracker.
#
# Run this before flipping the repo from private to public. It scans for:
#   - secret/token patterns in git history (all branches)
#   - gitleaks scan if installed
#   - suspicious files in the working tree
#   - .gitignore sanity
#   - pull_request_target usage in workflows
#   - commit author/email audit
#
# Exit code: 0 = pass (possibly with warnings), 1 = findings to address.
#
# Adapted from jaylann/Cast/scripts/pre-public-check.sh.

set -u

cd "$(dirname "$0")/.."

if [ -t 1 ]; then
    RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
    BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'
else
    RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; NC=''
fi

FINDINGS=0
WARNINGS=0

section() { printf "\n${BOLD}${BLUE}== %s ==${NC}\n" "$1"; }
pass()    { printf "${GREEN}PASS${NC} %s\n" "$1"; }
fail()    { printf "${RED}${BOLD}FAIL${NC} %s\n" "$1"; FINDINGS=$((FINDINGS + 1)); }
warn()    { printf "${YELLOW}WARN${NC} %s\n" "$1"; WARNINGS=$((WARNINGS + 1)); }

section "1. Secret/token patterns in git history"
SECRET_HITS=$(git log --all -p 2>/dev/null \
    | grep -inE 'sk-[a-zA-Z0-9]{20,}|sk-ant-[a-zA-Z0-9_-]{20,}|ghp_[a-zA-Z0-9]{30,}|gho_[a-zA-Z0-9]{30,}|ghu_[a-zA-Z0-9]{30,}|ghs_[a-zA-Z0-9]{30,}|github_pat_[a-zA-Z0-9_]{30,}|aws_secret_access_key|aws_access_key_id|"password"[[:space:]]*[:=]|"secret"[[:space:]]*[:=]|bearer[[:space:]]+[a-zA-Z0-9_.-]{20,}' \
    | head -50 || true)
if [ -n "$SECRET_HITS" ]; then
    HIT_COUNT=$(printf '%s\n' "$SECRET_HITS" | grep -c . || echo 0)
    fail "Found $HIT_COUNT lines matching secret patterns (first 10):"
    printf '%s\n' "$SECRET_HITS" | head -10 | sed 's/^/    /'
else
    pass "No secret patterns found in git history."
fi

section "2. gitleaks scan"
if command -v gitleaks >/dev/null 2>&1; then
    LEAKS_OUT=$(gitleaks detect --source . --no-banner --redact -v 2>&1 || true)
    printf '%s\n' "$LEAKS_OUT" | tail -n 5
    if printf '%s' "$LEAKS_OUT" | grep -qE 'leaks found: 0|no leaks found'; then
        pass "gitleaks found no leaks."
    else
        COUNT=$(printf '%s' "$LEAKS_OUT" | grep -oE 'leaks found: [0-9]+' | grep -oE '[0-9]+' | head -1)
        if [ -n "${COUNT:-}" ] && [ "$COUNT" != "0" ]; then
            fail "gitleaks found $COUNT leaks (see output above)."
        else
            warn "gitleaks output unclear — review manually."
        fi
    fi
else
    warn "gitleaks not installed. Install with: brew install gitleaks"
fi

section "3. Suspicious files in working tree"
SUSPICIOUS=$(find . \
    -path ./.git -prune -o \
    -path ./node_modules -prune -o \
    -type f \( \
        -name '.env' -o -name '.env.*' -o \
        -name '.credentials*' -o \
        -name '*.pem' -o -name '*.key' -o \
        -name 'id_rsa*' -o -name 'id_ed25519*' \
    \) -print 2>/dev/null)
if [ -n "$SUSPICIOUS" ]; then
    fail "Suspicious files found:"
    printf '%s\n' "$SUSPICIOUS" | sed 's/^/    /'
else
    pass "No suspicious files in working tree."
fi

section "4. .gitignore sanity"
if [ ! -f .gitignore ]; then
    warn ".gitignore is missing."
else
    REQUIRED_PATTERNS=("node_modules" ".env" "*.log")
    MISSING=()
    for pattern in "${REQUIRED_PATTERNS[@]}"; do
        if ! grep -qF "$pattern" .gitignore; then
            MISSING+=("$pattern")
        fi
    done
    if [ ${#MISSING[@]} -gt 0 ]; then
        warn ".gitignore missing patterns: ${MISSING[*]}"
    else
        pass ".gitignore covers expected patterns."
    fi
fi

section "5. pull_request_target usage in workflows"
PRT_FILES=$(grep -rl 'pull_request_target' .github/workflows/ 2>/dev/null || true)
if [ -n "$PRT_FILES" ]; then
    warn "pull_request_target used in:"
    printf '%s\n' "$PRT_FILES" | sed 's/^/    /'
    warn "Verify these workflows do NOT check out PR head with elevated permissions."
else
    pass "No pull_request_target usage found."
fi

section "6. Commit author/email audit"
AUTHORS=$(git log --all --format='%an <%ae>' | sort -u)
echo "Commit authors:"
printf '%s\n' "$AUTHORS" | sed 's/^/    /'
SUSPICIOUS_AUTHORS=$(printf '%s\n' "$AUTHORS" | grep -iE '@(localhost|example\.com|internal|corp)' || true)
if [ -n "$SUSPICIOUS_AUTHORS" ]; then
    warn "Suspicious author emails:"
    printf '%s\n' "$SUSPICIOUS_AUTHORS" | sed 's/^/    /'
else
    pass "No suspicious author emails."
fi

section "Summary"
if [ $FINDINGS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    printf "${GREEN}${BOLD}OK${NC}: ready to flip public.\n"
    exit 0
elif [ $FINDINGS -eq 0 ]; then
    printf "${YELLOW}${BOLD}OK with warnings${NC}: $WARNINGS warning(s). Review and proceed if acceptable.\n"
    exit 0
else
    printf "${RED}${BOLD}FAIL${NC}: $FINDINGS finding(s), $WARNINGS warning(s). Address before flipping public.\n"
    exit 1
fi
