# Plan 001: Migrate the workspace from Yarn 3 (PnP) to pnpm

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e6b9453..HEAD -- package.json .yarnrc.yml .gitignore .vscode packages/*/package.json`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: migration
- **Planned at**: commit `e6b9453`, 2026-09-11

## Why this matters

This repo is a Yarn 3.1 Plug'n'Play monorepo pinned to Node `^16` (EOL Sep 2023)
with `engineStrict: true`, so a fresh checkout on a modern machine cannot even
install. The committed zero-install cache is incomplete — `test:unit` in
`packages/nameservice-crypto` fails with `TS2307: Cannot find module
'@arkecosystem/crypto'` because the unplugged packages that live outside
`.yarn/cache` are missing — and Yarn-only features (`workspace:<path>`,
`packageExtensions` in `.yarnrc.yml`, the Yarn version plugin, `yarn workspaces
foreach`) have no successor without a package-manager migration. Moving to
pnpm gives a real `node_modules`, a modern engine range, and a lockfile that
CI Renovate can maintain. This plan swaps the package manager only; toolchain
version upgrades (TS/Jest/ESLint) and CI edits are separate plans 002–004.

## Current state

- `package.json` (root) — Yarn config lives here:
  - line 6–9: `"engineStrict": true`, `"engines": { "node": "^16.0.0", "yarn": "^3.0.0" }`
  - line 10–38: scripts all call `yarn …` / `yarn workspaces foreach -pt …`
  - line 44–69: devDependencies (leave all of these except `@yarnpkg/pnpify` unchanged in this plan)
  - line 71–104: `dependenciesMeta` with 11 `unplugged` entries (PnP-only concept)
  - line 106–108: `"workspaces": ["packages/*"]`
  - line 109: `"packageManager": "yarn@3.1.0"`
- `.yarnrc.yml` — PnP config; the `packageExtensions:` block (lines 1–58) fixes
  broken dependency declarations of `@arkecosystem/*` packages and is load-bearing;
  the `plugins:` block (lines 60–68) and `yarnPath:` (line 70) are Yarn-only.
- `.pnp.cjs`, `.pnp.loader.mjs`, `.yarn/` — PnP runtime + 99 MB committed cache.
- `.gitignore` lines 5–11:
  ```
  # Yarn 2
  .yarn/*
  !.yarn/cache/
  !.yarn/releases/
  !.yarn/plugins/
  !.yarn/versions/
  !.yarn/sdks/
  ```
- Workspace-protocol dependencies, Yarn path-style (exactly 4):
  - `packages/nameservice-transactions/package.json:49` — `"@protokol/nameservice-crypto": "workspace:packages/nameservice-crypto"`
  - `packages/nameservice-api/package.json:49-50` — crypto + transactions, path-style
  - `packages/nameservice-examples/package.json:43` — crypto, path-style
- All `@arkecosystem/*` deps in the 5 manifests use `"^3.0.0"`, resolved by
  `yarn.lock` to **3.0.0 exactly**. A fresh `pnpm install` would re-resolve
  `^3.0.0` to 3.13.0, so this plan pins them to `3.0.0` to keep the swap atomic
  (bumping ark versions is deliberately NOT part of this migration).
- `.vscode/settings.json` references PnP-only SDK paths:
  ```json
  "search.exclude": { "**/.yarn": true, "**/.pnp.*": true },
  "eslint.nodePath": ".yarn/sdks",
  "prettier.prettierPath": ".yarn/sdks/prettier/index.js",
  "typescript.tsdk": ".yarn/sdks/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
  ```
  `.vscode/extensions.json` recommends `"arcanis.vscode-zipfs"` (Yarn PnP extension).
- CI invokes `yarn` in `.github/workflows/*.yml` — **do NOT touch CI in this
  plan** (Plan 003 rewrites it); expect CI to be red between 001 and 003.
- Environment: Node **v24.x** installed (engines are being moved to `^24` in
  this plan; Jest 27 / TS 4.4 have been verified to boot under Node 24).
- Repo commit style (from `git log --oneline -15`): `chore(deps): …`,
  `chore: …`, `fix: …`. JSON files: root uses **tabs**, package manifests use
  **4 spaces** — match each file's existing indentation.
- The unit suites do not need a database: `.github/workflows/unit.yml` runs
  `test:unit:coverage` with no Postgres service — proof that units are
  Postgres-free. Only `test:integration` / `test:functional` need Postgres;
  those are out of scope here.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Get pnpm | `npm install -g pnpm@12.3.4` | exit 0, `pnpm --version` → `12.3.4` |
| Install  | `pnpm install`               | exit 0 |
| Show ark resolution | `pnpm ls -r --depth -1 @arkecosystem/core @arkecosystem/crypto` | versions all `3.0.0` |
| Build all | `pnpm build` | exit 0 |
| Unit tests | `pnpm test:unit` | all suites pass (coverage thresholds in `packages/nameservice-crypto` are 100% and must be met) |
| Lint | `pnpm lint && pnpm lint:tests` | exit 0 (or `0 files checked` warnings only) |

(These are the exact command shapes after step 9's script rewrite.)

## Scope

**In scope** (the only files you should modify):
- `package.json` (root)
- `packages/nameservice-crypto/package.json`
- `packages/nameservice-transactions/package.json`
- `packages/nameservice-api/package.json`
- `packages/nameservice-examples/package.json`
- `pnpm-workspace.yaml` (create)
- `.gitignore`, `.vscode/settings.json`, `.vscode/extensions.json`
- Delete: `.yarnrc.yml`, `.pnp.cjs`, `.pnp.loader.mjs`, `.yarn/` (directory)

**Out of scope** (do NOT touch, even though they look related):
- `.github/workflows/*.yml` — Plan 003. CI will be stale until 003; that is expected.
- Any `src/**/*.ts`, `__tests__/**`, `jest.config.js` — Plan 002 rules on the test stack.
- Renovate config, README, `scripts/`, `.devcontainer/` — Plan 004.
- Any `yarn.lock` bump past delete — the file is deleted in step 12, never migrated.
- `@sindresorhus/tsconfig`, `jest.config.js` contents, `.eslintrc.json` — still used verbatim until Plan 002.

## Git workflow

- Branch: `advisor/001-pnpm-migration`
- Commit per step or per grouped step; message style conventional commits, e.g.
  `chore: migrate workspace to pnpm` — match `chore(deps): update node.js to v16 (#86)` shape where a dependency is the subject.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Pin `@arkecosystem/*` dependencies to exact 3.0.0

In all 5 `package.json` files (root + 4 packages), replace every `@arkecosystem/…": "^3.0.0"` with
`@arkecosystem/…": "3.0.0"`. Do not touch `@protokol/*` ranges or anything else.
Verify count afterwards:

**Verify**: `grep -rn '"^3.0.0"' packages/*/package.json package.json | grep -c arkecosystem` → `0`
(and `grep -rn '"3.0.0"' packages/*/package.json package.json | grep arkecosystem` shows the same entries pinned).

### Step 2: Convert Yarn workspace protocols to pnpm form

In the four dependency entries listed in Current state, change
`"workspace:packages/<name>"` → `"workspace:*"`.

**Verify**: `grep -rn "workspace:packages" packages/*/package.json` → no matches;
`grep -rn '"workspace:\*"' packages/*/package.json` → 4 matches.

### Step 3: Create `pnpm-workspace.yaml`

Create at repo root, preserving the extension list verbatim except the two workspace entries:

```yaml
packages:
    - packages/*

packageExtensions:
    "@arkecosystem/core-kernel@*":
        dependencies:
            "@arkecosystem/core-api": latest
            "@arkecosystem/core-blockchain": latest
            "@arkecosystem/core-database": latest
            "@arkecosystem/core-forger": latest
            "@arkecosystem/core-logger-pino": latest
            "@arkecosystem/core-magistrate-api": latest
            "@arkecosystem/core-magistrate-transactions": latest
            "@arkecosystem/core-p2p": latest
            "@arkecosystem/core-snapshots": latest
            "@arkecosystem/core-state": latest
            "@arkecosystem/core-transaction-pool": latest
            "@arkecosystem/core-transactions": latest
            "@arkecosystem/core-webhooks": latest
            "@protokol/guardian-api": beta
            "@protokol/guardian-transactions": beta
            "@protokol/nameservice-api": "workspace:*"
            "@protokol/nameservice-transactions": "workspace:*"
            "@protokol/nft-base-api": beta
            "@protokol/nft-base-transactions": beta
            "@protokol/nft-exchange-api": beta
            "@protokol/nft-exchange-transactions": beta
    "@arkecosystem/core-magistrate-api@*":
        dependencies:
            "@arkecosystem/crypto": latest
    "@arkecosystem/core-snapshots@*":
        dependencies:
            joi: latest
    "@arkecosystem/core-transaction-pool@*":
        dependencies:
            "@arkecosystem/core-magistrate-crypto": latest
    "@arkecosystem/core@*":
        dependencies:
            "@oclif/errors": latest
    "@arkecosystem/crypto@*":
        dependencies:
            "@types/node": latest
    "@types/eslint-plugin-prettier@*":
        dependencies:
            eslint: latest
    jest-circus@*:
        dependencies:
            slash: 3.0.0
    jest-util@*:
        dependencies:
            jest-runner: latest
    node-fetch@*:
        dependencies:
            domexception: latest
    pg-cursor@*:
        dependencies:
            pg: latest
    typeorm@*:
        dependencies:
            pg: latest
            pg-query-stream: latest
```

Note: tag specifiers (`latest`, `beta`) are kept as Yarn had them. This is the
1:1 port — do not "improve" the resolution to newer versions in this plan.

### Step 4: Rewrite the root `package.json` fields

1. Delete `"engineStrict": true` and the `"yarn"` engine. Set engines to:
   ```json
   "engines": { "node": "^24.0.0", "pnpm": ">=10" }
   ```
2. Delete the whole `"dependenciesMeta"` block (lines 71–104 in Current state).
3. Delete `"@yarnpkg/pnpify"` from devDependencies. Change nothing else in deps.
4. Set `"packageManager": "pnpm@12.3.4"`.
5. Keep `"workspaces": ["packages/*"]` (harmless for pnpm, still read by some tooling).

**Verify**: `grep -n "yarn" package.json` → only the `yarn` occurrences inside
scripts, which step 5 removes next.

### Step 5: Rewrite the root scripts

Replace the `"scripts"` block with (same order, pnpm equivalents):

```json
{
    "publish:beta": "pnpm -r --parallel run publish:beta",
    "publish": "pnpm -r run publish",
    "build": "pnpm -r --parallel run build",
    "clean": "pnpm -r --parallel run clean",
    "changelog": "pnpm exec auto-changelog",
    "version:patch": "pnpm -r exec npm version patch --no-git-tag-version",
    "version:beta": "pnpm -r exec npm version prerelease --preid=beta --no-git-tag-version",
    "format": "pnpm run lint && pnpm run prettier",
    "lint": "eslint packages/**/src/** --ext .ts --fix",
    "lint:tests": "eslint packages/**/__tests__/** --ext .ts --fix",
    "prettier": "prettier --write \"./*.{ts,js,json,md}\" \"./**/*.{ts,js,json,md}\"",
    "test:unit": "pnpm -r --parallel run test:unit",
    "debug:forger": "node --inspect-brk pnpm exec ark forger:run",
    "debug:relay": "node --inspect-brk pnpm exec ark relay:run",
    "debug:start": "node --inspect-brk pnpm exec ark core:run",
    "core:devnet": "cross-env CORE_PATH_CONFIG=./config/networks/devnet pnpm exec ark core:run --network=devnet",
    "forger:devnet": "cross-env CORE_PATH_CONFIG=./config/networks/devnet pnpm exec ark forger:run --network=devnet",
    "relay:devnet": "cross-env CORE_PATH_CONFIG=./config/networks/devnet pnpm exec ark relay:run --network=devnet",
    "local:devnet": "cross-env CORE_PATH_CONFIG=./config/networks/devnet pnpm exec ark core:run --networkStart --env=test --network=devnet",
    "core:testnet": "cross-env CORE_PATH_CONFIG=./config/networks/testnet pnpm exec ark core:run --env=test --network=testnet",
    "forger:testnet": "cross-env CORE_PATH_CONFIG=./config/networks/testnet pnpm exec ark forger:run --env=test --network=testnet",
    "relay:testnet": "cross-env CORE_PATH_CONFIG=./config/networks/testnet pnpm exec ark relay:run --env=test --network=testnet",
    "manager:testnet": "cross-env CORE_PATH_CONFIG=./config/networks/testnet pnpm exec ark manager:run --env=test --network=testnet",
    "manager:devnet": "cross-env CORE_PATH_CONFIG=./config/networks/devnet pnpm exec ark manager:run --env=test --network=devnet",
    "full:testnet": "cross-env CORE_PATH_CONFIG=./config/networks/testnet pnpm exec ark core:run --networkStart --env=test --network=testnet"
}
```

Notes:
- `version:check` / `version:apply` (Yarn version plugin) are **deleted** — pnpm
  has no equivalent plugin; Plan 004 documents the manual release bump in the README.
- The `debug:*` scripts keep the `node --inspect-brk` prefix but now exec the
  ark binary through pnpm; if `pnpm exec ark` cannot be spawned as an argv0 this
  way, replace the prefix with just `pnpm exec ark forger:run` and note it.
- `lint` / `lint:tests` keep their exact current arguments (still valid through
  ESLint 7 in this plan; Plan 002 rewrites them with the flat config).

**Verify**: `grep -c "yarn" package.json` → `0`.

### Step 6: Rewrite each package's scripts

For `packages/nameservice-{crypto,transactions,api}/package.json`:

- `"build": "pnpm run clean && tsc"`
- `"build:watch"`: crypto → `"pnpm run clean && tsc -w"`; transactions and api →
  `"pnpm run clean && tsc -w"` (the current value `yarn clean && yarn compile -w`
  points at a `compile` script that does not exist — treat it as dead code and
  normalize to `tsc -w`).
- `"clean": "rimraf .coverage dist tmp"` (unchanged)
- `"test"` / `"test:unit"` / `test:unit:coverage` / `test:integration*` / `test:functional*`: unchanged commands (plain `jest …`; jest resolves from `node_modules/.bin`).
- `"coverage:report": "pnpm exec codecov"` (still present until Plan 002 removes the codecov package)
- `"publish:beta": "pnpm run build && pnpm publish --tag beta --access public --no-git-checks"`
- `"publish": "pnpm run build && pnpm publish --access public --no-git-checks"`
  (applies to crypto, transactions, api — examples has no publish script)

**Verify**: `grep -rn "yarn" packages/*/package.json` → `0` matches.

### Step 7: Remove PnP artifacts and fix dotfiles

1. Delete from disk and from git index:
   ```
   git rm --cached .pnp.cjs .pnp.loader.mjs .yarnrc.yml
   rm .pnp.cjs .pnp.loader.mjs .yarnrc.yml
   git rm -r --cached .yarn
   rm -rf .yarn
   ```
2. `.gitignore`: delete the `# Yarn 2` block (see Current state). The existing
   `node_modules` line already covers pnpm.
3. `.vscode/settings.json`: delete the `eslint.nodePath`, `prettier.prettierPath`,
   `typescript.tsdk`, and `typescript.enablePromptUseWorkspaceTsdk` entries, and
   delete the `"**/.yarn"` / `"**/.pnp.*"` keys from `search.exclude`.
