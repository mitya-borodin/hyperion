module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
    jest: true,
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2021, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
  },
  plugins: ["@typescript-eslint", "import", "unused-imports"],
  settings: {
    "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
  },
  rules: {
    // import format rules
    "import/no-duplicates": "warn",
    "import/order": [
      "warn",
      {
        alphabetize: { order: "asc", caseInsensitive: true },
        "newlines-between": "always",
        groups: ["builtin", "external", "internal", "parent", "index", "sibling", "unknown"],
        pathGroups: [],
        pathGroupsExcludedImportTypes: [],
      },
    ],
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    "linebreak-style": ["warn", require("os").EOL === "\r\n" ? "windows" : "unix"],
    "no-constant-condition": "off",
  },
  overrides: [
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Object.assign(require("eslint-plugin-jest").configs.recommended, {
      files: ["__tests__", "**/*.spec.ts", "**/*.spec.tsx", "**/*.test.ts"],
      env: {
        jest: true,
      },
      plugins: ["jest"],
      rules: {
        "jest/expect-expect": ["error", { assertFunctionNames: ["expect", "assertExpectations"] }],
      },
    }),
  ],
};
