#!/usr/bin/env tsx

/**
 * CloudPayments Test Runner
 *
 * This script runs all CloudPayments webhook tests with proper database setup.
 * It can be used in CI/CD environments or for local testing.
 *
 * Usage:
 *   npm run test:cloudpayments
 *   or
 *   tsx src/test/cloudpayments/runTests.ts
 */

import { execSync } from 'child_process';
import { prisma } from '@/lib/prisma';

const TEST_FILES = [
    'src/test/cloudpayments/setup.test.ts',
    'src/test/cloudpayments/tokenPurchase.test.ts',
    'src/test/cloudpayments/subscriptionPayments.test.ts',
    'src/test/cloudpayments/integrationTests.test.ts',
    'src/test/cloudpayments/edgeCases.test.ts',
];

async function runCloudPaymentsTests() {
    console.log('🚀 Starting CloudPayments Test Suite');
    console.log('=====================================\n');

    try {
        // Check database connection
        console.log('📊 Checking database connection...');
        await prisma.$connect();
        console.log('✅ Database connection successful\n');

        // Run tests
        console.log('🧪 Running CloudPayments tests...');
        console.log(`📁 Test files: ${TEST_FILES.length}`);
        console.log(`📝 Files: ${TEST_FILES.join(', ')}\n`);

        const testCommand = `jest --testPathPattern="src/test/cloudpayments" --verbose --detectOpenHandles --forceExit`;

        console.log(`🔧 Command: ${testCommand}\n`);

        execSync(testCommand, {
            stdio: 'inherit',
            env: {
                ...process.env,
                NODE_ENV: 'test',
            },
        });

        console.log('\n✅ All CloudPayments tests completed successfully!');
    } catch (error) {
        console.error('\n❌ CloudPayments tests failed:');
        console.error(error);
        process.exit(1);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up...');
        await prisma.$disconnect();
        console.log('✅ Cleanup completed');
    }
}

async function runSpecificTestSuite(suite: string) {
    const suiteMap: Record<string, string[]> = {
        setup: ['src/test/cloudpayments/setup.test.ts'],
        token: ['src/test/cloudpayments/tokenPurchase.test.ts'],
        subscription: ['src/test/cloudpayments/subscriptionPayments.test.ts'],
        integration: ['src/test/cloudpayments/integrationTests.test.ts'],
        edge: ['src/test/cloudpayments/edgeCases.test.ts'],
        utils: ['src/test/cloudpayments/webhookTestUtils.ts', 'src/test/cloudpayments/databaseTestHelpers.ts'],
    };

    const files = suiteMap[suite];
    if (!files) {
        console.error(`❌ Unknown test suite: ${suite}`);
        console.log(`Available suites: ${Object.keys(suiteMap).join(', ')}`);
        process.exit(1);
    }

    console.log(`🚀 Running ${suite} test suite`);
    console.log(`📁 Files: ${files.join(', ')}\n`);

    try {
        await prisma.$connect();

        const testCommand = `jest --testPathPattern="${files.join('|')}" --verbose --detectOpenHandles --forceExit`;
        execSync(testCommand, {
            stdio: 'inherit',
            env: {
                ...process.env,
                NODE_ENV: 'test',
            },
        });

        console.log(`\n✅ ${suite} test suite completed successfully!`);
    } catch (error) {
        console.error(`\n❌ ${suite} test suite failed:`);
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const suite = args.find(arg => arg.startsWith('--suite='))?.replace('--suite=', '');

if (suite) {
    runSpecificTestSuite(suite);
} else {
    runCloudPaymentsTests();
}

export { runCloudPaymentsTests, runSpecificTestSuite };
