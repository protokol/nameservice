# Plan 003: Modernize the GitHub Actions workflows for pnpm + Node 24

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e6b9453..HEAD -- .github/workflows`
> Any change means this plan's excerpts and line references must be
> re-validated against the live files before proceeding.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/001-pnpm-migration.md, plans/002-toolchain-node24.md
- **Category**: dx
- **Planned at**: commit `e6b9453`, 2026-09-11

## Why this matters

All four workflows still bootstrap with `yarn`, pin Node `16.x` (EOL), use
`actions/checkout@v2` / `actions/setup-node@v2` / `codecov/codecov-action@v2`
(all deprecated, Node16-runtime runners), run Postgres 12 (EOL Nov 2024), and
have no package-manager cache — every CI run downloads the full dependency
tree from scratch. After Plan 001 swaps the workspace to pnpm and Plan 002
bumps the toolchain to Node 24, CI must be updated or every push goes red. The
integration and functional jobs also double as the repo's only Postgres-backed
verification, so keeping them healthy is part of the verification baseline.

## Current state

Four YAML files under `.github/workflows/`:

- `unit.yml` — three jobs-in-one (`NAMESERVICE-CRYPTO/TRANSACTIONS/API` as
  sequential steps), `runs-on: ubuntu-latest`, `strategy.matrix.node-version: [16.x]`,
  `actions/checkout@v2`, `actions/setup-node@v2`, install step `run: yarn && yarn build`,
  test steps of the form `cd packages/nameservice-crypto && yarn test:unit:coverage --maxWorkers=2`,
  then three `codecov/codecov-action@v2` steps with `directory:
  packages/<pkg>/.coverage`, `flags: <pkg>`, `verbose: true`.
- `integration.yml` — service `postgres:12` with env `POSTGRES_USER: ark`,
  `POSTGRES_PASSWORD: password`, `POSTGRES_DB: ark_unitnet`, port 5432, plus
  `CORE_DB_DATABASE/CORE_DB_USERNAME/POSTGRES_USER/POSTGRES_PASSWORD/POSTGRES_DB`
  env on the job; Node 16 matrix; `yarn && yarn build`; then
  `cd packages/nameservice-api && yarn test:integration:coverage --coverageDirectory .coverage/integration-nameservice-api`.
- `functional.yml` — four jobs (single-passphrase, second-passphrase,
  multi-signature, vendor-field), each with `postgres:12` service and identical
  env block; command `yarn test __tests__/functional/transaction-forging/nameservice/<suite>.test.ts --forceExit`
  from `packages/nameservice-transactions`.
- `publish-beta.yml` — triggered on `release: types: [created]`; Node 16 via
  `setup-node@v2` with `registry-url: https://registry.npmjs.org/` and
  `always-auth: true`; then `yarn && yarn build`; publish step
  `yarn config set npmAuthToken "$env:NODE_AUTH_TOKEN" && yarn publish:beta`
  with `NODE_AUTH_TOKEN: ${{secrets.NPM_AUTOMATION_TOKEN }}`.

Trailing context from Plan 001/002 that this plan builds on:
- Root scripts now exist as `pnpm build`, `pnpm publish:beta`, and per-package
  `test:unit:coverage` / `test:integration:coverage` scripts that no longer
  reference yarn.
- `packageManager: "pnpm@12.3.4"` is set in the root `package.json`.
- Jest 30 / TS 5.9 toolchain installed via Plan 002.

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| YAML sanity | `python3 -c "import yaml,sys;yaml.safe_load(open(sys.argv[1]))" <file>` per workflow | exit 0 |
| Local dry-gate | `pnpm install --frozen-lockfile && pnpm build` | exit 0 (mirrors what CI will run) |

## Scope

**In scope**:
- `.github/workflows/unit.yml`
- `.github/workflows/integration.yml`
- `.github/workflows/functional.yml`
- `.github/workflows/publish-beta.yml`

**Out of scope**:
- Workflow *triggers* (on/push branches) — keep as-is.
- The codecov token secret (`secrets.` reference) — keep the existing secret name.
- Any package.json change — scripts were already fixed in Plan 001.
- Adding Dependabot/renovate for Actions versions — Plan 004 covers renovate.

## Git workflow

- Branch: `advisor/003-ci-modernization`
- One commit per workflow file; conventional commits, e.g. `ci: use pnpm and node 24 in unit workflow`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Shared changes for all four workflows

Apply to every file:

1. `actions/checkout@v2` → `actions/checkout@v4`
2. Replace the Node setup step with pnpm + Node 24:
   ```yaml
   - uses: pnpm/action-setup@v4

   - name: Use Node.js 24
     uses: actions/setup-node@v4
     with:
         node-version: 24
         cache: pnpm
   ```
   (`pnpm/action-setup` reads the version from `packageManager` in
   `package.json`; do not hard-code a pnpm version.)
3. Replace every `run: yarn && yarn build` install command with:
   ```yaml
   run: pnpm install --frozen-lockfile && pnpm build
   ```
4. Replace the Node version matrix `node-version: [ 16.x ]` with
   `node-version: [ 24 ]` (keep the strategy block for future bumps).
