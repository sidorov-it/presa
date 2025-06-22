import type { Metadata } from 'next';
import PaymentPage from './page.client';

export const metadata: Metadata = {
    title: 'Тарифные планы',
    description: 'Выбор и оплата подходящего тарифа',
};

export default function PaymentWrapper() {
    return <PaymentPage />;
}
