const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/', 'coverage/', 'public/js/bootstrap/bootstrap.bundle.min.js'] },
  js.configs.recommended,
  {
    languageOptions: { sourceType: 'module', globals: { ...globals.node, ...globals.jest, ...globals.browser } },
    rules: { eqeqeq: 'error', 'no-var': 'error', 'prefer-const': 'error' },
  },
];
