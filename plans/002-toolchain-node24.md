# Plan 002: Bring the toolchain to the Node 24 era (TS 5.9, Jest 30, ESLint 9 flat config, Prettier 3)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat e6b9453..HEAD -- package.json packages/*/package.json jest.config.js tsconfig.json tsconfig.eslint.json .eslintrc.json .eslintignore`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. (Files changed by Plan 001 —
> `package.json` scripts/fields only — are expected and fine.)

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/001-pnpm-migration.md
- **Category**: migration, dx
- **Planned at**: commit `e6b9453`, 2026-09-11

## Why this matters

The repo still compiles with TypeScript 4.4.2 (Sept 2021), tests with Jest 27 +
ts-jest 27 + jest-extended 0.11.5, lints with ESLint 7/8 + typescript-eslint 5,
and formats with Prettier 2.4.1. Those stacks predate Node 24, break under it,
carry deprecation warnings (`ts-jest`'s `globals` config, `--ext` flag, eslintrc
mode), and leave the repo unable to use modern TS/Jest features. This plan
upgrades the whole dev toolchain in one atomic, verified pass, keeping the
runtime output (CJS plugins for ARK core 3.x) byte-shape-compatible. It is
deliberately limited to tooling: no dependency (`@arkecosystem/*`) version
changes beyond what Plan 001 pinned, and no ESM conversion.

## Current state

- `tsconfig.json` (root): extends `@sindresorhus/tsconfig` and then overrides
  almost everything with these options: `declaration: true`,
  `emitDecoratorMetadata: true`, `esModuleInterop: true`,
  `experimentalDecorators: true`, `forceConsistentCasingInFileNames: true`,
  `lib: ["es2019", "dom"]`, `module: "commonjs"`, `moduleResolution: "node"`,
  `newLine: "lf"`, `noEmitOnError: true`, `noFallthroughCasesInSwitch: true`,
  `noImplicitAny: false`, `noImplicitReturns: true`, `noUnusedLocals: false`,
  `noUnusedParameters: false`, `outDir: "dist"`, `pretty: true`,
  `resolveJsonModule: true`, `skipLibCheck: true`, `sourceMap: true`,
  `strict: true`, `stripInternal: true`, `target: "es2019"`,
  `noPropertyAccessFromIndexSignature: false`;
  `exclude: ["dist", "**/*.spec.ts", "**/*.test.ts"]`.
- `@sindresorhus/tsconfig@2.0.0` contributes THREE options that ARE effective
  in builds and are NOT overridden by the root file (verified by reading the
  packaged tsconfig): `"noImplicitOverride": true`, `"noUncheckedIndexedAccess": true`,
  `"useDefineForClassFields": true`, plus `"allowSyntheticDefaultImports": true`.
  When the preset is removed these must be inlined or the strictness silently drops.
- `tsconfig.eslint.json`: identical compiler options; its only difference is
  `exclude: ["dist"]` — it exists so ESLint can type-check `*.test.ts` files,
  which the root tsconfig excludes (see `.eslintrc.json` `parserOptions.project`).
- `jest.config.js` (root):
  ```js
  module.exports = {
      bail: false,
      collectCoverage: false,
      collectCoverageFrom: ["src/**/*.ts", "!**/node_modules/**"],
      coverageDirectory: "<rootDir>/.coverage",
      coverageReporters: ["json", "lcov", "text", "clover", "html"],
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
      setupFilesAfterEnv: ["jest-extended"],
      testEnvironment: "node",
      testMatch: ["**/*.test.ts"],
      transform: { "^.+\\.tsx?$": "ts-jest" },
      verbose: true,
      globals: { "ts-jest": { packageJson: "./package.json" } },
  };
  ```
- Package-local configs also exist — `packages/nameservice-{crypto,transactions,api}/jest.config.js`
  — same shape (the crypto one adds `collectCoverage: true`, `collectCoverageFrom`
  array, and a 100% `coverageThreshold.global`). All set `setupFilesAfterEnv: ["jest-extended"]`.
