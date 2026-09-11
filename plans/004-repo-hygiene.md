# Plan 004: Repo hygiene — README dev instructions, scripts, devcontainer, renovate

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e6b9453..HEAD -- README.md scripts .devcontainer renovate.json package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding. Files
> changed by Plan 001 (`package.json` scripts/fields) and Plan 002/003 are
> expected; on any other mismatch treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/002-toolchain-node24.md (README must describe the
  *final* command set; renovate must see the final dependency set)
- **Category**: dx, docs
- **Planned at**: commit `e6b9453`, 2026-09-11

## Why this matters

After the pnpm + Node 24 + toolchain migrations (Plans 001–003), the repo's
human-facing surfaces still describe the dead world: the README contains only
a license (no install/build/test instructions), `scripts/deps.sh` loops
packages forking `yarn dlx`, the devcontainer still builds Node 12 and
recommends the Yarn-zipfs extension, and `renovate.json` either uses
deprecated presets or cannot maintain `pnpm-lock.yaml` properly. Every one of
these is aggravation multiplied by the number of people/agents who onboard.

## Current state

- `README.md` — 34 lines: two license badges, contact email, license terms.
  No setup/build/test documentation at all.
- `scripts/deps.sh`:
  ```bash
  #!/usr/bin/env bash
  for dir in `find packages -mindepth 1 -maxdepth 1 -type d | sort -nr`; do
      cd $dir
      echo $PWD
      yarn dlx npm-check-updates -u
      cd ../..
  done
  ```
- `.devcontainer/Dockerfile` line 2: `ARG VARIANT=12` with the comment
  `# Update the VARIANT arg in docker-compose.yml to pick a Node.js version: 10, 12, 14`;
  header line 1 same comment; installs build-essential, libcairo2-dev,
  pkg-config, libtool, autoconf, automake, python, libpq-dev, jq.
- `.devcontainer/devcontainer.json` — vintage template: name "Node.js & PostgreSQL",
  `dockerComposeFile: docker-compose.yml`, `service: app`, `workspaceFolder: /workspace`,
  `settings` with `terminal.integrated.shell.linux: "/bin/bash"` (deprecated
  key) and sqltools connection for TESTNET (port 5432, db ark_testnet).
- `.devcontainer/docker-compose.yml` — build args it passes to the Dockerfile
  (verify contents yourself; expected `VARIANT` build arg and a postgres service).
- `renovate.json`:
  ```json
  {
      "extends": ["config:base", ":preserveSemverRanges"],
      "packageRules": [
          {
              "packagePatterns": ["^@arkecosystem"],
              "groupName": "ark packages"
          }
      ]
  }
  ```
  `config:base` is a deprecated preset name; `packagePatterns` is deprecated
  in Renovate's schema (replaced by `matchDepPatterns`); nothing points Renovate
  at pnpm lockfile maintenance.
- Root `package.json` `"description": "Protokol nameserivce transaction support"`
  (typo "nameserivce"); same typo in `packages/nameservice-crypto/package.json`
  description: "Transaction Builders For Protokol Nameservice" (fine) — the typo
  is only in the root file. Contributor emails in 3 manifests are missing a
  closing `>`: `"Žan Kovač <zan@protokol.com"`, `"Amadej Pevec <amadej@protokol.com>"`,
  `"Kristjan Košič <kristjan@protokol.com>"` (only the first has the missing bracket).
