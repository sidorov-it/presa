'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';

// Sample plan data
const PLANS = [
    {
        id: 'free',
        name: 'Бесплатный',
        price: 0,
        billing: 'навсегда',
        features: ['До 3 презентаций', 'Базовые шаблоны', 'Экспорт в PDF', 'Поддержка сообщества'],
        limitations: ['Без генерации ИИ', 'Ограничение до 20 слайдов на презентацию', 'Только стандартные темы'],
    },
    {
        id: 'pro',
        name: 'Профессиональный',
        price: 9.99,
        billing: 'ежемесячно',
        popular: true,
        features: [
            'Неограниченное количество презентаций',
            'Генерация контента с помощью ИИ',
            'Все шаблоны и темы',
            'Экспорт в PDF, PPTX',
            'Приоритетная поддержка по email',
            'Без водяных знаков',
        ],
        limitations: [],
    },
    {
        id: 'enterprise',
        name: 'Корпоративный',
        price: 29.99,
        billing: 'ежемесячно',
        features: [
            'Все возможности Профессионального тарифа',
            'Командное сотрудничество',
            'Расширенная аналитика',
            'Индивидуальный брендинг',
            'Выделенный менеджер аккаунта',
            'Доступ к API',
            'SSO аутентификация',
        ],
        limitations: [],
    },
];

// export const metadata = {
//     title: "Payment",
//     description: "Choose your subscription plan"
// }

const PaymentPage = () => {
    const { data: session } = useSession();
    const [selectedPlan, setSelectedPlan] = useState('free');
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubscribe = async (planId: string) => {
        if (planId === 'free') {
            return; // No payment needed for free plan
        }

        setIsProcessing(true);

        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));

        // In a real app, this would call your payment API
        setIsProcessing(false);

        alert(`Спасибо за подписку на тариф ${planId}!`);
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading title="Тарифные планы" description="Выберите идеальный план для ваших нужд" />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {/* Free Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Бесплатный</CardTitle>
                        <CardDescription>Идеально для начала работы</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">0₽</span>
                            <span className="text-muted-foreground">/месяц</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>3 презентации</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Базовые шаблоны</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Экспорт в PDF</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => handleSubscribe('free')}>
                            Начать
                        </Button>
                    </CardFooter>
                </Card>

                {/* Pro Plan */}
                <Card className="border-2 border-primary">
                    <CardHeader>
                        <CardTitle>Профессиональный</CardTitle>
                        <CardDescription>Лучший для профессионалов</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">999₽</span>
                            <span className="text-muted-foreground">/месяц</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Неограниченное количество презентаций</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Премиум шаблоны</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Индивидуальный брендинг</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Приоритетная поддержка</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={() => handleSubscribe('pro')}>
                            Подписаться
                        </Button>
                    </CardFooter>
                </Card>

                {/* Enterprise Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Корпоративный</CardTitle>
                        <CardDescription>Для крупных организаций</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">Индивидуально</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Все возможности Профессионального тарифа</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Индивидуальные интеграции</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Выделенная поддержка</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>SLA соглашение</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => handleSubscribe('enterprise')}>
                            Связаться с отделом продаж
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default PaymentPage;
