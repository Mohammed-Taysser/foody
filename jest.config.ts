import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // 👈 this resolves "@/..."
  },
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
};

export default config;