5. Postgres services: `image: postgres:12` → `image: postgres:17` (integration.yml
   and functional.yml; devnet-style image names stay unchanged).

**Verify**: `grep -rn "yarn" .github/workflows/` → no matches (except none).
`grep -rn "@v2" .github/workflows/` → no matches.

### Step 2: `unit.yml`

Keep the single-job shape. Test steps become exactly:

```yaml
      - name: NAMESERVICE-CRYPTO
        run: |
            cd packages/nameservice-crypto
            pnpm run test:unit:coverage --maxWorkers=2
```

(same pattern for transactions and api — note `pnpm run`, not bare `pnpm
test:unit:coverage`, since pnpm requires `run <script>` for script names that
aren't built-ins; `--maxWorkers=2` must appear AFTER `--`, i.e.
`pnpm run test:unit:coverage -- --maxWorkers=2`? No — pnpm forwards unknown
flags to the script automatically; `pnpm run test:unit:coverage --maxWorkers=2`
works and forwards `--maxWorkers=2` to jest. Keep the plain form.)

Codecov steps: `codecov/codecov-action@v5`, drop `verbose: true` (removed by
v5; keep `directory` and `flags` exactly as before).

**Verify**: `python3 -c "import yaml;yaml.safe_load(open('.github/workflows/unit.yml'))"` → exit 0.

### Step 3: `integration.yml`

Same shared changes. Final test step:

```yaml
      - name: NAMESERVICE-API
        run: |
            cd packages/nameservice-api
            pnpm run test:integration:coverage --coverageDirectory .coverage/integration-nameservice-api
```

Keep the env block (`CORE_DB_DATABASE` etc.) and the postgres service definition
with the new `postgres:17` image.

**Verify**: YAML parses; `grep -n "postgres:" .github/workflows/integration.yml` → `postgres:17`.

### Step 4: `functional.yml`

Same shared changes in all four jobs. Test steps become:

```yaml
            - name: TEST
              run: |
                  cd packages/nameservice-transactions
                  pnpm run test __tests__/functional/transaction-forging/nameservice/<suite>.test.ts --forceExit
```

with `<suite>` staying single-passphrase / second-passphrase / multi-signature
/ vendor-field as today.

**Verify**: YAML parses; four `pnpm run test` occurrences, zero `yarn`.

### Step 5: `publish-beta.yml`

Rewrite to:

```yaml
name: PUBLISH NPM:BETA
on:
  release:
    types: [created]
jobs:
    build:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: pnpm/action-setup@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: 24
                  registry-url: https://registry.npmjs.org/
                  always-auth: true
                  cache: pnpm

            - name: Install & Build
              run: pnpm install --frozen-lockfile && pnpm build

            - name: Publish to NPM
              run: pnpm publish:beta
              env:
                  NODE_AUTH_TOKEN: ${{secrets.NPM_AUTOMATION_TOKEN }}
```

Rationale: `actions/setup-node@v4` writes `~/.npmrc` with
`//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}` when `registry-url` is
given; `pnpm publish` reads that token. The Yarn-only
`yarn config set npmAuthToken` step goes away.

**Verify**: YAML parses; `grep -n "npmAuthToken" .github/workflows/publish-beta.yml` → no matches.

## Test plan

- No code or tests change. Verification is the YAML parse gate above plus, if
  the operator has push access and a branch on GitHub, a manual run of the
  three PR-triggered workflows on the branch. If you cannot run CI, state that
  in the report.
- Locally, the closest dry-run gate is `pnpm install --frozen-lockfile && pnpm
  build` (exit 0), which is byte-for-byte what `integration.yml` and
  `functional.yml` will execute.

## Done criteria

- [ ] All four workflows parse as YAML
- [ ] `grep -rn "yarn" .github/workflows/` → no matches
- [ ] `grep -rn "@v2" .github/workflows/` → no matches
- [ ] Every workflow uses `pnpm/action-setup@v4` + `actions/setup-node@v4` with `node-version: 24` and `cache: pnpm`
- [ ] Postgres images are `postgres:17`
- [ ] `publish-beta.yml` authenticates via `NODE_AUTH_TOKEN` env only
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any workflow file differs from the excerpts in "Current state" (drift).
- The `NPM_AUTOMATION_TOKEN` secret name no longer exists in the repo (check
  with the operator — do not guess or substitute another credential's name).
- A step's verification fails twice after a reasonable fix attempt.
- You discover the assumption "per-package `test:unit:coverage` and
  `test:integration:coverage` scripts exist with those exact names after Plan
  001" is false.

## Maintenance notes

- `pnpm/action-setup` version should be reviewed when pnpm 13 ships; the action
  itself reads the pinned `packageManager` field, so no per-workflow edits.
- Node majors bump in lockstep across all four workflows — keep the matrix a
  single value until a second Node version is actually needed.
- Postgres 17 was chosen as the newest non-experimental major at planning time;
  ARK core 3.x database layer (`typeorm 0.2.x` + `pg`) works with it, but if a
  future maintenance release upgrades `typeorm`, re-verify integration + functional.
- The codecov upload token/flags were left untouched on purpose; if coverage
  numbers change shape (e.g. jest 30 lcov layout), check flags still match in the dashboard.
