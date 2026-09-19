import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  {
    ignores: [
      "**/.next/**",
      "**/node_modules/**",
      "**/out/**",
      "**/build/**",
      "**/*.config.{mjs,js,ts}",
      "**/next-env.d.ts",
      "**/.next/types/**",
      // Local tooling / scratch directories — not part of the app source.
      "**/.agents/**",
      "**/.claude/**",
      "**/.zcode/**",
      // Reference copy of the storefront design source.
      "**/newdesing/**",
    ],
  },
  // Flat-config adapter for the legacy Next.js shareable configs.
  // `next lint` shows a cosmetic "plugin not detected" warning under flat config,
  // but the rules ARE applied (e.g. @next/next/no-img-element fires correctly).
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "import/prefer-default-export": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
]

export default eslintConfig
