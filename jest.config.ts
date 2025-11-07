import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';

import tsconfig from './tsconfig.json';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
  clearMocks: true,
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/__tests__/jest.setup.ts'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 90,
      statements: 90,
    },
  },
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    String.raw`/src/.*\.d\.ts$`, // excludes all *.d.ts files in src
    String.raw`/__tests__/.*\.ts$`, // excludes all test files
    '/src/config.ts',
    'src/apps/prisma.ts',
    'src/utils/errors.utils.ts',
  ],
  watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
};

export default config;
