import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';

export default defineConfig([
  { files: ['**/*.{js,ts}'], plugins: { js }, extends: ['js/recommended'] },
  {
    files: ['**/*.{js,ts}'],
    languageOptions: { globals: globals.node },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'import/order': ['error', { 'newlines-between': 'always' }],
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error'],
    },
  },
  {
    rules: prettierConfig.rules,
  },
  tseslint.configs.recommended,
  { files: ['**/*.json'], plugins: { json }, language: 'json/json', extends: ['json/recommended'] },
]);
