// @ts-check
import eslint from "@eslint/js";
import jest from "eslint-plugin-jest";
import prettier from "eslint-plugin-prettier";
import sortImports from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default tseslint.config(
    // .eslintignore parity: /__tests__/**/*.spec.ts, /__tests__/unit/coverage/,
    // /*.js, /build/, /config/, /dist/, /docs/, /node_modules/**, env.json
    {
        ignores: [
            "**/dist/**",
            "**/.coverage/**",
            "**/node_modules/**",
            "**/__tests__/**/*.spec.ts",
            "**/__tests__/unit/coverage/**",
            "**/build/**",
            "**/config/**",
            "**/docs/**",
            "**/env.json",
            "*.js",
        ],
    },
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
    { plugins: { jest, prettier, "simple-import-sort": sortImports } },
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
            "@typescript-eslint/no-restricted-types": "off",
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/no-empty-interface": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-misused-promises": "off",
            "@typescript-eslint/no-redundant-type-constituents": "off",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/restrict-plus-operands": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/naming-convention": "off",
        },
    }
);