4. `.vscode/extensions.json`: remove the `"arcanis.vscode-zipfs"` recommendation.

**Verify**: `ls .yarnrc.yml .pnp.cjs .pnp.loader.mjs 2>&1` → all "No such file";
`grep -rn "yarn" .vscode .gitignore` → no matches.

### Step 8: Install with pnpm

```
pnpm install
```

Expected: exit 0. Read the full output:
- If pnpm prints "Ignored build scripts" warnings, note which packages. Only
  act if a later step actually fails on missing native builds; otherwise leave
  them blocked (pnpm 12's secure default).
- The lockfile `pnpm-lock.yaml` is generated (not hand-written, DO commit it).

**Verify**: `pnpm ls -r --depth -1 @arkecosystem/core @arkecosystem/crypto` →
every listed version is `3.0.0`. If anything resolves differently, a `^3.0.0`
spec survived step 1 — fix and re-verify.

### Step 9: Build

```
pnpm build
```

**Verify**: exit 0. `dist/` appears in each of the three library packages.
If `tsc` fails with module-resolution errors on `@arkecosystem/*` only, check
that `pnpm-workspace.yaml` extension entries are quoted exactly as in step 3
before diagnosing anything else.

### Step 10: Unit tests

```
pnpm test:unit
```

**Verify**: exit 0, all suites in nameservice-crypto, nameservice-transactions
and nameservice-api pass, and the crypto package's 100% coverage thresholds are
met. Known-good baseline context: before this migration, `test:unit` in crypto
failed ONLY because of unreachable `@arkecosystem/crypto` (unplugged PnP
packages missing from the committed cache). Every remaining `TS2339/TS4112`
error in the pre-migration smoke run (`src/builders/nameservice.ts:*`,
`src/transactions/nameservice.ts:*`) was cascade damage from that unresolved
import — with the module resolvable these should all vanish.

## Test plan

- No new tests. This plan's correctness is proven by the existing unit suites
  (see Step 10) plus the lint pass below.
- `pnpm lint && pnpm lint:tests` → exit 0 (ESLint 7 with the existing
  `.eslintrc.json` — untouched in this plan).

## Done criteria

- [ ] `pnpm install` exits 0 and `pnpm-lock.yaml` exists
- [ ] No `yarn` reference remains: `grep -rn "yarn" package.json packages/*/package.json .gitignore .vscode` → 0 matches
- [ ] `pnpm ls -r --depth -1 @arkecosystem/core @arkecosystem/crypto` → all `3.0.0`
- [ ] `pnpm build` exits 0
- [ ] `pnpm test:unit` exits 0 with all suites green (crypto coverage 100% includes thresholds)
- [ ] `pnpm lint && pnpm lint:tests` exits 0
- [ ] `.pnp.cjs`, `.pnp.loader.mjs`, `.yarnrc.yml`, `.yarn/` deleted
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the "Current state" locations doesn't match the excerpts.
- pnpm rejects `workspace:*` inside `packageExtensions` (a spec-parse error
  pointing into `pnpm-workspace.yaml`). Report the exact error; do NOT replace
  workspace specifiers with registry versions on your own.
- Fresh install resolves any `@arkecosystem/*` package to a version other than
  `3.0.0` (means a stray `^3.0.0` survived step 1 — fix that; but if ALL are
  pinned and it still resolves to 3.13.0, report instead of deducing).
- `pnpm install` fails on peer-dependency conflicts tied to `@protokol/client@^1.0.0`
  in the examples package. Report the conflict; a version relax is a separate decision.
- Unit failures are NOT module-resolution errors (i.e. real assertion failures
  after a clean install) — report the first failing assertion instead of debugging.
- Fixing anything requires touching an out-of-scope file.

## Maintenance notes

- Keep `pnpm-workspace.yaml` extensions in sync with whatever the ARK 3.x line
  fixes in its own manifests; if ARK fixes its deps upstream, an extension can
  be dropped — verify with `pnpm install` after removal.
- `pnpm-lock.yaml` is now the single source of truth; Renovate configuration is
  modernized for pnpm in Plan 004.
- Between this plan and Plan 003, CI workflows still call `yarn` — they will
  fail until 003 lands. Do not "fix" them in 001.
- Future work that changes workspace package versions must be done with
  `pnpm version:patch` / `pnpm version:beta` (see rewritten scripts) — the
  interactive Yarn `version check` gate is gone; tag releases manually.
