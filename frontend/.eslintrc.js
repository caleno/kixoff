import type { ESLintConfig } from './.eslintrc.json';

// Frontend-specific ESLint config extends root config
// This file ensures frontend React code is linted properly

export default {
  ...ESLintConfig,
  parserOptions: {
    ...ESLintConfig.parserOptions,
    ecmaFeatures: { jsx: true }
  },
  plugins: [...ESLintConfig.plugins, 'react', 'react-hooks'],
  extends: [...ESLintConfig.extends, 'plugin:react/recommended', 'plugin:react-hooks/recommended'],
  settings: {
    react: { version: 'detect' }
  },
  rules: {
    ...ESLintConfig.rules,
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off'
  }
} as unknown as typeof ESLintConfig;
