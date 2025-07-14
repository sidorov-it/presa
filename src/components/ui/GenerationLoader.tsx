import { useEffect, useState } from 'react';
import { Box, Text, Spinner, VStack } from '@chakra-ui/react';
import styles from './GenerationLoader.module.css';

interface GenerationLoaderProps {
    isVisible: boolean;
}

const GENERATION_MESSAGES = [
    'Анализируем ваш запрос...',
    'Создаем структуру презентации...',
    'Генерируем содержимое слайдов...',
    'Подбираем подходящие изображения...',
    'Оптимизируем дизайн...',
    'Финальная обработка...',
    'Презентация почти готова...',
    'Сохраняем результат...',
];

const GenerationLoader: React.FC<GenerationLoaderProps> = ({ isVisible }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        if (!isVisible) return;

        const interval = setInterval(() => {
            setCurrentMessageIndex(prev => (prev + 1) % GENERATION_MESSAGES.length);
        }, 3000); // Меняем сообщение каждые 3 секунды

        return () => clearInterval(interval);
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <Box
            position="fixed"
            top="0"
            left="0"
            right="0"
            bottom="0"
            backgroundColor="rgba(0, 0, 0, 0.8)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            zIndex="9999"
            className={styles.fadeIn}
        >
            <VStack spacing="24px" textAlign="center">
                <Box className={styles.pulse}>
                    <Spinner 
                        size="xl" 
                        color="blue.500" 
                        thickness="4px"
                        speed="0.8s"
                    />
                </Box>
                <VStack spacing="12px">
                    <Text 
                        fontSize="xl" 
                        fontWeight="bold" 
                        color="white"
                    >
                        Создаем вашу презентацию
                    </Text>
                    <Box className={styles.messageContainer}>
                        <Text 
                            fontSize="md" 
                            color="gray.300"
                            minHeight="24px"
                            key={currentMessageIndex}
                        >
                            {GENERATION_MESSAGES[currentMessageIndex]}
                        </Text>
                    </Box>
                    <Text 
                        fontSize="sm" 
                        color="gray.400"
                        maxWidth="400px"
                        textAlign="center"
                        lineHeight="1.5"
                    >
                        Это может занять несколько минут. Даже если вы закроете окно, 
                        презентация появится в вашем списке по готовности.
                    </Text>
                </VStack>
            </VStack>
        </Box>
    );
};

export default GenerationLoader; 