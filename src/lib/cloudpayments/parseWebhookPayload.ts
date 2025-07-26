import { NextRequest } from 'next/server';

export interface CloudPaymentsWebhookData {
    TransactionId: string;
    Amount: string;
    Currency: string;
    PaymentAmount: string;
    PaymentCurrency: string;
    OperationType: string;
    InvoiceId: string;
    AccountId: string;
    Status: string;
    Description: string;
    TestMode: string;
    Data: string;
    DateTime: string;
    SubscriptionId?: string;
    RecurrenceType?: string;
}

export async function parseWebhookPayload(request: NextRequest): Promise<{
    webhookData: CloudPaymentsWebhookData;
    paymentData: Record<string, any>;
}> {
    const formData = await request.formData();

    const webhookData: CloudPaymentsWebhookData = {
        TransactionId: String(formData.get('TransactionId') || ''),
        Amount: String(formData.get('Amount') || ''),
        Currency: String(formData.get('Currency') || ''),
        PaymentAmount: String(formData.get('PaymentAmount') || ''),
        PaymentCurrency: String(formData.get('PaymentCurrency') || ''),
        OperationType: String(formData.get('OperationType') || ''),
        InvoiceId: String(formData.get('InvoiceId') || ''),
        AccountId: String(formData.get('AccountId') || ''),
        Status: String(formData.get('Status') || ''),
        Description: String(formData.get('Description') || ''),
        TestMode: String(formData.get('TestMode') || ''),
        Data: String(formData.get('Data') || ''),
        DateTime: String(formData.get('DateTime') || ''),
        SubscriptionId: formData.get('SubscriptionId')
            ? String(formData.get('SubscriptionId'))
            : undefined,
        RecurrenceType: formData.get('RecurrenceType')
            ? String(formData.get('RecurrenceType'))
            : undefined,
    };

    let paymentData: Record<string, any> = {};
    if (webhookData.Data) {
        try {
            paymentData = JSON.parse(webhookData.Data);
        } catch {
            // ignore parsing errors
        }
    }

    return { webhookData, paymentData };
}
