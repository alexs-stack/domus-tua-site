import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Build output anywhere (es. worktree annidati creati dagli agenti sotto .claude/).
    "**/.next/**",
    ".claude/**",
    // Skill installate via skills CLI: codice di terzi, non del sito.
    ".agents/**",
    // Artefatti dei test di browser.
    "test-results/**",
    "playwright-report/**",
  ]),
  {
    // Test di browser: la `use()` delle fixture di Playwright non è un hook di React, ma la
    // regola la riconosce dal nome e la rifiuta. Qui React non c'è affatto.
    files: ["e2e/**/*.ts", "e2e-live/**/*.ts", "playwright*.config.ts"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
]);

export default eslintConfig;
