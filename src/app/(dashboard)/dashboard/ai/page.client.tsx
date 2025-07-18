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
    Link,
    Card,
} from '@chakra-ui/react';
// import * as Select from '@chakra-ui/react/components/select';
import { Portal } from '@chakra-ui/react';
import { FaPlus, FaTrash, FaGripVertical } from 'react-icons/fa';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { generateId } from '@/utils/id';
import GenerationLoader from '@/components/ui/GenerationLoader';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import {
    CSS,
} from '@dnd-kit/utilities';

interface SlideTopic {
    id: string;
    title: string;
    instructions: string;
}

// Sortable slide topic component
const SortableSlideCard = ({ 
    topic, 
    index, 
    onTopicChange, 
    onInstructionsChange, 
    onDelete 
}: {
    topic: SlideTopic;
    index: number;
    onTopicChange: (id: string, value: string) => void;
    onInstructionsChange: (id: string, value: string) => void;
    onDelete: (id: string) => void;
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: topic.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <Card.Root 
            ref={setNodeRef} 
            style={style}
            padding="16px"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="12px"
            backgroundColor={isDragging ? "gray.50" : "white"}
            boxShadow="sm"
            _hover={{ boxShadow: "md" }}
            transition="all 0.2s"
        >
            <Flex alignItems="flex-start" gap="12px">
                {/* Drag handle */}
                <Flex
                    {...attributes}
                    {...listeners}
                    alignItems="center"
                    justifyContent="center"
                    width="24px"
                    height="24px"
                    color="gray.400"
                    cursor="grab"
                    _hover={{ color: "gray.600" }}
                    _active={{ cursor: "grabbing" }}
                    marginTop="32px"
                    tabIndex={0}
                    aria-label={`Перетащить слайд ${index + 1}`}
                >
                    <FaGripVertical />
                </Flex>

                {/* Slide number badge */}
                <Flex
                    alignItems="center"
                    justifyContent="center"
                    width="32px"
                    height="32px"
                    backgroundColor="blue.500"
                    color="white"
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="bold"
                    marginTop="28px"
                    flexShrink={0}
                >
                    {index + 1}
                </Flex>

                {/* Content */}
                <Box flex="1">
                    <Text as="label" fontWeight="bold" display="block" marginBottom="8px" color="gray.700">
                        Тема слайда {index + 1}
                    </Text>
                    <Input
                        value={topic.title}
                        onChange={e => onTopicChange(topic.id, e.target.value)}
                        aria-label={`Тема слайда ${index + 1}`}
                        tabIndex={0}
                        marginBottom="12px"
                        borderColor="gray.300"
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                    />
                    <Text
                        as="label"
                        fontWeight="bold"
                        display="block"
                        marginBottom="8px"
                        color="gray.700"
                    >
                        Инструкции для слайда
                    </Text>
                    <Textarea
                        value={topic.instructions}
                        onChange={e => onInstructionsChange(topic.id, e.target.value)}
                        aria-label={`Инструкции для слайда ${index + 1}`}
                        tabIndex={0}
                        rows={3}
                        borderColor="gray.300"
                        _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
                        placeholder="Опишите, что должно быть на этом слайде..."
                    />
                </Box>

                {/* Delete button */}
                <Button
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => onDelete(topic.id)}
                    aria-label={`Удалить слайд ${index + 1}`}
                    tabIndex={0}
                    marginTop="28px"
                    padding="8px"
                    minWidth="auto"
                    height="32px"
                    _hover={{ backgroundColor: "red.50" }}
                >
                    <FaTrash size="14px" />
                </Button>
            </Flex>
        </Card.Root>
    );
};

const EXAMPLES = [
    'Презентация о влиянии искусственного интеллекта на образование',
    'Маркетинговая стратегия для нового мобильного приложения',
    'Бизнес-план для стартапа в сфере электронной коммерции',
];

export const TONE_OPTIONS = [
    { value: 'professional', label: 'Профессиональный' },
    { value: 'casual', label: 'Повседневный' },
    { value: 'academic', label: 'Академический' },
    { value: 'creative', label: 'Креативный' },
];

const SLIDES_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10];

