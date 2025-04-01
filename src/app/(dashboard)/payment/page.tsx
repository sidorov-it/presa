'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FaCheck, FaCreditCard, FaPaypal } from 'react-icons/fa';
import { Heading } from "@/components/ui/heading"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/Button"
import { Check } from "lucide-react"

// Sample plan data
const PLANS = [
    {
        id: 'free',
        name: 'Free',
        price: 0,
        billing: 'forever',
        features: [
            'Up to 3 presentations',
            'Basic templates',
            'Export to PDF',
            'Community support',
        ],
        limitations: [
            'No AI generation',
            'Limited to 20 slides per presentation',
            'Standard themes only',
        ],
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 9.99,
        billing: 'monthly',
        popular: true,
        features: [
            'Unlimited presentations',
            'AI-powered content generation',
            'All templates and themes',
            'Export to PDF, PPTX',
            'Priority email support',
            'No watermarks',
        ],
        limitations: [],
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: 29.99,
        billing: 'monthly',
        features: [
            'Everything in Pro',
            'Team collaboration',
            'Advanced analytics',
            'Custom branding',
            'Dedicated account manager',
            'API access',
            'SSO authentication',
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
    
        alert(`Thank you for subscribing to the ${planId} plan!`);
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between">
                <Heading
                    title="Subscription Plans"
                    description="Choose the perfect plan for your needs"
                />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {/* Free Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Free</CardTitle>
                        <CardDescription>Perfect for getting started</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">$0</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>3 presentations</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Basic templates</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Export to PDF</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleSubscribe("free")}
                        >
                            Get Started
                        </Button>
                    </CardFooter>
                </Card>

                {/* Pro Plan */}
                <Card className="border-2 border-primary">
                    <CardHeader>
                        <CardTitle>Pro</CardTitle>
                        <CardDescription>Best for professionals</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">$15</span>
                            <span className="text-muted-foreground">/month</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Unlimited presentations</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Premium templates</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Custom branding</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Priority support</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            onClick={() => handleSubscribe("pro")}
                        >
                            Subscribe to Pro
                        </Button>
                    </CardFooter>
                </Card>

                {/* Enterprise Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Enterprise</CardTitle>
                        <CardDescription>For large organizations</CardDescription>
                        <div className="mt-4">
                            <span className="text-3xl font-bold">Custom</span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Everything in Pro</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Custom integrations</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>Dedicated support</span>
                            </li>
                            <li className="flex items-center">
                                <Check className="mr-2 h-4 w-4 text-green-500" />
                                <span>SLA agreement</span>
                            </li>
                        </ul>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleSubscribe("enterprise")}
                        >
                            Contact Sales
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}

export default PaymentPage 