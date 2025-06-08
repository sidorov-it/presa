'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { YooKassaPaymentButton } from './YooKassaPaymentButton';
import { PaymentStatus } from './PaymentStatus';
import { TokenPackage } from '@/types/tokens';
import { FaCoins, FaCheck, FaStar, FaTimes } from 'react-icons/fa';

interface TokenPurchaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [packages, setPackages] = useState<TokenPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activePurchaseId, setActivePurchaseId] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    // Фокус-ловушка
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                modalRef.current?.focus();
            }, 0);
        }
    }, [isOpen]);

    // Загружаем пакеты токенов
    useEffect(() => {
        if (isOpen) {
            loadTokenPackages();
        }
    }, [isOpen]);

    const loadTokenPackages = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/tokens/packages');
            
            if (!response.ok) {
                throw new Error('Failed to load token packages');
            }
            
            const data = await response.json();
            setPackages(data.packages || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = (purchaseId: string) => {
        setActivePurchaseId(purchaseId);
    };

    const handlePaymentComplete = () => {
        setActivePurchaseId(null);
        if (onSuccess) {
            onSuccess();
        }
        onClose();
    };

    const handlePaymentError = (error: string) => {
        setError(error);
        setActivePurchaseId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    const formatPrice = (price: number, currency: string) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(price);
    };

    const calculateTokensPerRuble = (tokens: number, price: number) => {
        return Math.round((tokens / price) * 100) / 100;
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            tabIndex={-1}
            aria-modal="true"
            role="dialog"
            onKeyDown={handleKeyDown}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0"
                onClick={onClose}
                aria-label="Закрыть модальное окно"
            />
            
            {/* Modal content */}
            <div
                ref={modalRef}
                className="relative bg-white rounded-lg shadow-xl max-w-2xl max-h-[80vh] overflow-y-auto m-4 w-full"
                tabIndex={0}
                aria-label="Покупка токенов"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <FaCoins className="text-yellow-500" />
                        Покупка токенов
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Закрыть"
                    >
                        <FaTimes className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {activePurchaseId ? (
                        <div>
                            <h3 className="text-lg font-medium mb-4">Статус платежа</h3>
                            <PaymentStatus
                                purchaseId={activePurchaseId}
                                onSuccess={handlePaymentComplete}
                                onError={handlePaymentError}
                            />
                        </div>
                    ) : loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="ml-3">Загрузка пакетов...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div className="text-red-800">
                                <strong>Ошибка:</strong> {error}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={loadTokenPackages}
                            >
                                Попробовать снова
                            </Button>
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Пакеты токенов не найдены
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <strong>💡 Как работают токены:</strong>
                                <ul className="mt-2 space-y-1 text-xs">
                                    <li>• Генерация текста: 25 токенов</li>
                                    <li>• Создание слайда: 50 токенов</li>
                                    <li>• Генерация изображений: 100 токенов</li>
                                </ul>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {packages.map((pkg) => (
                                    <div
                                        key={pkg.id}
                                        className={`relative border rounded-lg p-4 ${
                                            pkg.isPopular
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 bg-white'
                                        }`}
                                    >
                                        {pkg.isPopular && (
                                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                                <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                    <FaStar className="w-3 h-3" />
                                                    Популярный
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="text-center">
                                            <h3 className="font-bold text-lg">{pkg.name}</h3>
                                            {pkg.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {pkg.description}
                                                </p>
                                            )}
                                            
                                            <div className="mt-3">
                                                <div className="text-3xl font-bold text-blue-600">
                                                    {pkg.tokens.toLocaleString()}
                                                </div>
                                                <div className="text-sm text-gray-500">токенов</div>
                                            </div>
                                            
                                            <div className="mt-2">
                                                <div className="text-2xl font-bold">
                                                    {formatPrice(pkg.price, pkg.currency)}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {calculateTokensPerRuble(pkg.tokens, pkg.price)} токенов за ₽
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4">
                                                <YooKassaPaymentButton
                                                    tokenPackage={pkg}
                                                    onPaymentSuccess={handlePaymentSuccess}
                                                    onPaymentError={handlePaymentError}
                                                    className="w-full"
                                                />
                                            </div>
                                            
                                            {/* Примеры использования */}
                                            <div className="mt-3 text-xs text-gray-500">
                                                <div className="flex items-center justify-center gap-1">
                                                    <FaCheck className="w-3 h-3 text-green-500" />
                                                    ~{Math.floor(pkg.tokens / 50)} слайдов
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}; 