import crypto from 'crypto';

interface YooKassaConfig {
    shopId: string;
    secretKey: string;
    apiUrl?: string;
}

interface PaymentAmount {
    value: string;
    currency: string;
}

interface PaymentConfirmation {
    type: 'redirect';
    return_url: string;
}

interface CreatePaymentRequest {
    amount: PaymentAmount;
    payment_method_data?: {
        type: string;
    };
    confirmation: PaymentConfirmation;
    description: string;
    metadata?: Record<string, any>;
    capture?: boolean;
}

interface PaymentResponse {
    id: string;
    status: 'pending' | 'waiting_for_capture' | 'succeeded' | 'canceled';
    amount: PaymentAmount;
    description: string;
    metadata?: Record<string, any>;
    confirmation?: {
        type: string;
        confirmation_url?: string;
    };
    created_at: string;
    expires_at?: string;
}

export class YooKassaService {
    private config: YooKassaConfig;
    private apiUrl: string;

    constructor(config: YooKassaConfig) {
        this.config = config;
        this.apiUrl = config.apiUrl || 'https://api.yookassa.ru/v3';
    }

    private getHeaders(): Record<string, string> {
        const credentials = Buffer.from(`${this.config.shopId}:${this.config.secretKey}`).toString('base64');
        return {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
            'Idempotence-Key': this.generateIdempotenceKey(),
        };
    }

    private generateIdempotenceKey(): string {
        return `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Создание платежа в YooKassa
     */
    async createPayment(paymentData: CreatePaymentRequest): Promise<PaymentResponse> {
        try {
            const response = await fetch(`${this.apiUrl}/payments`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(paymentData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`YooKassa API error: ${response.status} - ${errorData.description || 'Unknown error'}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating payment:', error);
            throw error;
        }
    }

    /**
     * Получение информации о платеже
     */
    async getPayment(paymentId: string): Promise<PaymentResponse> {
        try {
            const response = await fetch(`${this.apiUrl}/payments/${paymentId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`YooKassa API error: ${response.status} - ${errorData.description || 'Unknown error'}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting payment:', error);
            throw error;
        }
    }

    /**
     * Подтверждение платежа
     */
    async capturePayment(paymentId: string, amount?: PaymentAmount): Promise<PaymentResponse> {
        try {
            const body: any = {};
            if (amount) {
                body.amount = amount;
            }

            const response = await fetch(`${this.apiUrl}/payments/${paymentId}/capture`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`YooKassa API error: ${response.status} - ${errorData.description || 'Unknown error'}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error capturing payment:', error);
            throw error;
        }
    }

    /**
     * Отмена платежа
     */
    async cancelPayment(paymentId: string): Promise<PaymentResponse> {
        try {
            const response = await fetch(`${this.apiUrl}/payments/${paymentId}/cancel`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`YooKassa API error: ${response.status} - ${errorData.description || 'Unknown error'}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error canceling payment:', error);
            throw error;
        }
    }

    /**
     * Валидация webhook от YooKassa
     */
    validateWebhookSignature(body: string, signature: string): boolean {
        const expectedSignature = crypto.createHmac('sha256', this.config.secretKey).update(body).digest('hex');

        return signature === expectedSignature;
    }
}

// Создание глобального экземпляра сервиса
let yooKassaService: YooKassaService | null = null;

export function getYooKassaService(): YooKassaService {
    if (!yooKassaService) {
        const shopId = process.env.YOOKASSA_SHOP_ID;
        const secretKey = process.env.YOOKASSA_SECRET_KEY;

        if (!shopId || !secretKey) {
            throw new Error('YooKassa credentials not found in environment variables');
        }

        yooKassaService = new YooKassaService({
            shopId,
            secretKey,
        });
    }

    return yooKassaService;
}