const AiPresentationPage = () => {
    const router = useRouter();
    const [step, setStep] = useState<'form' | 'topics'>('form');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [isShowGenerationLoader, setIsShowGenerationLoader] = useState(false);

    // Form state
    const [description, setDescription] = useState('');
    const [numSlides, setNumSlides] = useState(5);
    const [tone, setTone] = useState('professional');

    const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
    const [goal, setGoal] = useState('');
    const [audience, setAudience] = useState('');

    // Topics state
    const [presentationTitle, setPresentationTitle] = useState('');
    const [presentationDescription, setPresentationDescription] = useState('');
    const [topics, setTopics] = useState<SlideTopic[]>([]);

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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
            const res = await fetch('/api/ai/topics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description, numSlides, tone, durationMinutes, goal, audience }),
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
            setIsShowGenerationLoader(false);
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

    // DnD handler
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setTopics(topics => {
                const oldIndex = topics.findIndex(topic => topic.id === active.id);
                const newIndex = topics.findIndex(topic => topic.id === over.id);

                return arrayMove(topics, oldIndex, newIndex);
            });
        }
    };

    const handleBack = () => setStep('form');

    const slideOptions = createListCollection({
        items: SLIDES_OPTIONS.map(num => ({ value: String(num), label: String(num) })),
    });

    const toneOptions = createListCollection({
        items: TONE_OPTIONS.map(opt => ({ value: opt.value, label: opt.label })),
    });

    const handleGeneratePresentation = async () => {
        if (!presentationTitle.trim()) {
            toast.error('Пожалуйста, введите название презентации');
            return;
        }

        if (topics.length === 0) {
            toast.error('Добавьте хотя бы один слайд');
            return;
        }

        setIsLoading(true);
        setIsShowGenerationLoader(true);
        try {
            // Generate the entire presentation in one request
            const response = await fetch('/api/ai/presentation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: presentationTitle,
                    prompt: presentationDescription,
                    topics: topics.map(topic => ({
                        title: topic.title,
                        instructions: topic.instructions,
                    })),
                    durationMinutes,
                    goal,
                    audience,
                    tone,
                }),
            });

            if (!response.ok) {
                if (response.status === 402) {
                    toast.error(
                        <Box>
                            Недостаточно средств для создания презентации.{' '}
                            <Link
                                href="/tokens"
                                target="_blank"
                                style={{ color: '#a20101', textDecoration: 'underline' }}
                            >
                                Пополните баланс
                            </Link>
                            .
                        </Box>
                    );
                    return;
                }

                throw new Error('Ошибка при создании презентации. Попробуйте еще раз.');
            }

            const data = await response.json();

            // Navigate to the editor
            router.push(`/docs/${data.presentation.id}`);
            toast.success('Презентация успешно создана!');
        } catch (error) {
            console.error('Error creating presentation:', error);
            toast.error('Ошибка при создании презентации. Попробуйте еще раз.');
        } finally {
            setIsLoading(false);
            setIsShowGenerationLoader(false);
        }
    };

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
                                    onValueChange={value => setNumSlides(Number(value.value))}
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
                                    onValueChange={value => setTone(value.value[0])}
                                    size="sm"
                                    width="100%"
                                >
                                    <Select.HiddenSelect />
                                    <Select.Label>Стилистика</Select.Label>
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

                        <Flex gap="16px" flexDirection="column" alignItems="flex-start">
                            <Box width="100%">
                                <Text fontSize="sm" as="label" display="block" marginBottom="8px">
                                    Длительность презентации
                                </Text>
                                <Input
                                    value={durationMinutes || ''}
                                    onChange={e => setDurationMinutes(e.target.value ? Number(e.target.value) : null)}
                                    placeholder="Сколько времени будет длиться презентация"
                                    aria-label="Длительность презентации"
                                    type="number"
                                    tabIndex={0}
                                />
                            </Box>
                            <Box width="100%">
                                <Text fontSize="sm" as="label" display="block" marginBottom="8px">
                                    Цель презентации
                                </Text>

                                <Textarea
                                    value={goal}
                                    onChange={e => setGoal(e.target.value)}
                                    placeholder="Какой цели должна служить презентация"
                                    aria-label="Цель презентации"
                                    tabIndex={0}
                                />
                            </Box>
                            <Box width="100%">
                                <Text fontSize={'sm'} as="label" display="block" marginBottom="8px">
                                    Аудитория презентации
                                </Text>
                                <Textarea
                                    value={audience}
                                    onChange={e => setAudience(e.target.value)}
                                    placeholder="Для какой аудитории создается презентация"
                                    aria-label="Аудитория презентации"
                                    tabIndex={0}
                                />
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
                        <Box>
                            <Flex alignItems="center" justifyContent="space-between" marginBottom="16px">
                                <Heading as="h2" size="md">
                                    Темы слайдов
                                </Heading>
                                <Text fontSize="sm" color="gray.600">
                                    Перетаскивайте слайды для изменения порядка
                                </Text>
                            </Flex>
                            
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={topics.map(topic => topic.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <Stack gap="16px">
                                        {topics.map((topic, idx) => (
                                            <SortableSlideCard
                                                key={topic.id}
                                                topic={topic}
                                                index={idx}
                                                onTopicChange={handleTopicChange}
                                                onInstructionsChange={handleInstructionsChange}
                                                onDelete={handleDeleteTopic}
                                            />
                                        ))}
                                    </Stack>
                                </SortableContext>
                            </DndContext>
                            
                            <Button 
                                onClick={handleAddTopic} 
                                aria-label="Добавить слайд" 
                                tabIndex={0}
                                marginTop="16px"
                                variant="outline"
                                width="100%"
                                borderStyle="dashed"
                                borderWidth="2px"
                                borderColor="gray.300"
                                _hover={{ borderColor: "blue.400", backgroundColor: "blue.50" }}
                            >
                                <FaPlus />
                                Добавить слайд
                            </Button>
                        </Box>
                    </Stack>

                    <Flex justifyContent="flex-end" marginTop="24px">
                        <Button
                            colorScheme="blue"
                            onClick={handleGeneratePresentation}
                            disabled={isLoading}
                            aria-label="Создать презентацию"
                            tabIndex={0}
                        >
                            Создать презентацию
                        </Button>
                    </Flex>
                </Box>
            )}
            {isShowGenerationLoader && <GenerationLoader isVisible={isShowGenerationLoader} />}
        </Box>
    );
};

export default AiPresentationPage;
