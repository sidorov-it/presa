import { Suspense } from 'react';
import Subscriptions from './Subscriptions';
import type { Metadata } from 'next';
import Script from 'next/script';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = {
    title: 'Токены',
    description: 'Покупка и управление токенами',
};

export default async function SubscriptionsPage() {
    const subscriptionPlans = await prisma.subscriptionPlan.findMany({
        where: {
            isActive: true,
        },
    });

    const tokensPackages = await prisma.tokenPackage.findMany({
        where: {
            isActive: true,
            isHidden: false,
        },
    });

    return (
        <Suspense>
            <Script src="https://widget.cloudpayments.ru/bundles/cloudpayments.js" />

            <Subscriptions subscriptionPlans={subscriptionPlans} tokensPackages={tokensPackages} />
        </Suspense>
    );
}
