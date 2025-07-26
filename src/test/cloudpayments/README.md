# CloudPayments Test Suite

This comprehensive test suite verifies the functionality of CloudPayments webhook handling for both token purchases and recurring subscription payments.

## Overview

The test suite covers:
- ✅ Token purchase payments (check, pay, fail handlers)
- ✅ Recurring subscription payments (check, pay, recurrent handlers)
- ✅ Complete payment flows and integration scenarios
- ✅ Edge cases and error handling
- ✅ Performance and load testing
- ✅ Security and data validation

## Test Structure

### Core Files

- **`webhookTestUtils.ts`** - Utilities for creating mock webhook requests and test data
- **`databaseTestHelpers.ts`** - Database setup, teardown, and helper functions
- **`runTests.ts`** - Test runner script with database management

### Test Suites

1. **`tokenPurchase.test.ts`** - Token purchase payment flows
   - Check handler validation
   - Pay handler processing
   - Fail handler error scenarios
   - Integration flows (check → pay → success)
   - Edge cases and duplicate handling

2. **`subscriptionPayments.test.ts`** - Subscription payment flows
   - Check handler validation for subscriptions
   - Pay handler for initial subscription payments
   - Recurrent notification handling
   - Subscription lifecycle management
   - Status transitions (Active → PastDue → Cancelled)

3. **`integrationTests.test.ts`** - Cross-platform and complete flows
   - Simultaneous token and subscription payments
   - Webhook routing verification
   - Complete payment lifecycles
   - Error recovery scenarios
   - Concurrent processing

4. **`edgeCases.test.ts`** - Edge cases and error scenarios
   - Malformed webhook data
   - Database edge cases
   - Timing and race conditions
   - Data validation edge cases
   - Security scenarios
   - Memory and resource management

## CloudPayments Webhook Types

