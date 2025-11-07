import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import checkFilePlugin from 'eslint-plugin-check-file';
import boundariesPlugin from 'eslint-plugin-boundaries';
import sonarjs from 'eslint-plugin-sonarjs';
import securityNode from 'eslint-plugin-security-node';

export default defineConfig([
  // Base JS rules
  {
    files: ['**/*.{js,ts}'],
    plugins: { js, sonarjs, 'security-node': securityNode },
    extends: ['js/recommended'],
    rules: {
      ...sonarjs.configs.recommended.rules,
      ...securityNode.configs.recommended.rules,
    },
  },

  // JSON linting
  { files: ['**/*.json'], plugins: { json }, language: 'json/json', extends: ['json/recommended'] },

  // TypeScript & Node.js setup
  {
    files: ['**/*.{js,ts}'],
    languageOptions: {
      globals: globals.node,
      // parserOptions: {
      //   project: './tsconfig.json', // 👈 path to your TS project
      //   tsconfigRootDir: import.meta.dirname, // ensure correct cwd
      // },
    },
    plugins: {
      import: importPlugin,
      prettier: prettierPlugin,
      'check-file': checkFilePlugin,
      boundaries: boundariesPlugin,
    },
    extends: [],
    settings: {
      'boundaries/elements': [
        { type: 'modules', pattern: 'src/modules/*' },
        { type: 'services', pattern: 'src/services/*' },
        { type: 'middleware', pattern: 'src/middleware/*' },
        { type: 'utils', pattern: 'src/utils/*' },
        { type: 'app', pattern: 'src/app.ts' },
      ],
      'boundaries/ignore': ['**/*.test.ts', '**/*.d.ts'], // optional
    },

    rules: {
      // Import organization
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // Prettier integration
      'prettier/prettier': 'error',

      // TypeScript unused vars
      '@typescript-eslint/no-unused-vars': ['error'],

      // Naming Conventions
      '@typescript-eslint/naming-convention': [
        'error',
        // Variables, functions, and parameters should be camelCase
        // {
        //   selector: ['function', 'parameter'],
        //   format: ['camelCase'],
        //   leadingUnderscore: 'allow', // allows _id, _next, etc.
        // },
        // Types, interfaces, and classes should be PascalCase
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        // Enum members should be UPPER_CASE
        // {
        //   selector: 'enumMember',
        //   format: ['UPPER_CASE'],
        // },
        // true constants (UPPER_CASE only when const + primitive literal)
        // {
        //   selector: 'variable',
        //   modifiers: ['const'],
        //   types: ['boolean', 'string', 'number'],
        //   format: ['UPPER_CASE'],
        // },
        // Private members should be camelCase
        // {
        //   selector: ['memberLike'],
        //   modifiers: ['private'],
        //   format: ['camelCase'],
        //   leadingUnderscore: 'require',
        // },
      ],

      // File Naming Convention: enforce kebab-case
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{ts,js}': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true, // allows `migration.config.js` etc.
        },
      ],

      // Folder Naming Convention: enforce kebab-case for src folders
      'check-file/folder-naming-convention': [
        'error',
        {
          // enforce kebab-case for modules, middleware, services, utils, etc.
          'src/**': 'KEBAB_CASE',
        },
      ],

      // Optional strict pattern for ERP module structure
      'check-file/folder-match-with-fex': [
        'error',
        {
          '**/src/modules/**/!(__tests__)/*.controller.ts':
            'src/modules/{module}/{name}.controller.ts',
          '**/src/modules/**/!(__tests__)/*.route.ts': 'src/modules/{module}/{name}.route.ts',
          '**/src/modules/**/!(__tests__)/*.validator.ts':
            'src/modules/{module}/{name}.validator.ts',
        },
      ],

      // Avoid circular dependencies
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'modules', allow: ['modules'] },
            { from: 'middleware', allow: ['modules', 'utils'] },
          ],
        },
      ],

      // Enforce module isolation
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // Each module can only import from itself
            {
              target: './src/modules/auth',
              from: './src/modules',
              except: ['./auth'],
            },
            {
              target: './src/modules/user',
              from: './src/modules',
              except: ['./user'],
            },
            {
              target: './src/modules/category',
              from: './src/modules',
              except: ['./category'],
            },
            {
              target: './src/modules/order',
              from: './src/modules',
              except: ['./order'],
            },
            // ...repeat for all your modules
          ],
        },
      ],
    },
  },

  // Extend Prettier compatibility
  { rules: prettierConfig.rules },

  // TypeScript recommended rules
  tseslint.configs.recommended,
]);
