/* eslint-disable prettier/prettier */
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

export interface CloudPaymentsRecurrentWebhookData {
    Id: string; // Идентификатор подписки
    AccountId: string; // Идентификатор пользователя
    Description: string; // Назначение платежа
    Email: string; // E-mail плательщика
    Amount: number; // Сумма платежа
    Currency: string; // Валюта
    RequireConfirmation: boolean; // Двухстадийная схема
    StartDate: string; // Дата первого платежа UTC
    Interval: string; // Week, Month
    Period: number; // Период
    Status: string; // Статус подписки
    SuccessfulTransactionsNumber: number; // Количество успешных платежей
    FailedTransactionsNumber: number; // Количество неуспешных платежей
    MaxPeriods?: number; // Максимальное количество платежей
    LastTransactionDate?: string; // Дата последнего успешного платежа
    NextTransactionDate?: string; // Дата следующего платежа
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
        SubscriptionId: formData.get('SubscriptionId') ? String(formData.get('SubscriptionId')) : undefined,
        RecurrenceType: formData.get('RecurrenceType') ? String(formData.get('RecurrenceType')) : undefined,
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

export async function parseRecurrentWebhookPayload(request: NextRequest): Promise<{
    webhookData: CloudPaymentsRecurrentWebhookData;
    paymentData: Record<string, any>;
}> {
    const formData = await request.formData();

    const webhookData: CloudPaymentsRecurrentWebhookData = {
        Id: String(formData.get('Id') || ''),
        AccountId: String(formData.get('AccountId') || ''),
        Description: String(formData.get('Description') || ''),
        Email: String(formData.get('Email') || ''),
        Amount: Number(formData.get('Amount') || 0),
        Currency: String(formData.get('Currency') || ''),
        RequireConfirmation: formData.get('RequireConfirmation') === 'true',
        StartDate: String(formData.get('StartDate') || ''),
        Interval: String(formData.get('Interval') || ''),
        Period: Number(formData.get('Period') || 0),
        Status: String(formData.get('Status') || ''),
        SuccessfulTransactionsNumber: Number(formData.get('SuccessfulTransactionsNumber') || 0),
        FailedTransactionsNumber: Number(formData.get('FailedTransactionsNumber') || 0),
        MaxPeriods: formData.get('MaxPeriods') ? Number(formData.get('MaxPeriods')) : undefined,
        LastTransactionDate: formData.get('LastTransactionDate')
            ? String(formData.get('LastTransactionDate'))
            : undefined,
        NextTransactionDate: formData.get('NextTransactionDate')
            ? String(formData.get('NextTransactionDate'))
            : undefined,
    };

    const paymentData: Record<string, any> = {};

    // Для рекуррентных уведомлений может быть дополнительная информация в других полях
    const dataFields = ['Data', 'TestMode', 'DateTime'];
    dataFields.forEach(field => {
        const value = formData.get(field);
        if (value) {
            paymentData[field] = value;
        }
    });

    return { webhookData, paymentData };
}
