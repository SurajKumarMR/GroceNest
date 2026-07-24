
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  testTimeout: 30000, // Integration tests may be slow against a real DB
  testPathIgnorePatterns: [
    '/node_modules/',
    // Run migration test explicitly: npx jest --testPathPattern migration
    '<rootDir>/src/__tests__/integration/migration.test.ts',
  ],
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@scure|otplib|@otplib))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/services/**/*.ts',
    'src/utils/**/*.ts',
  ],
};