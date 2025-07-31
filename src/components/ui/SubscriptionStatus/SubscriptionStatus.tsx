import { FaCrown } from 'react-icons/fa';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
import { Box, Text, Flex, Spinner } from '@chakra-ui/react';
import styles from './SubscriptionStatus.module.css';

interface SubscriptionStatusProps {
    showDetails?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const SubscriptionStatus = ({ showDetails = false, size = 'md', className }: SubscriptionStatusProps) => {
    const { hasActiveSubscription, features, loading } = useSubscriptionCheck();

    if (loading) {
        return (
            <Box className={className}>
                <Spinner size="sm" />
            </Box>
        );
    }

    if (!hasActiveSubscription) {
        return showDetails ? (
            <Box className={`${styles.container} ${className}`}>
                <Text fontSize={size === 'sm' ? 'xs' : 'sm'} color="gray.600">
                    Базовый план
                </Text>
                {showDetails && (
                    <Text fontSize="xs" color="gray.500">
                        До {features.maxSlides} слайдов
                    </Text>
                )}
            </Box>
        ) : null;
    }

    return (
        <Flex alignItems="center" gap="4px" className={`${styles.premium} ${className}`}>
            <FaCrown className={styles.crown} size={size === 'sm' ? 12 : size === 'lg' ? 18 : 14} />
            {showDetails && (
                <Box>
                    <Text fontSize={size === 'sm' ? 'xs' : 'sm'} color="blue.600" fontWeight="500">
                        Премиум
                    </Text>
                    <Text fontSize="xs" color="blue.500">
                        До {features.maxSlides} слайдов
                    </Text>
                </Box>
            )}
        </Flex>
    );
};

export default SubscriptionStatus;
