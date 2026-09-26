module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  extends: ['eslint:recommended', 'react-app', 'react-app/jest'],
  rules: {
    'no-unused-vars': 'off',
  },
};
