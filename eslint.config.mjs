const { dirname } = require('node:path');

module.exports = {
  root: true,
  extends: ['next/core-web-vitals'],
  ignorePatterns: ['node_modules/**', '.next/**'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: dirname(__dirname),
  },
};
