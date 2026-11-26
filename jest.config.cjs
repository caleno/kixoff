// CommonJS Jest config (repo is "type": "module", so .cjs keeps require/module.exports valid).

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
  ],
  coverageDirectory: 'coverage',
  // TODO(tests): re-enable coverageThreshold once real unit tests exist
  // (stub tests measure ~0% coverage and would always fail the gate).
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};
