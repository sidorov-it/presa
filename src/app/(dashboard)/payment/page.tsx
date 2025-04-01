'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FaCheck, FaCreditCard, FaPaypal } from 'react-icons/fa';

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

export default function PaymentPage() {
    const { data: session } = useSession();
    const [selectedPlan, setSelectedPlan] = useState('free');
    const [paymentMethod, setPaymentMethod] = useState('credit_card');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubscribe = async () => {
        if (selectedPlan === 'free') {
            return; // No payment needed for free plan
        }
    
        setIsProcessing(true);
    
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 1500));
    
        // In a real app, this would call your payment API
        setIsProcessing(false);
    
        alert(`Thank you for subscribing to the ${selectedPlan} plan!`);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Plans & Billing</h1>
                <p className="text-gray-600 mt-2">
          Choose the plan that works best for you
                </p>
            </div>

            {/* Pricing Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {PLANS.map((plan) => (
                    <div 
                        key={plan.id}
                        className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all ${
                            selectedPlan === plan.id ? 'ring-2 ring-blue-500 transform scale-105' : ''
                        } ${plan.popular ? 'border-t-4 border-blue-500' : ''}`}
                    >
                        {plan.popular && (
                            <div className="bg-blue-500 text-white text-center py-1 text-sm font-medium">
                Most Popular
                            </div>
                        )}
            
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h2>
              
                            <div className="mb-4">
                                <span className="text-3xl font-bold">${plan.price}</span>
                                <span className="text-gray-500">/{plan.billing}</span>
                            </div>
              
                            <ul className="mb-6 space-y-2">
                                {plan.features.map((feature, index) => (
                                    <li key={index} className="flex items-start">
                                        <FaCheck className="text-green-500 mt-1 mr-2 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                
                                {plan.limitations.map((limitation, index) => (
                                    <li key={index} className="flex items-start text-gray-500">
                                        <span className="text-gray-400 mt-1 mr-2 flex-shrink-0">✕</span>
                                        <span>{limitation}</span>
                                    </li>
                                ))}
                            </ul>
              
                            <button
                                onClick={() => setSelectedPlan(plan.id)}
                                className={`w-full py-2 rounded-md font-medium ${
                                    selectedPlan === plan.id
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }`}
                            >
                                {selectedPlan === plan.id ? 'Selected' : 'Select'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Payment Section */}
            {selectedPlan !== 'free' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Information</h2>
          
                    <div className="mb-6">
                        <div className="text-sm font-medium text-gray-700 mb-2">Payment Method</div>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setPaymentMethod('credit_card')}
                                className={`flex items-center px-4 py-2 rounded-md ${
                                    paymentMethod === 'credit_card'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                                }`}
                            >
                                <FaCreditCard className="mr-2" />
                Credit Card
                            </button>
              
                            <button
                                onClick={() => setPaymentMethod('paypal')}
                                className={`flex items-center px-4 py-2 rounded-md ${
                                    paymentMethod === 'paypal'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                                }`}
                            >
                                <FaPaypal className="mr-2" />
                PayPal
                            </button>
                        </div>
                    </div>
          
                    {paymentMethod === 'credit_card' && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                                </label>
                                <input
                                    type="text"
                                    id="card_number"
                                    placeholder="XXXX XXXX XXXX XXXX"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
              
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                                    </label>
                                    <input
                                        type="text"
                                        id="expiry"
                                        placeholder="MM/YY"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="cvc" className="block text-sm font-medium text-gray-700 mb-1">
                    CVC
                                    </label>
                                    <input
                                        type="text"
                                        id="cvc"
                                        placeholder="123"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
          
                    {paymentMethod === 'paypal' && (
                        <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-gray-700">
                You will be redirected to PayPal to complete your payment.
                            </p>
                        </div>
                    )}
          
                    <div className="mt-6 border-t border-gray-200 pt-4">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-700">Plan</span>
                            <span className="font-medium">{PLANS.find(p => p.id === selectedPlan)?.name}</span>
                        </div>
            
                        <div className="flex justify-between mb-4">
                            <span className="text-gray-700">Price</span>
                            <span className="font-medium">${PLANS.find(p => p.id === selectedPlan)?.price}/{PLANS.find(p => p.id === selectedPlan)?.billing}</span>
                        </div>
            
                        <button
                            onClick={handleSubscribe}
                            disabled={isProcessing}
                            className={`w-full py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 ${
                                isProcessing ? 'opacity-75 cursor-not-allowed' : ''
                            }`}
                        >
                            {isProcessing ? 'Processing...' : 'Subscribe Now'}
                        </button>
            
                        <p className="text-xs text-gray-500 mt-2 text-center">
              By subscribing, you agree to our terms of service and privacy policy.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
} 