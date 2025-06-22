'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Heading } from '@/components/ui/heading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card/Card';
import { Button } from '@/components/ui/Button';
import { Check } from 'lucide-react';
import type { Metadata } from 'next';
import styles from './page.module.css';

export const metadata: Metadata = {
    title: 'Тарифные планы',
    description: 'Выбор и оплата подходящего тарифа',
};

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
        <div className={styles.container}>
            <div className={styles.header}>
                <Heading title="Тарифные планы" description="Выберите идеальный план для ваших нужд" />
            </div>

            <div className={styles.plansGrid}>
                {/* Free Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Бесплатный</CardTitle>
                        <CardDescription>Идеально для начала работы</CardDescription>
                        <div className={styles.planPrice}>
                            <span className={styles.planPriceAmount}>0₽</span>
                            <span className={styles.planPricePeriod}>/месяц</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className={styles.featuresList}>
                            <li className={styles.featureItem}>
                                <Check className={styles.featureIcon} />
                                <span>3 презентации</span>
                            </li>
                            <li className={styles.featureItem}>
                                <Check className={styles.featureIcon} />
                                <span>Базовые шаблоны</span>
                            </li>
                            <li className={styles.featureItem}>
                                <Check className={styles.featureIcon} />
                                <span>Экспорт в PDF</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            className={styles.fullWidthButton}
                            onClick={() => handleSubscribe('free')}
                        >
                            Начать
                        </Button>
                    </CardFooter>
                </Card>

                {/* Pro Plan */}
                <Card className={styles.popularPlan}>
                    <CardHeader>
                        <CardTitle>Профессиональный</CardTitle>
                        <CardDescription>Лучший для профессионалов</CardDescription>
                        <div className={styles.planPrice}>
                            <span className={styles.planPriceAmount}>999₽</span>
                            <span className={styles.planPricePeriod}>/месяц</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className={styles.featuresList}>
                            <li className={styles.featureItem}>
                                <Check className={styles.featureIcon} />
                                <span>Неограниченное количество презентаций</span>
                            </li>
                            <li className={styles.featureItem}>
                                <Check className={styles.featureIcon} />
                                <span>Премиум шаблоны</span>
                            </li>
                            <li className={styles.featureItem}>
                                <Check className={styles.featureIcon} />
                                <span>Индивидуальный брендинг</span>
                            </li>
                            <li className={styles.featureItem}>
                                <Check className={styles.featureIcon} />
                                <span>Приоритетная поддержка</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button className={styles.fullWidthButton} onClick={() => handleSubscribe('pro')}>
                            Подписаться
                        </Button>
                    </CardFooter>
                </Card>

                {/* Enterprise Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Корпоративный</CardTitle>
                        <CardDescription>Для крупных организаций</CardDescription>
                        <div className={styles.planPrice}>
                            <span className={styles.planPriceAmount}>Индивидуально</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className={styles.featuresList}>
                            <li className={styles.featureItem}>
                                <Check className={styles.featureIcon} />
                                <span>Все возможности Профессионального тарифа</span>
                            </li>
                            <li className={styles.featureItem}>
                                <Check className={styles.featureIcon} />
                                <span>Индивидуальные интеграции</span>
                            </li>
                            <li className={styles.featureItem}>
                                <Check className={styles.featureIcon} />
                                <span>Выделенная поддержка</span>
                            </li>
                            <li className={styles.featureItem}>
                                <Check className={styles.featureIcon} />
                                <span>SLA соглашение</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            className={styles.fullWidthButton}
                            onClick={() => handleSubscribe('enterprise')}
                        >
                            Связаться с отделом продаж
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default PaymentPage;
