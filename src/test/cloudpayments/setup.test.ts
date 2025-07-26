import { describe, test, expect } from '@jest/globals';

describe('CloudPayments Test Setup', () => {
    test('should be able to run tests in cloudpayments directory', () => {
        expect(true).toBe(true);
    });

    test('should have access to basic test utilities', () => {
        // Test that we can import basic utilities
        expect(() => {
            require('./databaseTestHelpers');
        }).not.toThrow();
    });

    test('should have access to CloudPayments types', () => {
        // Test that we can import types
        expect(() => {
            require('@/lib/cloudpayments/parseWebhookPayload');
        }).not.toThrow();
    });
}); 