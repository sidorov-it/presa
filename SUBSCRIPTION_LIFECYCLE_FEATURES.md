# Subscription Lifecycle Features

This document describes the new subscription lifecycle management features that have been implemented to support various subscription scenarios.

## Overview

The system now supports the following subscription lifecycle scenarios:

1. **Active subscription – user wants to change the plan**
2. **Expired subscription – user wants to renew**
3. **Cancelled subscription – user wants to resume**
4. **Scheduling future subscription changes**

## Database Schema Changes

### New Fields in UserSubscription Model

```prisma
model UserSubscription {
  // ... existing fields ...
  
  // Plan change tracking
  nextPlanId       String?           @db.ObjectId // References SubscriptionPlan for future plan change
  nextPlanStartDate DateTime?        // When the new plan should start
  
  // ... rest of existing fields ...
}
```

### Migration

A new migration file `010-add-plan-change-fields.ts` has been created to add these fields to the database.

## API Endpoints

### 1. Change Subscription Plan

**Endpoint:** `POST /api/subscriptions/change`

**Request Body:**
```typescript
{
  newPlanId: string;
  startImmediately?: boolean; // If true, change plan immediately; if false, schedule for end of current period
}
```

**Response:**
```typescript
{
  success: boolean;
  subscriptionId?: string;
  message?: string;
  error?: string;
}
```

### 2. Resume Subscription

**Endpoint:** `POST /api/subscriptions/resume`

**Request Body:**
```typescript
{
  planId?: string; // Optional - if not provided, will use the same plan
}
```

**Response:**
```typescript
{
  success: boolean;
  subscriptionId?: string;
  message?: string;
  error?: string;
}
```

## Utility Functions

### CloudPayments Integration

New utility functions have been added to `src/utils/cloudpayments.ts`:

- `createCloudPaymentsSubscription()` - Creates subscriptions with future start dates
- `cancelCloudPaymentsSubscription()` - Cancels existing subscriptions
- `getCloudPaymentsInterval()` - Maps subscription intervals to CloudPayments format

### Subscription Management

New functions added to `src/utils/subscriptions.ts`:

- `changeSubscriptionPlan()` - Main function for changing subscription plans
- `changePlanImmediately()` - Handles immediate plan changes
- `schedulePlanChange()` - Handles scheduled plan changes
- `resumeSubscription()` - Resumes cancelled subscriptions

## UI Components

### PlanChangeModal

A new modal component (`src/components/subscriptions/PlanChangeModal/`) that allows users to:

- View current subscription plan
- Select a new plan from available options
- Choose between immediate or scheduled plan change
- See upgrade/downgrade notices

### Updated SubscriptionManagement

The existing `SubscriptionManagement` component has been enhanced with:

- "Change Plan" button for active subscriptions
- Integration with the new PlanChangeModal
- Support for plan change functionality

## Webhook Handling

The CloudPayments webhook handler (`src/lib/cloudpayments/handlers/pay.ts`) has been updated to:

- Detect scheduled plan changes
- Activate new plans when scheduled start date is reached
- Cancel old subscriptions when new plans are activated
- Handle future subscription activations properly

## TypeScript Types

New types have been added to `src/types/subscriptions.ts`:

```typescript
export interface ChangeSubscriptionRequest {
    newPlanId: string;
    startImmediately?: boolean;
}

export interface ChangeSubscriptionResponse {
    success: boolean;
    subscriptionId?: string;
    message?: string;
    error?: string;
}
```

## Usage Examples

### 1. Active Subscription - Change Plan

```typescript
// User has active subscription and wants to change plan
const result = await changeSubscriptionPlan(userId, newPlanId, false);
// This schedules the plan change for the end of current period
```

### 2. Immediate Plan Change

```typescript
// User wants to change plan immediately
const result = await changeSubscriptionPlan(userId, newPlanId, true);
// This cancels current subscription and creates new one immediately
```

### 3. Resume Cancelled Subscription

```typescript
// User wants to resume cancelled subscription
const result = await resumeSubscription(userId, planId);
// This creates a new subscription with the specified plan
```

## CloudPayments Integration

The system now supports creating CloudPayments subscriptions with future start dates:

1. When a user schedules a plan change, a new CloudPayments subscription is created with a future start date
2. CloudPayments will automatically send `/check` and `/pay` webhooks when the start date is reached
3. The webhook handler detects scheduled changes and activates the new plan
4. The old subscription is automatically cancelled

## Error Handling

All new functions include comprehensive error handling:

- Validation of user permissions and subscription status
- Proper error messages for different failure scenarios
- Rollback mechanisms for failed operations
- Logging for debugging and monitoring

## Testing

The implementation includes:

- Type safety with TypeScript
- Proper error handling and validation
- Integration with existing subscription management
- Backward compatibility with existing functionality

## Future Enhancements

Potential future improvements:

1. **Plan Comparison UI** - Show detailed comparison between plans
2. **Proration Support** - Handle partial billing periods
3. **Bulk Operations** - Support for changing multiple subscriptions
4. **Audit Trail** - Track all subscription changes
5. **Email Notifications** - Notify users of scheduled changes

## Security Considerations

- All endpoints require authentication
- User can only modify their own subscriptions
- Proper validation of plan IDs and subscription status
- Rate limiting on API endpoints
- Audit logging for all changes 