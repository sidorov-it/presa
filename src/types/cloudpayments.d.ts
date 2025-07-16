declare global {
    interface Window {
        cp: {
            CloudPayments: {
                new (): {
                    pay: (
                        method: 'charge' | 'auth',
                        options: {
                            publicId: string;
                            description: string;
                            amount: number;
                            currency: string;
                            invoiceId: string;
                            accountId: string;
                            skin?: string;
                            data?: Record<string, any>;
                        },
                        callbacks: {
                            onSuccess?: (options: any) => void;
                            onFail?: (reason: any, options: any) => void;
                            onComplete?: (paymentResult: any, options: any) => void;
                        }
                    ) => void;
                };
            };
            Checkout: {
                new (options: { publicId: string }): any;
            };
        };
        CloudPayments: {
            new (): {
                pay: (
                    method: 'charge' | 'auth',
                    options: {
                        publicId: string;
                        description: string;
                        amount: number;
                        currency: string;
                        invoiceId: string;
                        accountId: string;
                        skin?: string;
                        data?: Record<string, any>;
                    },
                    callbacks: {
                        onSuccess?: (options: any) => void;
                        onFail?: (reason: any, options: any) => void;
                        onComplete?: (paymentResult: any, options: any) => void;
                    }
                ) => void;
            };
        };
    }
}

export {}; 