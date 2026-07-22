import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Custom rule overrides with justifications
  {
    rules: {
      // Justification: Allow standard apostrophes and quotes in JSX text for readability without verbose escaping.
      "react/no-unescaped-entities": "off",
      // Justification: Allow using "any" in legacy mock/dynamic responses where the schema is open or external.
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
