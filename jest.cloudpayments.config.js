const nextJest = require('next/jest');

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        // Handle module aliases (this will be automatically configured for you soon)
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testEnvironment: 'node', // Use Node.js environment for CloudPayments tests
    preset: 'ts-jest',
    testPathIgnorePatterns: [
        '<rootDir>/src/test/database.test.ts',
        '<rootDir>/src/utils/spec/',
        '<rootDir>/src/utils/rewriteSlide.test.ts',
        '<rootDir>/src/services/llm/gigaChat/',
    ],
    // Only run CloudPayments tests
    testMatch: [
        '<rootDir>/src/test/cloudpayments/**/*.test.ts',
        '<rootDir>/src/test/cloudpayments/**/*.test.tsx',
    ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig); 