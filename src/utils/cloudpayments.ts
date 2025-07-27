import { SubscriptionInterval } from '@prisma/client';

/**
 * Create a CloudPayments subscription with a future start date
 */
export async function createCloudPaymentsSubscription(params: {
    amount: number;
    currency: string;
    interval: SubscriptionInterval;
    startDate: Date;
    accountId: string;
    description: string;
    receipt?: any;
}): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
        const { amount, currency, interval, startDate, accountId, description, receipt } = params;

        // Get CloudPayments credentials
        const publicId = process.env.CLOUDPAYMENTS_PUBLIC_ID;
        const secretKey = process.env.CLOUDPAYMENTS_SECRET_KEY;

        if (!publicId || !secretKey) {
            throw new Error('CloudPayments credentials not configured');
        }

        // Create auth token
        const authToken = Buffer.from(`${publicId}:${secretKey}`).toString('base64');

        // Get interval configuration
        const intervalConfig = getCloudPaymentsInterval(interval);

        // Prepare subscription data
        const subscriptionData = {
            Amount: amount,
            Currency: currency.toUpperCase(),
            Interval: intervalConfig.interval,
            Period: intervalConfig.period,
            MaxPeriods: undefined, // Unlimited
            StartDate: startDate.toISOString(),
            AccountId: accountId,
            Description: description,
            Email: '', // Will be filled by CloudPayments from account
            RequireConfirmation: false,
            CultureName: 'ru-RU',
            ...(receipt && { CustomerReceipt: receipt }),
        };

        console.log('Creating CloudPayments subscription with data:', subscriptionData);

        // Call CloudPayments API
        const response = await fetch('https://api.cloudpayments.ru/subscriptions/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authToken}`,
            },
            body: JSON.stringify(subscriptionData),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('CloudPayments API error:', responseData);
            throw new Error(responseData.Message || 'Failed to create CloudPayments subscription');
        }

        if (responseData.Success) {
            console.log('CloudPayments subscription created successfully:', responseData.Model);
            return {
                success: true,
                subscriptionId: responseData.Model.Id,
            };
        } else {
            console.error('CloudPayments subscription creation failed:', responseData);
            return {
                success: false,
                error: responseData.Message || 'Unknown error',
            };
        }
    } catch (error) {
        console.error('Error creating CloudPayments subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Get CloudPayments recurrent interval from subscription interval
 */
export function getCloudPaymentsInterval(interval: SubscriptionInterval): {
    period: number;
    interval: 'Day' | 'Week' | 'Month';
} {
    switch (interval) {
        case SubscriptionInterval.monthly:
            return { period: 1, interval: 'Month' };
        case SubscriptionInterval.quarterly:
            return { period: 3, interval: 'Month' };
        case SubscriptionInterval.semiannual:
            return { period: 6, interval: 'Month' };
        case SubscriptionInterval.daily:
            return { period: 1, interval: 'Day' };
        default:
            return { period: 1, interval: 'Month' };
    }
}

/**
 * Cancel a CloudPayments subscription
 */
export async function cancelCloudPaymentsSubscription(subscriptionId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const publicId = process.env.CLOUDPAYMENTS_PUBLIC_ID;
        const secretKey = process.env.CLOUDPAYMENTS_SECRET_KEY;

        if (!publicId || !secretKey) {
            throw new Error('CloudPayments credentials not configured');
        }

        const authToken = Buffer.from(`${publicId}:${secretKey}`).toString('base64');

        const response = await fetch(`https://api.cloudpayments.ru/subscriptions/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${authToken}`,
            },
            body: JSON.stringify({
                Id: subscriptionId,
            }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('CloudPayments cancel error:', responseData);
            throw new Error(responseData.Message || 'Failed to cancel CloudPayments subscription');
        }

        if (responseData.Success) {
            console.log('CloudPayments subscription cancelled successfully');
            return { success: true };
        } else {
            console.error('CloudPayments subscription cancellation failed:', responseData);
            return {
                success: false,
                error: responseData.Message || 'Unknown error',
            };
        }
    } catch (error) {
        console.error('Error cancelling CloudPayments subscription:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
} 