- `import "jest-extended";` appears verbatim at line 1 of these 6 files:
  - `packages/nameservice-crypto/__tests__/unit/transactions/nameservice.test.ts`
  - `packages/nameservice-crypto/__tests__/unit/builders/nameservice.test.ts`
  - `packages/nameservice-transactions/__tests__/unit/handlers/nameservice.test.ts`
  - `packages/nameservice-transactions/__tests__/functional/transaction-forging/__support__/index.ts`
  - `packages/nameservice-api/__tests__/unit/controllers/configurations.test.ts`
  - `packages/nameservice-api/__tests__/unit/controllers/nameservice.test.ts`
- `.eslintrc.json` (root): classic config with `parserOptions.project:
  ./tsconfig.eslint.json`, plugins `@typescript-eslint, jest, prettier,
  simple-import-sort`, extends `eslint:recommended`,
  `plugin:@typescript-eslint/eslint-recommended`,
  `plugin:@typescript-eslint/recommended-requiring-type-checking`,
  `plugin:@typescript-eslint/recommended`, `plugin:jest/recommended`,
  `plugin:prettier/recommended`, `prettier`, and a `rules` block that turns
  OFF: `@typescript-eslint/ban-ts-comment`, `@typescript-eslint/ban-types`,
  `@typescript-eslint/naming-convention`, `@typescript-eslint/no-empty-interface`,
  `@typescript-eslint/no-explicit-any`, `no-unsafe-assignment`, `no-unsafe-call`,
  `no-unsafe-member-access`, `no-unsafe-return`, `no-unused-vars`, `no-var-requires`,
  `require-await`, `restrict-plus-operands`, `restrict-template-expressions`; and ON:
  `prefer-const` `{destructuring: "all"}`, `"prettier/prettier": "error"`,
  `"simple-import-sort/imports": "error"`, `"simple-import-sort/exports": "error"`.
- `.eslintignore` exists (port its contents in step 6, then delete it).
- Package manifests devDependencies currently include: `typescript ~4.4.2`,
  `@types/node ^16.0.0`, `@types/jest ~27.0.0`, `jest ~27.3.0 / ^27.0.1`,
  `ts-jest ~27.0.1`, `jest-extended 0.11.5 / ~0.11.5 / ^0.11.5`, `@types/rimraf ^3.0.0`,
  `rimraf ^3.0.2`, `typedoc ~0.22.0`, `codecov ^3.8.1`,
  `@sindresorhus/tsconfig ~2.0.0 / ^2.0.0`, `@typescript-eslint/eslint-plugin ^5.0.0`,
  `@typescript-eslint/parser ^5.0.0`, `eslint ^7.32.0`, `eslint-config-prettier ^8.1.0`,
  `eslint-plugin-jest ^25.0.0`, `eslint-plugin-prettier ^4.0.0`,
  `eslint-plugin-simple-import-sort ^7.0.0`, `@types/eslint ^7.2.6`,
  `@types/eslint-plugin-prettier ^3.1.0`, `@types/prettier ^2...`, `prettier 2.x`.
  Distribution (which manifest has what) must be inspected file by file — do not
  assume the root's list applies to packages.
- Verified latest majors at planning time (re-check with `npm view <pkg> dist-tags.latest`):
  typescript 7.0.2 (native line — NOT usable here, see rejection note), prettier 3.9.6,
  eslint 10.x + eslint 9.x both live, typescript-eslint 8.70.0, jest 30.5.1,
  ts-jest 29.4.12, jest-extended 7.0.0, typedoc 0.28.20, rimraf 6.x, @types/node 24.13.x,
  eslint-plugin-jest 29.x, eslint-config-prettier 10.x, eslint-plugin-prettier 5.x,
  eslint-plugin-simple-import-sort 14.x.
- Repo styling conventions: 4-space JSON in package manifests, tabs in root
  config files; conventional commits (`chore(deps): …`).

## Commands you will need

| Purpose | Command | Expected on success |
|---------|---------|---------------------|
| Install | `pnpm install` | exit 0 |
| Typecheck/build | `pnpm build` | exit 0 |
| Unit tests | `pnpm test:unit` | all pass |
| Functional (needs Postgres) | `cd packages/nameservice-transactions && pnpm run test:functional` | all pass (local postgres; skip if unavailable — report instead of faking) |
| Lint | `pnpm lint && pnpm lint:tests` | exit 0 |
| Docs | `pnpm --filter @protokol/nameservice-crypto run build:docs` | exit 0, `packages/nameservice-crypto/docs/` regenerated (untracked — remove after check) |