Based on the [CloudPayments documentation](https://developers.cloudpayments.ru/#uvedomleniya), the following webhook types are tested:

### Standard Webhooks
- **Check** - Payment validation (code 0 = accept, other codes = reject)
- **Pay** - Successful payment notification
- **Fail** - Failed payment notification
- **Confirm** - Payment confirmation (for two-stage payments)
- **Refund** - Refund notification
- **Cancel** - Payment cancellation

### Recurring Webhooks
- **Recurrent** - Recurring subscription status updates
  - Status values: `Active`, `PastDue`, `Cancelled`, `Rejected`, `Expired`

## Test Data Structures

### Token Purchase Test Data
```typescript
interface TokenPurchaseTestData {
    purchaseId: string;
    userId: string;
    packageId: string;
    amount: number;
    currency: string;
    transactionId?: string;
    status?: 'Completed' | 'Declined' | 'Authorized';
    testMode?: boolean;
}
```

### Subscription Test Data
```typescript
interface SubscriptionTestData {
    subscriptionId: string;
    userId: string;
    planId: string;
    amount: number;
    currency: string;
    transactionId?: string;
    status?: 'Completed' | 'Declined' | 'Authorized';
    testMode?: boolean;
    cloudpaymentsId?: string;
}
```

### Recurrent Notification Data
```typescript
interface RecurrentNotificationTestData {
    cloudpaymentsId: string;
    userId: string;
    status: 'Active' | 'PastDue' | 'Cancelled' | 'Rejected' | 'Expired';
    amount: number;
    currency: string;
    successfulTransactions?: number;
    failedTransactions?: number;
    lastTransactionDate?: string;
    nextTransactionDate?: string;
    testMode?: boolean;
}
```

## Running Tests

### All Tests
```bash
npm run test:cloudpayments
# or
tsx src/test/cloudpayments/runTests.ts
```

### Specific Test Suites
```bash
# Token purchase tests only
tsx src/test/cloudpayments/runTests.ts --suite=token

# Subscription tests only
tsx src/test/cloudpayments/runTests.ts --suite=subscription

# Integration tests only
tsx src/test/cloudpayments/runTests.ts --suite=integration

# Edge case tests only
tsx src/test/cloudpayments/runTests.ts --suite=edge

# Utility tests only
tsx src/test/cloudpayments/runTests.ts --suite=utils
```

### Individual Test Files
```bash
# Run specific test file
jest src/test/cloudpayments/tokenPurchase.test.ts --verbose

# Run with watch mode
jest src/test/cloudpayments/tokenPurchase.test.ts --watch

# Run with coverage
jest src/test/cloudpayments/ --coverage
```

## Test Scenarios Covered

### Token Purchase Flow
1. **Check Notification**: Validates purchase exists and user is valid
2. **Pay Notification**: Processes successful payment, adds tokens to balance
3. **Fail Notification**: Handles payment failures, updates purchase status

### Subscription Flow
1. **Check Notification**: Validates subscription and user
2. **Pay Notification**: Activates subscription, creates payment record
3. **Recurrent Notifications**: Handles ongoing subscription status updates

### Integration Scenarios
- Simultaneous token and subscription payments
- Webhook routing based on presence of `SubscriptionId`
- Complete payment lifecycles with multiple webhook types
- Error recovery and resilience testing

### Edge Cases
- Malformed webhook data
- Database connection failures
- Race conditions and concurrent processing
- Invalid data validation
- Security attack simulations
- Memory pressure testing

## Database Management

Tests use isolated database transactions and comprehensive cleanup:

```typescript
// Setup test scenario
const scenario = await setupTokenPurchaseTestScenario();

try {
    // Run tests...
} finally {
    // Automatic cleanup
    await scenario.cleanup();
}
```

### Cleanup Strategy
- Tests create isolated test data
- Automatic cleanup after each test
- Proper foreign key handling
- Transaction rollback on failures

## Mocking Strategy

### Webhook Requests
- FormData-based request simulation
- Proper CloudPayments webhook format
- Support for additional JSON data

### Database Operations
- Selective mocking for error scenarios
- Transaction failure simulation
- Connection timeout testing

### External Dependencies
- CloudPayments API responses
- Email service calls
- File system operations

## Performance Considerations

### Load Testing
- High-volume webhook processing (20+ concurrent)
- Memory pressure simulation
- Database connection pooling
- Response time validation (<2s for normal operations)

### Optimization
- Parallel test execution where possible
- Database connection reuse
- Efficient cleanup operations
- Memory-conscious test data generation

## Security Testing

### Input Validation
- SQL injection attempts
- XSS payload handling
- Path traversal attempts
- Null byte injection
- LDAP injection attempts

### Data Sanitization
- Large payload handling
- Invalid JSON parsing
- Malformed form data
- Suspicious user agents

## Error Handling

### Database Errors
- Connection failures
- Constraint violations
- Transaction rollbacks
- Timeout scenarios

### Application Errors
- Invalid webhook data
- Missing required fields
- Business logic violations
- External service failures

## CI/CD Integration

### Environment Setup
```bash
# Set test environment
export NODE_ENV=test

# Database setup (if needed)
npm run db:setup:test

# Run tests
npm run test:cloudpayments
```

### Test Reports
- Jest generates detailed test reports
- Coverage reports available
- Performance metrics logged
- Error details captured

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check database is running
   # Verify connection string
   # Run database migrations
   ```

2. **Test Timeouts**
   ```bash
   # Increase Jest timeout
   # Check for hanging database connections
   # Verify cleanup functions
   ```

3. **Mock Failures**
   ```bash
   # Check mock implementations
   # Verify mock restoration
   # Review test isolation
   ```

### Debug Mode
```bash
# Run with debug output
DEBUG=cloudpayments:* npm run test:cloudpayments

# Run single test with debugging
jest src/test/cloudpayments/tokenPurchase.test.ts --verbose --no-cache
```

## Contributing

### Adding New Tests
1. Follow existing test structure
2. Use provided test utilities
3. Include proper cleanup
4. Add documentation
5. Update this README

### Test Naming Conventions
- Descriptive test names
- Group related tests in `describe` blocks
- Use consistent naming patterns
- Include expected behavior in test names

### Best Practices
- Test one thing at a time
- Use meaningful assertions
- Include both positive and negative cases
- Mock external dependencies
- Clean up after tests
- Document complex test scenarios

## References

- [CloudPayments Webhook Documentation](https://developers.cloudpayments.ru/#uvedomleniya)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Next.js API Testing](https://nextjs.org/docs/testing) 