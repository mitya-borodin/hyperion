module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:unicorn/all',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['bin/**'],
  plugins: ['@typescript-eslint', 'unicorn', 'import', 'unused-imports'],
  settings: {
    'import/extensions': ['.ts'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  rules: {
    'linebreak-style': ['warn', require('os').EOL === '\r\n' ? 'windows' : 'unix'],

    'import/no-duplicates': 'warn',
    'import/order': [
      'warn',
      {
        alphabetize: { order: 'asc', caseInsensitive: true },
        'newlines-between': 'always',
        groups: ['builtin', 'external', 'internal', 'parent', 'index', 'sibling', 'unknown'],
        pathGroups: [],
        pathGroupsExcludedImportTypes: [],
      },
    ],

    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'objectLiteralProperty',
        format: ['camelCase', 'snake_case', 'StrictPascalCase', 'UPPER_CASE'],
      },
      {
        selector: 'objectLiteralProperty',
        modifiers: ['requiresQuotes'],
        format: null,
      },
      {
        selector: ['class', 'interface', 'typeAlias'],
        format: ['StrictPascalCase'],
      },
    ],

    'unicorn/filename-case': [
      'error',
      {
        cases: {
          kebabCase: true,
          pascalCase: true,
          snakeCase: true,
          camelCase: true,
        },
      },
    ],
    /**
     * Вставляет 0 в .toFixed(), хотя нам нужно именно без аргумента
     */
    'unicorn/require-number-to-fixed-digits-argument': 'off',
    /**
     * @TODO: Решить или выключить в будущем.
     */
    'unicorn/prevent-abbreviations': 'warn',
    'unicorn/consistent-destructuring': 'warn',
    'unicorn/no-array-reduce': 'warn',
    'unicorn/no-keyword-prefix': 'warn',
    'unicorn/no-null': 'warn',
    'unicorn/prefer-module': 'warn',
    'unicorn/text-encoding-identifier-case': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    'unicorn/numeric-separators-style': 'warn',
    'unicorn/no-useless-undefined': 'warn',
    'unicorn/prefer-at': 'warn',
    'unicorn/no-array-for-each': 'warn',
    'unicorn/prefer-spread': 'warn',
    'unicorn/prefer-node-protocol': 'warn',
    'unicorn/import-style': 'warn',
    'unicorn/prefer-type-error': 'warn',
    'unicorn/no-process-exit': 'warn',
    'unicorn/no-array-callback-reference': 'warn',
    'unicorn/prefer-top-level-await': 'warn',
    'unicorn/prefer-optional-catch-binding': 'warn',
    'unicorn/prefer-reflect-apply': 'warn',
    'unicorn/no-lonely-if': 'warn',
    'unicorn/prefer-number-properties': 'warn',
    'unicorn/prefer-switch': 'warn',
    'unicorn/consistent-function-scoping': 'warn',
    'unicorn/prefer-string-slice': 'warn',
    'unicorn/no-hex-escape': 'warn',
    'unicorn/better-regex': 'warn',
    'unicorn/escape-case': 'warn',
    'unicorn/prefer-array-find': 'warn',

    eqeqeq: [
      'error',
      'always',
      {
        null: 'ignore',
      },
    ],
    quotes: [
      'error',
      'single',
      {
        avoidEscape: true,
      },
    ],
    'comma-dangle': ['error', 'always-multiline'],
    curly: 'error',
    'newline-before-return': 'error',
    'padding-line-between-statements': ['error', { blankLine: 'always', prev: 'if', next: '*' }],
    'max-len': ['error', 120],
    'no-lonely-if': 'error',
    'object-shorthand': ['error', 'always'],
    'prefer-destructuring': 'error',
    'prefer-template': 'error',
  },
  overrides: [
    Object.assign(require('eslint-plugin-jest').configs.recommended, {
      files: ['__tests__', '**/*.spec.ts', '**/*.test.ts'],
      env: {
        jest: true,
      },
      plugins: ['jest'],
      rules: {
        'jest/expect-expect': ['error', { assertFunctionNames: ['expect', 'assertExpectations'] }],
      },
    }),
  ],
};