## Suggested executor toolkit

None specific. This is a mechanical manifest/config upgrade.

## Scope

**In scope**:
- `package.json` (root) — devDependencies versions, scripts (`lint`, `lint:tests`)
- `packages/*/package.json` (all four) — devDependencies versions, remove `coverage:report`
- `tsconfig.json`, `tsconfig.eslint.json` — inline the preset, bump target/lib
- `jest.config.js` (root) + `packages/*/jest.config.js` (3)
- `eslint.config.mjs` (create), delete `.eslintrc.json` + `.eslintignore`
- The 6 test files importing `jest-extended` (one-line import edits only)
- Delete `codecov` devDependency + per-package `coverage:report` scripts (npm
  package is deprecated and its CLI no longer functions; coverage upload is
  already CI-side via codecov-action)
- Remove `@sindresorhus/tsconfig` from all manifests (preset is inlined)

**Out of scope**:
- Any `src/**` TS file — if lint or the new TS version demands real code edits,
  that is a STOP condition (there must be no behavior-relevant source churn here).
- All `@arkecosystem/*` and `@protokol/utils` versions.
- CI workflows (Plan 003), README/scripts/devcontainer/renovate (Plan 004).
- ESM/export-maps: packages keep `"main": "dist/index"`, `module: commonjs`,
  `moduleResolution: node` — the ARK core 3.x plugin loader requires CJS.

## Git workflow

- Branch: `advisor/002-toolchain-node24`
- Commit per step; conventional commits, e.g.
  `chore(deps): update typescript to v5.9`, `chore: migrate eslint to flat config`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Inline the tsconfig preset and raise target to ES2022

Rewrite root `tsconfig.json` to a fully explicit config (drop `"extends"`):

