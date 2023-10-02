module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ['airbnb', 'airbnb/hooks', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['react', 'react-hooks', '@typescript-eslint', 'react-refresh'],
  rules: {
    'react-refresh/only-export-components': 'warn',
    'react/display-name': 'off',
    'no-use-before-define': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'jsx-a11y/label-has-associated-control': 'warn',

    // base
    'guard-for-in': 'off', // disable for..in checks
    'arrow-body-style': 'off', // allow non-arrow body
    'no-console': 'off', // allow console.log
    'no-shadow': 'off', // fix for typescript https://stackoverflow.com/questions/63961803/eslint-says-all-enums-in-typescript-app-are-already-declared-in-the-upper-scope
    'no-plusplus': 'off', // allow ++ operator
    'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }], // allow single line class members
    'no-restricted-syntax': [
      // allow for...in for...of (airbnb)
      'error',
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    'prefer-destructuring': [
      // rewrite prefer-destructing rule for arrays AssignmentExpression
      'error',
      {
        VariableDeclarator: {
          array: false,
          object: true,
        },
        AssignmentExpression: {
          array: false,
          object: false,
        },
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
    // a11y
    'jsx-a11y/anchor-is-valid': 'off', // disable href check
    'jsx-a11y/no-autofocus': 'off', // disable autofocus rule
    // react
    'react/no-unescaped-entities': 'off',
    'react/function-component-definition': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
    'react/require-default-props': 'off', // disable default props
    'react/jsx-props-no-spreading': 'off', // allow spreading
    'react/react-in-jsx-scope': 'off',
    // typescript
    '@typescript-eslint/no-explicit-any': ['error'], // disallow any
    '@typescript-eslint/no-empty-function': 'off', // disable empty function check
    '@typescript-eslint/ban-ts-comment': 'off', // allow ts comments
    '@typescript-eslint/no-var-requires': 'off', // allow require syntax
    '@typescript-eslint/consistent-type-imports': [
      // add separate types import
      'error',
      {
        disallowTypeAnnotations: false,
        prefer: 'type-imports',
      },
    ],
    '@typescript-eslint/no-shadow': ['error'], // // fix for typescript https://stackoverflow.com/questions/63961803/eslint-says-all-enums-in-typescript-app-are-already-declared-in-the-upper-scope
    // import
    'import/prefer-default-export': 'off', // disable default export validation
    'import/no-mutable-exports': 'off', // disable mutable export validation
    'import/extensions': 'off', // disable extensions validation
    // TODO rules
    'import/no-unresolved': 'off',
    'import/order': [
      'warn',
      {
        alphabetize: { order: 'asc', caseInsensitive: true },
        'newlines-between': 'always',
        groups: ['builtin', 'external', 'internal', 'parent', 'index', 'sibling', 'unknown'],
      },
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
};
