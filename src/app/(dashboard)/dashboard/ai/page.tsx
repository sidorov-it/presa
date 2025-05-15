'use client';

import { useState } from 'react';
import {
    Box,
    Stack,
    Flex,
    Text,
    Heading,
    Button,
    Input,
    Select,
    Textarea,
    createListCollection,
} from '@chakra-ui/react';
// import * as Select from '@chakra-ui/react/components/select';
import { Portal } from '@chakra-ui/react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import { toast } from 'sonner';

interface SlideTopic {
    id: string;
    title: string;
    instructions: string;
}

const EXAMPLES = [
    'Презентация о влиянии искусственного интеллекта на образование',
    'Маркетинговая стратегия для нового мобильного приложения',
    'Бизнес-план для стартапа в сфере электронной коммерции',
];

const TONE_OPTIONS = [
    { value: 'neutral', label: 'Нейтральный' },
    { value: 'friendly', label: 'Дружелюбный' },
    { value: 'formal', label: 'Официальный' },
    { value: 'creative', label: 'Креативный' },
];

const SLIDES_OPTIONS = [3, 5, 7, 10, 15];

const generateId = () => Math.random().toString(36).substring(2, 10);

const AiPresentationPage = () => {
    // Step 1: Form state
    const [description, setDescription] = useState('');
    const [numSlides, setNumSlides] = useState(5);
    const [tone, setTone] = useState('neutral');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Step 2: Topics state
    const [step, setStep] = useState<'form' | 'topics'>('form');
    const [presentationTitle, setPresentationTitle] = useState('Новая презентация');
    const [presentationDescription, setPresentationDescription] = useState('');
    const [topics, setTopics] = useState<SlideTopic[]>([]);

    // Handlers
    const handleExampleClick = (example: string) => setDescription(example);

    const handleGenerateTopics = async () => {
        if (!description.trim()) {
            setError('Пожалуйста, введите описание презентации.');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            const res = await fetch('/api/presentations/ai/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description, numSlides, tone }),
            });
            if (!res.ok) throw new Error('Ошибка генерации тем слайдов');
            const data = await res.json();
            setPresentationTitle(data.title || 'Новая презентация');
            setPresentationDescription(data.description || '');
            setTopics(
                (data.topics || []).map((t: any) => ({
                    id: generateId(),
                    title: t.title,
                    instructions: t.instructions || '',
                }))
            );
            setStep('topics');
        } catch {
            setError('Ошибка генерации тем слайдов. Попробуйте еще раз.');
        } finally {
            setIsLoading(false);
        }
    };

    // Slide topics editing
    const handleTopicChange = (id: string, value: string) => {
        setTopics(topics => topics.map(t => (t.id === id ? { ...t, title: value } : t)));
    };
    const handleInstructionsChange = (id: string, value: string) => {
        setTopics(topics => topics.map(t => (t.id === id ? { ...t, instructions: value } : t)));
    };
    const handleAddTopic = () => {
        setTopics(topics => [...topics, { id: generateId(), title: '', instructions: '' }]);
    };
    const handleDeleteTopic = (id: string) => {
        setTopics(topics => topics.filter(t => t.id !== id));
    };

    const handleBack = () => setStep('form');

    const slideOptions = createListCollection({
        items: SLIDES_OPTIONS.map(num => ({ value: String(num), label: String(num) })),
    });

    console.log(slideOptions);
    const toneOptions = createListCollection({
        items: TONE_OPTIONS.map(opt => ({ value: opt.value, label: opt.label })),
    });

    return (
        <Box
            maxWidth="700px"
            marginX="auto"
            marginTop="40px"
            padding="24px"
            background="white"
            borderRadius="16px"
            boxShadow="md"
        >
            <Heading as="h1" size="lg" marginBottom="24px" textAlign="center">
                Создание презентации с помощью ИИ
            </Heading>
            {step === 'form' && (
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        handleGenerateTopics();
                    }}
                >
                    <Stack gap="24px">
                        <Box>
                            <Text as="label" fontWeight="bold" display="block" marginBottom="8px">
                                Опишите, о чем должна быть ваша презентация
                            </Text>
                            <Textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Например: Презентация о влиянии искусственного интеллекта на образование"
                                rows={4}
                                aria-label="Описание презентации"
                                tabIndex={0}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerateTopics();
                                }}
                            />
                        </Box>
                        <Box>
                            <Text fontWeight="medium" marginBottom="8px">
                                Примеры:
                            </Text>
                            <Flex gap="8px" flexWrap="wrap">
                                {EXAMPLES.map(example => (
                                    <Button
                                        key={example}
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleExampleClick(example)}
                                        aria-label={`Вставить пример: ${example}`}
                                        tabIndex={0}
                                    >
                                        {example}
                                    </Button>
                                ))}
                            </Flex>
                        </Box>
                        <Flex gap="16px" alignItems="flex-end">
                            <Box flex="1">
                                <Select.Root
                                    collection={slideOptions}
                                    value={[String(numSlides)]}
                                    onValueChange={val => setNumSlides(Number(val[0]))}
                                    size="sm"
                                    width="100%"
                                >
                                    <Select.HiddenSelect />
                                    <Select.Label>Количество слайдов</Select.Label>
                                    <Select.Control>
                                        <Select.Trigger>
                                            <Select.ValueText placeholder="Выберите количество" />
                                        </Select.Trigger>
                                        <Select.IndicatorGroup>
                                            <Select.Indicator />
                                        </Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal>
                                        <Select.Positioner>
                                            <Select.Content>
                                                {slideOptions.items.map(option => (
                                                    <Select.Item item={option} key={option.value}>
                                                        {option.label}
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Positioner>
                                    </Portal>
                                </Select.Root>
                            </Box>
                            <Box flex="1">
                                <Select.Root
                                    collection={toneOptions}
                                    value={[tone]}
                                    onValueChange={val => setTone(val[0])}
                                    size="sm"
                                    width="100%"
                                >
                                    <Select.HiddenSelect />
                                    <Select.Label>Tone of Voice / Стилистика</Select.Label>
                                    <Select.Control>
                                        <Select.Trigger>
                                            <Select.ValueText placeholder="Выберите стиль" />
                                        </Select.Trigger>
                                        <Select.IndicatorGroup>
                                            <Select.Indicator />
                                        </Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal>
                                        <Select.Positioner>
                                            <Select.Content>
                                                {toneOptions.items.map(option => (
                                                    <Select.Item item={option} key={option.value}>
                                                        {option.label}
                                                        <Select.ItemIndicator />
                                                    </Select.Item>
                                                ))}
                                            </Select.Content>
                                        </Select.Positioner>
                                    </Portal>
                                </Select.Root>
                            </Box>
                        </Flex>
                        {error && <Text color="red.500">{error}</Text>}
                        <Button
                            type="submit"
                            colorScheme="blue"
                            disabled={isLoading}
                            aria-label="Сгенерировать темы слайдов"
                        >
                            {isLoading ? 'Генерация...' : 'Сгенерировать темы слайдов'}
                        </Button>
                    </Stack>
                </form>
            )}
            {step === 'topics' && (
                <Box>
                    <Button marginBottom="16px" onClick={handleBack} aria-label="Назад к описанию" tabIndex={0}>
                        ← Назад
                    </Button>
                    <Stack gap="16px">
                        <Box>
                            <Text as="label" fontWeight="bold" display="block" marginBottom="8px">
                                Название презентации
                            </Text>
                            <Input
                                value={presentationTitle}
                                onChange={e => setPresentationTitle(e.target.value)}
                                aria-label="Название презентации"
                                tabIndex={0}
                            />
                        </Box>
                        <Box>
                            <Text as="label" fontWeight="bold" display="block" marginBottom="8px">
                                Описание презентации
                            </Text>
                            <Textarea
                                value={presentationDescription}
                                onChange={e => setPresentationDescription(e.target.value)}
                                aria-label="Описание презентации"
                                tabIndex={0}
                            />
                        </Box>
                        <Heading as="h2" size="md" marginBottom="8px">
                            Темы слайдов
                        </Heading>
                        {topics.map((topic, idx) => (
                            <Flex key={topic.id} alignItems="flex-start" gap="8px">
                                <Box flex="1">
                                    <Text as="label" fontWeight="bold" display="block" marginBottom="4px">
                                        Тема слайда {idx + 1}
                                    </Text>
                                    <Input
                                        value={topic.title}
                                        onChange={e => handleTopicChange(topic.id, e.target.value)}
                                        aria-label={`Тема слайда ${idx + 1}`}
                                        tabIndex={0}
                                    />
                                    <Text
                                        as="label"
                                        fontWeight="bold"
                                        display="block"
                                        marginTop="8px"
                                        marginBottom="4px"
                                    >
                                        Инструкции для слайда
                                    </Text>
                                    <Textarea
                                        value={topic.instructions}
                                        onChange={e => handleInstructionsChange(topic.id, e.target.value)}
                                        aria-label={`Инструкции для слайда ${idx + 1}`}
                                        tabIndex={0}
                                        rows={2}
                                    />
                                </Box>
                                <Button
                                    variant="ghost"
                                    colorScheme="red"
                                    onClick={() => handleDeleteTopic(topic.id)}
                                    aria-label="Удалить слайд"
                                    tabIndex={0}
                                    marginTop="32px"
                                    padding="8px"
                                >
                                    <FaTrash />
                                </Button>
                            </Flex>
                        ))}
                        <Button onClick={handleAddTopic} aria-label="Добавить слайд" tabIndex={0}>
                            <FaPlus />
                            Добавить слайд
                        </Button>
                    </Stack>
                    <Flex justifyContent="flex-end" marginTop="24px">
                        <Button
                            colorScheme="blue"
                            onClick={() => toast('Сохранение реализуем позже')}
                            aria-label="Сохранить презентацию"
                            tabIndex={0}
                        >
                            Сохранить презентацию
                        </Button>
                    </Flex>
                </Box>
            )}
        </Box>
    );
};

export default AiPresentationPage;