```json
{
    "compilerOptions": {
        "target": "es2022",
        "lib": ["es2022", "dom"],
        "module": "commonjs",
        "moduleResolution": "node",
        "declaration": true,
        "emitDecoratorMetadata": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,
        "experimentalDecorators": true,
        "forceConsistentCasingInFileNames": true,
        "newLine": "lf",
        "noEmitOnError": true,
        "noFallthroughCasesInSwitch": true,
        "noImplicitAny": false,
        "noImplicitOverride": true,
        "noImplicitReturns": true,
        "noUncheckedIndexedAccess": true,
        "noPropertyAccessFromIndexSignature": false,
        "noUnusedLocals": false,
        "noUnusedParameters": false,
        "outDir": "dist",
        "pretty": true,
        "resolveJsonModule": true,
        "skipLibCheck": true,
        "sourceMap": true,
        "strict": true,
        "stripInternal": true,
        "useDefineForClassFields": true
    },
    "exclude": ["dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

Key detail: `noImplicitOverride`, `noUncheckedIndexedAccess`,
`useDefineForClassFields`, `allowSyntheticDefaultImports` are frozen
behavior inherited from `@sindresorhus/tsconfig@2` — do not drop them.
`noImplicitAny: false`, `noPropertyAccessFromIndexSignature: false`,
`noUnusedLocals: false`, `noUnusedParameters: false` are deliberate relaxations — keep.
Apply the same compiler-option block to `tsconfig.eslint.json` (keep its
`exclude: ["dist"]`). Match each file's existing tab indentation.

**Verify**: `grep -n "extends" tsconfig.json tsconfig.eslint.json` → no matches.

### Step 2: Bump TypeScript and types

In all 5 manifests: `typescript` → `~5.9.3` (re-check with
`npm view typescript@5 version | tail -1` and use the highest 5.x), remove
`@sindresorhus/tsconfig` entirely, `@types/node` → `^24.0.0`, `@types/jest`
→ `^30.0.0` (fallback `^29.2.6` if the 30 line doesn't exist when you run),
remove `@types/rimraf` (rimraf 6 ships its own types).

**Verify**: `pnpm install` exit 0; `pnpm exec tsc --version` → `5.9.x`.

### Step 3: Build against TS 5.9

`pnpm build`

**Verify**: exit 0, `dist/` regenerated. If errors appear and each fix is a
one-token type mapping, you may fix them as long as ALL fixes are confined to
type annotations that don't change runtime behavior — but the expectation for
this repo is a clean build; >10 errors means STOP per the conditions below.

### Step 4: Upgrade Jest stack

In all five manifests: `jest` → `^30.5.1`, `ts-jest` → `^29.4.12`,
`jest-extended` → `^7.0.0`. Remove the `~27/~0.11.5` variants wherever pinned.

Edit root `jest.config.js`:
- `setupFilesAfterEnv: ["jest-extended/all"]`
- `transform: { "^.+\\.tsx?$": ["ts-jest", {}] }`
- delete the `globals` block entirely (ts-jest 29 removed `globals['ts-jest']`)
Leave every other key as-is.

Make the identical edit (three keys) in `packages/nameservice-crypto/jest.config.js`,
`packages/nameservice-transactions/jest.config.js`, `packages/nameservice-api/jest.config.js`
(all three also set `setupFilesAfterEnv`).

In the 6 test files listed in Current state, change line 1:
`import "jest-extended";` → `import "jest-extended/all";`

**Verify**: `pnpm install` exit 0 (watch for peer warnings about
jest-extended/jest — jest-extended 7 declares compatibility with modern Jest).

### Step 5: Run the tests

`pnpm test:unit`

**Verify**: exit 0 with all suites passing and crypto's 100% coverage
thresholds intact. Flag any suite that hangs or leaks handles (the suites still
run under `--forceExit`, which is being KEPT on purpose — the ARK core test
framework holds open connections).

### Step 6: ESLint 9 flat config

devDependency changes (where present, per manifest):
- add root: `eslint@^9.39.0` (re-check latest 9.x; do NOT jump to eslint 10),
  `@eslint/js`, `typescript-eslint@^8.70.0`, `eslint-plugin-jest@^29.0.0`,
  `eslint-plugin-prettier@^5.0.0`, `eslint-config-prettier@^10.0.0`,
  `eslint-plugin-simple-import-sort@^14.0.0`, `prettier@^3.9.6`
- remove: `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`,
  `eslint@^7`, `eslint-config-prettier@^8`, `eslint-plugin-jest@^25`,
  `eslint-plugin-prettier@^4`, `eslint-plugin-simple-import-sort@^7`,
  `prettier@2.x`, `@types/eslint`, `@types/eslint-plugin-prettier`, `@types/prettier`

Create `eslint.config.mjs` at repo root:

```js
// @ts-check
import eslint from "@eslint/js";
import jest from "eslint-plugin-jest";
import prettier from "eslint-plugin-prettier";
import sortImports from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["**/dist/**", "**/.coverage/**", "**/node_modules/**"] },
    eslint.configs.recommended,
    tseslint.configs.recommended,
    tseslint.configs.recommendedTypeChecked,
    {
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.eslint.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    { plugins: { jest, prettier } },
    {
        files: ["packages/**/__tests__/**/*.ts"],
        plugins: { jest },
        extends: [jest.configs["flat/recommended"]],
    },
    {
        rules: {
            "prettier/prettier": "error",
            "prefer-const": ["error", { destructuring: "all" }],
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            // parity with .eslintrc.json — keep these relaxed:
            "@typescript-eslint/ban-ts-comment": "off",
            "@typescript-eslint/no-empty-interface": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-var-requires": "off",
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/restrict-plus-operands": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/naming-convention": "off",
            "@typescript-eslint/ban-types": "off",
        },
    }
);
```

Clarifications for the executor:
- `.eslintrc.json` disabled `@typescript-eslint/ban-types`; in typescript-eslint 8
  that rule was retired in favor of `@typescript-eslint/no-restricted-types` and
  `@typescript-eslint/no-empty-object-type`. If ESLint 9 errors on the unknown
  `ban-types` key, replace that one line with both of those set to `"off"`.
- `.eslintignore` contents must be folded into the `ignores` list above; read
  the file first, then delete it together with `.eslintrc.json` via
  `git rm .eslintrc.json .eslintignore`.
- Rewrite the root scripts:
  - `"lint": "eslint \"packages/*/src/**/*.ts\" --fix"` (ESLint 9 removed `--ext`)
  - `"lint:tests": "eslint \"packages/*/__tests__/**/*.ts\" --fix"`

**Verify**: `pnpm lint && pnpm lint:tests` exits 0 (allow warnings; no errors).

### Step 7: Prettier 3, typedoc 0.28, rimraf 6, drop codecov

In manifests where present:
- `prettier` → `^3.9.6` (`.prettierrc.json` needs no change: 4-space tabs,
  `printWidth: 120`, `trailingComma: "all"` are all still valid/premium in v3)
- `typedoc` → `~0.28.0` (or the latest 0.28.x from `npm view typedoc@0 version | tail -1`)
- `rimraf` → `^6.0.0` (usage is CLI-only: `rimraf .coverage dist tmp`)
- remove `codecov` devDependency and the `"coverage:report"` script from
  crypto, transactions and api packages (npm-side upload is dead; CI uses codecov-action)

**Verify**: `pnpm install` exit 0; `pnpm --filter @protokol/nameservice-crypto run build:docs`
exit 0 (delete the freshly generated `packages/nameservice-crypto/docs` afterwards,
it is untracked); `pnpm build` exit 0; `pnpm test:unit` still green after config churn.

## Test plan

- No new tests. Existing suites are the gate:
  - `pnpm test:unit` — all pass; expected: ≥2 suites in crypto, ≥3 in transactions, ≥3 in api.
  - Integration/functional suites are Postgres-backed; run them only if a
    Postgres instance is available locally (`pnpm run test:integration` in
    nameservice-api, `pnpm run test:functional` in nameservice-transactions),
    otherwise record in your report that they were skipped for environment reasons.
- Structural pattern to stay consistent with: the tests keep their current file
  layout — only the one-line `jest-extended` imports change.

## Done criteria

- [ ] `pnpm build` exits 0 on Node ≥24 with `tsc 5.9.x`
- [ ] `pnpm test:unit` exits 0
- [ ] `pnpm lint && pnpm lint:tests` exits 0
- [ ] `grep -n "extends" tsconfig.json tsconfig.eslint.json` → no matches
- [ ] `grep -rn "jest-extended" packages/*/package.json package.json | grep -v "jest-extended/all"` → only version entries `^7.0.0`
- [ ] `grep -rn "import \"jest-extended\"" packages/**/__tests__ -l` → no matches (all are `jest-extended/all`)
- [ ] `.eslintrc.json` and `.eslintignore` deleted; `eslint.config.mjs` exists
- [ ] No `coverage:report` script and no `codecov` devDependency in any manifest
- [ ] No files outside the in-scope list are modified (`git status`), except `pnpm-lock.yaml` and untracked `dist/`, `.coverage`, `docs/` artifacts
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- TS 5.9 produces more than 10 build errors that aren't mechanical (i.e. need
  runtime-logic changes) — report the error list.
- Any unit suite fails an assertion (not a config/import error) after the Jest
  upgrade — report the first failure verbatim.
- ESLint 9 flat config reports more than ~20 lint errors in `packages/**/src/**`
  that would require source edits to satisfy — report instead of editing sources.
- A peer/compat conflict makes `pnpm install` unable to proceed with the exact
  locked `@arkecosystem/core@3.0.0` versions.
- Discover the assumption "`@sindresorhus/tsconfig@2` contributes exactly
  `noImplicitOverride`, `noUncheckedIndexedAccess`, `useDefineForClassFields`,
  and `allowSyntheticDefaultImports` beyond the root overrides" is false —
  report what actually differs.

## Maintenance notes

- TS 7 (native compiler) was deliberately NOT adopted: the repo requires
  `emitDecoratorMetadata`/legacy decorators for the ARK core-kernel DI at
  boot — that combination is not proven under ts-jest with TS 7. Re-evaluate
  after ARK Core 4.
- Keeping `moduleResolution: node` (classic) is load-bearing: ARK 3.x packages
  ship without `exports` maps; do not "modernize" it casually.
- The `--forceExit` on every jest invocation is deliberate (ARK core test
  framework leaves open handles). Removing it causes ungraceful test exits.
- When ARK CORE 4 / Node 25 arrives, re-run this plan's toolchain audit; the
  flat ESLint config makes future engine-bump edits trivial.
