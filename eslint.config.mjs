import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    "build/**",
    "dist/**",
    "legacy-static/**",
  ]),
]);

export default eslintConfig;