- After Plan 001 the release flow loses Yarn's `version:check`/`version:apply`
  interactive gate — the README must document the manual replacement
  (scripts `pnpm version:patch` / `pnpm version:beta` exist from Plan 001).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Shellcheck the script | `shellcheck scripts/deps.sh` (if available) or `bash -n scripts/deps.sh` | exit 0 (report, don't fix, shellcheck-only style notes) |
| Renovate config validation | `pnpm dlx renovate-config-validator` | exit 0 |
| Markdown sanity (all that exists here) | read-through — no tooling configured | — |

## Scope

**In scope**:
- `README.md`
- `scripts/deps.sh`
- `.devcontainer/Dockerfile`, `.devcontainer/docker-compose.yml`, `.devcontainer/devcontainer.json`
- `renovate.json`
- `package.json` root `"description"` field only
- contributor-string fixes in the 3 affected manifests (`<zan@protokol.com` → `<zan@protokol.com>`)

**Out of scope**:
- Any source, test, or workflow file (Plans 001–003 territory; their status rows
  must read DONE or IN PROGRESS with your plan's prerequisites before 004 starts).
- `.claude/`, `.agents/`, `skills-lock.json` (untracked, user-owned — never touch).
- CHANGELOG.md regeneration.
- Adding `AGENTS.md`/`CLAUDE.md` — one was *recommended* by the audit only if
  the team wants agent-executed plans; it is not part of this plan.

## Git workflow

- Branch: `advisor/004-repo-hygiene`
- Commit per step; conventional commits, e.g. `docs: add development instructions for pnpm`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: README development section

Insert immediately after the badges (before the license section) a section:

```markdown
# Development

Requirements: Node.js 24 (LTS), pnpm 12 (Corepack works: `corepack enable`).

    corepack enable
    pnpm install

Common commands (see `package.json`):

| Command               | What it does                                    |
|-----------------------|-------------------------------------------------|
| `pnpm build`          | Build all workspace packages                    |
| `pnpm test:unit`      | Run unit tests for all packages                 |
| `pnpm lint`           | Lint sources (with fixes)                       |
| `pnpm format`         | Lint + prettier                                 |
| `pnpm clean`          | Remove `dist/`, `.coverage/`, `tmp/`            |
| `pnpm publish:beta`   | Build + `pnpm publish` tagged beta (per package)|

Tests needing Postgres:

    # start a local postgres:17 matching CI env vars
    cd packages/nameservice-api && pnpm run test:integration
    cd packages/nameservice-transactions && pnpm run test:functional

Versioning: bump all workspace packages with `pnpm version:patch` (or
`pnpm version:beta` for prereleases) and tag the release manually — the
`beta` workflow publishes on GitHub release creation.
```

**Verify**: `grep -n "corepack enable" README.md` → 1 match; the file keeps the
original license blocks untouched below.

### Step 2: Rewrite `scripts/deps.sh`

Replace contents with a pnpm-native loop (keeps the per-package behavior):

```bash
#!/usr/bin/env bash
set -euo pipefail

for dir in packages/*; do
    if [ -f "$dir/package.json" ]; then
        echo "==> $dir"
        (cd "$dir" && pnpm dlx npm-check-updates -u)
    fi
done
```

Notes for the executor:
- quoted paths instead of backtick command substitution;
- `-u` rewrites ranges in every `packages/*/package.json` (same as before —
  semver-preservation stays with the `:preserveSemverRanges` renovate preset
  and ARK packages stay pinned at `3.0.0` per Plan 001 — npm-check-updates skips
  nothing by itself, so flags stay minimal);
- no interactive prompts (the script is meant to be run unattended).

**Verify**: `bash -n scripts/deps.sh` → exit 0; `grep -n "yarn" scripts/deps.sh` → no matches.

### Step 3: Devcontainer to Node 24

1. `.devcontainer/Dockerfile`: `ARG VARIANT=12` → `ARG VARIANT=24`; update both
   comment lines: `# Update the VARIANT arg in docker-compose.yml to pick a Node.js version: 22, 24`.
   Add after the apt line: `RUN corepack enable`.
2. `.devcontainer/docker-compose.yml`: update the `VARIANT` build arg if it
   pins a version (read the file first — it may pass `VARIANT: 12` explicitly).
3. `devcontainer.json`: remove the deprecated `terminal.integrated.shell.linux`
   key; keep the sqltools settings as-is; confirm the extension list no longer
   contains `arcanis.vscode-zipfs` (removed in Plan 001).

**Verify**: `grep -n "VARIANT" .devcontainer/Dockerfile` shows `24`;
`grep -n "shell.linux" .devcontainer/devcontainer.json` → no matches.

### Step 4: Modernize `renovate.json`

Replace with:

```json
{
    "$schema": "https://docs.renovatebot.com/renovate-schema.json",
    "extends": [":preserveSemverRanges"],
    "lockFileMaintenance": { "enabled": true },
    "packageRules": [
        {
            "matchDepPatterns": ["^@arkecosystem/"],
            "groupName": "ark packages"
        }
    ]
}
```

Clarifications:
- `config:base` preset removed (deprecated); Renovate's defaults now include
  everything it supplied.
- `matchDepPatterns` is the current schema name for the old `packagePatterns`.
- Renovate auto-detects `pnpm-lock.yaml` and `packageManager: pnpm@12.3.4`
  — no explicit pnpm block is needed; `lockFileMaintenance` keeps the new
  lockfile fresh.

**Verify**: `pnpm dlx renovate-config-validator` exits 0. (It runs against
`renovate.json` in the current directory by default; if your downloaded
validator version needs a path argument, pass `./renovate.json`.)

### Step 5: Small text fixes

1. Root `package.json` description: `"Protokol nameserivce transaction support"`
   → `"Protokol nameservice transaction support"`. Do not change versions,
   engines, packageManager or scripts.
2. In the three affected package manifests fix the contributor bracket:
   `"Žan Kovač <zan@protokol.com"` → `"Žan Kovač <zan@protokol.com>"`.

**Verify**: `grep -c "nameserivce" package.json` → 0;
`grep -n "zan@protokol.com" packages/*/package.json | grep -v "com>"` → no matches.

## Test plan

- No code changes; no test additions.
- Existing verification: `pnpm install` still exits 0 after manifest edits
  (Step 5 edits package manifests, so re-run it), `pnpm build` exit 0.

## Done criteria

- [ ] `README.md` contains the Development section with working commands and no changed license text
- [ ] `scripts/deps.sh` contains no `yarn` and passes `bash -n`
- [ ] `.devcontainer` files reference Node 24 / VARIANT=24; no `shell.linux` key
- [ ] `pnpm dlx renovate-config-validator` exits 0
- [ ] `grep -c "nameserivce" package.json` → 0; contributor strings fixed
- [ ] `pnpm install && pnpm build` exit 0 after all manifest edits
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `.devcontainer/docker-compose.yml` pins an explicit Node tag or passes
  `VARIANT` differently than expected — report what it actually contains before
  choosing a bump.
- The ReadMe license section text differs from the excerpted structure and the
  License heading positions — report, don't improvise around legal text.
- `pnpm dlx renovate-config-validator` reports schema errors you cannot resolve
  by matching the sample above — report the validator output.
- You discover dependencies of Step 5 on files from Plans 001–002 that are not
  in the expected state.

## Maintenance notes

- README commands intentionally match `package.json` script names exactly;
  if a script name changes later, update the table in the same PR.
- Renovate grouping of `@arkecosystem/*` stays until Plan 001's STANDALONE pin
  decision (`3.0.0` exact) is revisited — that bump is out of scope for this
  plan and remains optional/unplanned.
- The devcontainer apt list (`libcairo2-dev`, `python`, etc.) predates the
  native-module needs of current deps; if a future dependency needs extra
  system libs, extend that single RUN line rather than adding layers.
