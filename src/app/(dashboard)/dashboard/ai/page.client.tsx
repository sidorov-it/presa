'use client';

import { useState, useMemo } from 'react';
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
import { FaPlus, FaTrash, FaGripVertical, FaFileAlt, FaEdit, FaUpload, FaClipboardList, FaCrown } from 'react-icons/fa';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { generateId } from '@/utils/id';
import { useSubscriptionCheck } from '@/hooks/useSubscriptionCheck';
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
import { CSS } from '@dnd-kit/utilities';

interface SlideTopic {
    id: string;
    title: string;
    instructions: string;
}

interface DocumentInfo {
    filename: string;
    extractedText: string;
    tokenCount: number;
}

type CreationMethod = 'description' | 'document' | 'plan';
type Step = 'method' | 'form' | 'topics' | 'upload' | 'document-form' | 'plan';

// Method selection cards data
const CREATION_METHODS = [
    {
        id: 'description' as CreationMethod,
        title: 'Из описания',
        description: 'Опишите вашу презентацию, и ИИ создаст структуру и содержание',
        icon: FaEdit,
        color: 'blue',
    },
    {
        id: 'document' as CreationMethod,
        title: 'Из документа',
        description: 'Загрузите документ (PDF, DOCX, PPTX, TXT) для создания презентации',
        icon: FaUpload,
        color: 'green',
    },
    // {
    //     id: 'plan' as CreationMethod,
    //     title: 'Из готового плана',
    //     description: 'Вставьте готовый план презентации для быстрого создания',
    //     icon: FaClipboardList,
    //     color: 'purple',
    // },
];

// Sortable slide topic component
const SortableSlideCard = ({
    topic,
    index,
    onTopicChange,
    onInstructionsChange,
    onDelete,
}: {
    topic: SlideTopic;
    index: number;
    onTopicChange: (id: string, value: string) => void;
    onInstructionsChange: (id: string, value: string) => void;
    onDelete: (id: string) => void;
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: topic.id });

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
            backgroundColor={isDragging ? 'gray.50' : 'white'}
            boxShadow="sm"
            _hover={{ boxShadow: 'md' }}
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
                    _hover={{ color: 'gray.600' }}
                    _active={{ cursor: 'grabbing' }}
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
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
                    />
                    <Text as="label" fontWeight="bold" display="block" marginBottom="8px" color="gray.700">
                        Инструкции для слайда
                    </Text>
                    <Textarea
                        value={topic.instructions}
                        onChange={e => onInstructionsChange(topic.id, e.target.value)}
                        aria-label={`Инструкции для слайда ${index + 1}`}
                        tabIndex={0}
                        rows={3}
                        borderColor="gray.300"
                        _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px #3182ce' }}
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
                    _hover={{ backgroundColor: 'red.50' }}
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

export const CONTENT_AMOUNT_OPTIONS = [
    { value: 'concise', label: 'Краткий' },
    { value: 'medium', label: 'Средний' },
    { value: 'detailed', label: 'Подробный' },
];

const SLIDES_OPTIONS_PREMIUM = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

const AiPresentationPage = () => {
    const router = useRouter();
    const { hasActiveSubscription, features } = useSubscriptionCheck();
    const [step, setStep] = useState<Step>('method');
    const [creationMethod, setCreationMethod] = useState<CreationMethod | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isShowGenerationLoader, setIsShowGenerationLoader] = useState(false);

    // Form state
    const [description, setDescription] = useState('');
    const [numSlides, setNumSlides] = useState(5);
    const [tone, setTone] = useState('professional');
    const [contentAmount, setContentAmount] = useState('medium');
    const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
    const [goal, setGoal] = useState('');
    const [audience, setAudience] = useState('');

    // Document upload state
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null);

    // Plan input state
    const [planText, setPlanText] = useState('');

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

    // Method selection handlers
    const handleMethodSelect = (method: CreationMethod) => {
        setCreationMethod(method);
        if (method === 'description') {
            setStep('form');
        } else if (method === 'document') {
            setStep('upload');
        } else if (method === 'plan') {
            setStep('plan');
        }
    };

    // Document upload handlers
    const handleFileSelect = (file: File) => {
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            //word
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            //pptx
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ];

        if (!allowedTypes.includes(file.type)) {
            toast.error('Поддерживаются только файлы PDF, DOCX, PPTX и TXT');
            return;
        }

        const maxSize = hasActiveSubscription ? 10 * 1024 * 1024 : 5 * 1024 * 1024;

        if (file.size > maxSize) {
            // 5MB limit
            setError(`Размер файла превышает разрешенный лимит в ${maxSize / 1024 / 1024} МБ`);
            setUploadedFile(file); // Устанавливаем файл, но показываем ошибку
            return;
        }

        setError(''); // Очищаем ошибку если файл подходящего размера
        setUploadedFile(file);
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDocumentUpload = async () => {
        if (!uploadedFile) {
            setError('Пожалуйста, выберите файл для загрузки.');
            return;
        }

        if (uploadedFile.size > 5 * 1024 * 1024) {
            setError('Размер файла превышает разрешенный лимит в 5 МБ');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', uploadedFile);

            const res = await fetch('/api/ai/document/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                if (res.status === 403) {
                    const data = await res.json();
                    setError(`Максимальный размер файла: ${data.maxSizeAllowed} МБ`);
                    return;
                }
                throw new Error('Ошибка загрузки документа');
            }

            const data = await res.json();

            setDocumentInfo({
                filename: uploadedFile.name,
                extractedText: data.extractedText,
                tokenCount: data.tokenCount,
            });

            setStep('document-form');
        } catch {
            setError('Ошибка загрузки документа. Попробуйте еще раз.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDocumentPresentationCreate = async () => {
        if (!documentInfo) {
            setError('Информация о документе не найдена.');
            return;
        }

        setError('');
        setIsLoading(true);
        setIsShowGenerationLoader(true);

        try {
            const response = await fetch('/api/ai/document/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    extractedText: documentInfo.extractedText,
                    filename: documentInfo.filename,
                    numSlides,
                    tone,
                    contentAmount,
                    durationMinutes,
                    goal,
                    audience,
                }),
            });

            if (!response.ok) {
                if (response.status === 402) {
                    toast.error(
                        <Box>
                            Недостаточно средств для создания презентации.{' '}
                            <Link
                                href="/payment"
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
                throw new Error('Ошибка при создании презентации');
            }

            const presentationData = await response.json();
            router.push(`/docs/${presentationData.presentation.id}`);
            toast.success('Презентация успешно создана!');
        } catch {
            setError('Ошибка создания презентации. Попробуйте еще раз.');
        } finally {
            setIsLoading(false);
            setIsShowGenerationLoader(false);
        }
    };

    // Plan input handlers
    const handlePlanSubmit = async () => {
        if (!planText.trim()) {
            setError('Пожалуйста, введите план презентации.');
            return;
        }

        setError('');
        setIsLoading(true);
        setIsShowGenerationLoader(true);

        try {
            const res = await fetch('/api/ai/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan: planText,
                    tone,
                    contentAmount,
                    durationMinutes,
                    goal,
                    audience,
                }),
            });

            if (!res.ok) throw new Error('Ошибка обработки плана');

            const data = await res.json();

            // For plan-based creation, skip topics editing and go directly to generation
            const response = await fetch('/api/ai/presentation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: data.title || 'Презентация из плана',
                    prompt: data.description || planText,
                    topics: data.topics.map((topic: any) => ({
                        title: topic.title,
                        instructions: topic.instructions,
                    })),
                    durationMinutes,
                    goal,
                    audience,
                    tone,
                    contentAmount,
                }),
            });

            if (!response.ok) {
                if (response.status === 402) {
                    toast.error(
                        <Box>
                            Недостаточно средств для создания презентации.{' '}
                            <Link
                                href="/payment"
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
                throw new Error('Ошибка при создании презентации');
            }

            const presentationData = await response.json();
            router.push(`/docs/${presentationData.presentation.id}`);
            toast.success('Презентация успешно создана!');
        } catch {
            setError('Ошибка обработки плана. Попробуйте еще раз.');
        } finally {
            setIsLoading(false);
            setIsShowGenerationLoader(false);
        }
    };

    // Existing handlers
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
                body: JSON.stringify({
                    description,
                    numSlides,
                    tone,
                    contentAmount,
                    durationMinutes,
                    goal,
                    audience,
                }),
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

    const handleBack = () => {
        if (step === 'topics') {
            if (creationMethod === 'description') {
                setStep('form');
            } else if (creationMethod === 'document') {
                setStep('document-form');
            } else if (creationMethod === 'plan') {
                setStep('plan');
            }
        } else if (step === 'document-form') {
            setStep('upload');
            setDocumentInfo(null);
        } else {
            setStep('method');
            setCreationMethod(null);
        }
    };

    // Создаем опции слайдов с информацией о доступности
    const slideOptions = useMemo(
        () =>
            createListCollection({
                items: SLIDES_OPTIONS_PREMIUM.map(num => ({
                    value: String(num),
                    label: String(num),
                    disabled: num > 10 && !hasActiveSubscription,
                })),
            }),
        [hasActiveSubscription]
    );

    // Обработчик изменения количества слайдов с проверкой подписки
    const handleSlidesChange = (value: string) => {
        const selectedSlides = Number(value);

        // Проверяем, что опция не заблокирована
        if (selectedSlides > 10 && !hasActiveSubscription) {
            toast.error(
                `Для создания ${selectedSlides} слайдов требуется подписка. Максимум без подписки: 10 слайдов.`
            );
            return;
        }

        setNumSlides(selectedSlides);
    };

    const toneOptions = createListCollection({
        items: TONE_OPTIONS.map(opt => ({ value: opt.value, label: opt.label })),
    });

    const contentAmountOptions = createListCollection({
        items: CONTENT_AMOUNT_OPTIONS.map(opt => ({ value: opt.value, label: opt.label })),
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
                    contentAmount,
                }),
            });

            if (!response.ok) {
                if (response.status === 402) {
                    toast.error(
                        <Box>
                            Недостаточно средств для создания презентации.{' '}
                            <Link
                                href="/payment"
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

            {/* Method selection step */}
            {step === 'method' && (
                <Stack gap="24px">
                    <Text textAlign="center" color="gray.600" marginBottom="16px">
                        Выберите способ создания презентации
                    </Text>
                    <Stack gap="16px">
                        {CREATION_METHODS.map(method => {
                            const IconComponent = method.icon;
                            return (
                                <Card.Root
                                    key={method.id}
                                    padding="20px"
                                    border="2px solid"
                                    borderColor="gray.200"
                                    borderRadius="12px"
                                    cursor="pointer"
                                    _hover={{
                                        borderColor: `${method.color}.400`,
                                        backgroundColor: `${method.color}.50`,
                                        transform: 'translateY(-2px)',
                                        boxShadow: 'lg',
                                    }}
                                    transition="all 0.2s"
                                    onClick={() => handleMethodSelect(method.id)}
                                    tabIndex={0}
                                    aria-label={`Выбрать метод: ${method.title}`}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleMethodSelect(method.id);
                                        }
                                    }}
                                >
                                    <Flex alignItems="center" gap="16px">
                                        <Flex
                                            alignItems="center"
                                            justifyContent="center"
                                            width="48px"
                                            height="48px"
                                            backgroundColor={`${method.color}.100`}
                                            borderRadius="12px"
                                            color={`${method.color}.600`}
                                        >
                                            <IconComponent size="24px" />
                                        </Flex>
                                        <Box flex="1">
                                            <Text fontWeight="bold" fontSize="lg" marginBottom="4px">
                                                {method.title}
                                            </Text>
                                            <Text color="gray.600" fontSize="sm">
                                                {method.description}
                                            </Text>
                                        </Box>
                                    </Flex>
                                </Card.Root>
                            );
                        })}
                    </Stack>
                </Stack>
            )}

            {/* Document upload step */}
            {step === 'upload' && (
                <Stack gap="24px">
                    <Button onClick={handleBack} aria-label="Назад к выбору метода" tabIndex={0}>
                        ← Назад
                    </Button>

                    <Box>
                        <Text fontSize="xl" fontWeight="bold" marginBottom="16px">
                            Загрузка документа
                        </Text>
                        <Text color="gray.600" marginBottom="24px">
                            Загрузите документ в формате PDF, DOCX, PPTX или TXT для создания презентации
                        </Text>

                        {/* File upload area */}
                        <Box
                            border="2px dashed"
                            borderColor={isDragOver ? 'blue.400' : 'gray.300'}
                            borderRadius="12px"
                            padding="40px"
                            textAlign="center"
                            backgroundColor={isDragOver ? 'blue.50' : 'gray.50'}
                            transition="all 0.2s"
                            onDragOver={e => {
                                e.preventDefault();
                                setIsDragOver(true);
                            }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleFileDrop}
                        >
                            {uploadedFile ? (
                                <Stack alignItems="center" gap="12px">
                                    <FaFileAlt size="48px" color="#4299e1" />
                                    <Text fontWeight="bold">{uploadedFile.name}</Text>
                                    <Text fontSize="sm" color="gray.600">
                                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} МБ
                                    </Text>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setUploadedFile(null);
                                            setError('');
                                        }} 
                                        size="sm"
                                    >
                                        Удалить файл
                                    </Button>
                                </Stack>
                            ) : (
                                <Stack alignItems="center" gap="16px">
                                    <FaUpload size="48px" color="#a0aec0" />
                                    <Text fontSize="lg" fontWeight="bold">
                                        Перетащите файл сюда или выберите
                                    </Text>
                                    <Text fontSize="sm" color="gray.600">
                                        Поддерживаются PDF, DOCX, PPTX, TXT (до {hasActiveSubscription ? '10' : '5'} МБ)
                                    </Text>
                                    <Box as="label" cursor="pointer">
                                        <Button as="span" colorScheme="blue">
                                            Выбрать файл
                                        </Button>
                                        <Input
                                            id="file-input"
                                            type="file"
                                            accept=".pdf,.docx,.pptx,.txt"
                                            onChange={handleFileInputChange}
                                            display="none"
                                        />
                                    </Box>
                                </Stack>
                            )}
                        </Box>

                        {error && (
                            <Text color="red.500" marginTop="16px">
                                {error}
                            </Text>
                        )}

                        <Button
                            onClick={handleDocumentUpload}
                            colorScheme="blue"
                            disabled={isLoading || !uploadedFile || !!error}
                            marginTop="24px"
                            width="100%"
                            size="lg"
                        >
                            {isLoading ? 'Загрузка...' : 'Загрузить'}
                        </Button>
                    </Box>
                </Stack>
            )}

            {/* Document form step */}
            {step === 'document-form' && documentInfo && (
                <Stack gap="24px">
                    <Button onClick={handleBack} aria-label="Назад к загрузке" tabIndex={0}>
                        ← Назад
                    </Button>

                    <Box>
                        <Text fontSize="xl" fontWeight="bold" marginBottom="16px">
                            Информация о документе
                        </Text>

                        {/* Document info */}
                        <Card.Root padding="16px" marginBottom="24px" backgroundColor="gray.50">
                            <Stack gap="12px">
                                <Flex alignItems="center" gap="12px">
                                    <FaFileAlt size="20px" color="#4299e1" />
                                    <Text fontWeight="bold">{documentInfo.filename}</Text>
                                </Flex>
                                <Text fontSize="sm" color="gray.600">
                                    Токенов: {documentInfo.tokenCount.toLocaleString()}
                                </Text>
                            </Stack>
                        </Card.Root>

                        {/* Extracted text preview */}
                        <Box marginBottom="24px">
                            <Text fontWeight="bold" marginBottom="8px">
                                Извлеченный текст:
                            </Text>
                            <Box
                                maxHeight="200px"
                                overflowY="auto"
                                padding="12px"
                                border="1px solid"
                                borderColor="gray.300"
                                borderRadius="8px"
                                backgroundColor="gray.50"
                            >
                                <Text fontSize="sm" whiteSpace="pre-wrap">
                                    {documentInfo.extractedText.length > 1000
                                        ? `${documentInfo.extractedText.substring(0, 1000)}...`
                                        : documentInfo.extractedText}
                                </Text>
                            </Box>
                        </Box>

                        {/* Form fields */}
                        <Stack gap="16px">
                            <Flex gap="16px" alignItems="flex-end">
                                <Box flex="1">
                                    <Select.Root
                                        collection={slideOptions}
                                        value={[String(numSlides)]}
                                        onValueChange={value => handleSlidesChange(value.value[0])}
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
                                                        <Select.Item
                                                            item={option}
                                                            key={option.value}
                                                            style={{
                                                                opacity: option.disabled ? 0.5 : 1,
                                                                cursor: option.disabled ? 'not-allowed' : 'pointer',
                                                                color: option.disabled ? '#9ca3af' : 'inherit',
                                                                pointerEvents: option.disabled ? 'none' : 'auto',
                                                            }}
                                                        >
                                                            <Flex alignItems="center" gap="8px">
                                                                {option.label}
                                                                {option.disabled && (
                                                                    <FaCrown size={12} color="#fbbf24" />
                                                                )}
                                                            </Flex>
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

                            <Box width="100%">
                                <Select.Root
                                    collection={contentAmountOptions}
                                    value={[contentAmount]}
                                    onValueChange={value => setContentAmount(value.value[0])}
                                    size="sm"
                                    width="100%"
                                >
                                    <Select.HiddenSelect />
                                    <Select.Label>Объем контента на слайдах</Select.Label>
                                    <Select.Control>
                                        <Select.Trigger>
                                            <Select.ValueText placeholder="Выберите объем контента" />
                                        </Select.Trigger>
                                        <Select.IndicatorGroup>
                                            <Select.Indicator />
                                        </Select.IndicatorGroup>
                                    </Select.Control>
                                    <Portal>
                                        <Select.Positioner>
                                            <Select.Content>
                                                {contentAmountOptions.items.map(option => (
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

                            <Box width="100%">
                                <Text fontSize="sm" as="label" display="block" marginBottom="8px">
                                    Длительность презентации (минуты)
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
                                <Text fontSize="sm" as="label" display="block" marginBottom="8px">
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
                        </Stack>

                        {error && (
                            <Text color="red.500" marginTop="16px">
                                {error}
                            </Text>
                        )}

                        <Button
                            onClick={handleDocumentPresentationCreate}
                            colorScheme="blue"
                            disabled={isLoading}
                            marginTop="24px"
                            width="100%"
                            size="lg"
                        >
                            {isLoading ? 'Создание презентации...' : 'Создать презентацию'}
                        </Button>
                    </Box>
                </Stack>
            )}

            {/* Plan input step */}
            {step === 'plan' && (
                <Stack gap="24px">
                    <Button onClick={handleBack} aria-label="Назад к выбору метода" tabIndex={0}>
                        ← Назад
                    </Button>

                    <Box>
                        <Text fontSize="xl" fontWeight="bold" marginBottom="16px">
                            Готовый план презентации
                        </Text>
                        <Text color="gray.600" marginBottom="24px">
                            Вставьте готовый план или структуру презентации для быстрого создания
                        </Text>

                        <Box>
                            <Text as="label" fontWeight="bold" display="block" marginBottom="8px">
                                План презентации
                            </Text>
                            <Textarea
                                value={planText}
                                onChange={e => setPlanText(e.target.value)}
                                placeholder="Например:&#10;1. Введение&#10;2. Проблема и её актуальность&#10;3. Предлагаемое решение&#10;4. Преимущества&#10;5. Заключение"
                                rows={10}
                                aria-label="План презентации"
                                tabIndex={0}
                            />
                        </Box>

                        {/* Additional options */}
                        <Stack gap="16px" marginTop="24px">
                            <Flex gap="16px" alignItems="flex-end">
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
                                <Box flex="1">
                                    <Select.Root
                                        collection={contentAmountOptions}
                                        value={[contentAmount]}
                                        onValueChange={value => setContentAmount(value.value[0])}
                                        size="sm"
                                        width="100%"
                                    >
                                        <Select.HiddenSelect />
                                        <Select.Label>Объем контента на слайдах</Select.Label>
                                        <Select.Control>
                                            <Select.Trigger>
                                                <Select.ValueText placeholder="Выберите объем" />
                                            </Select.Trigger>
                                            <Select.IndicatorGroup>
                                                <Select.Indicator />
                                            </Select.IndicatorGroup>
                                        </Select.Control>
                                        <Portal>
                                            <Select.Positioner>
                                                <Select.Content>
                                                    {contentAmountOptions.items.map(option => (
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
                                        onChange={e =>
                                            setDurationMinutes(e.target.value ? Number(e.target.value) : null)
                                        }
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
                                        placeholder="Какой цели должна служить презентации"
                                        aria-label="Цель презентации"
                                        tabIndex={0}
                                    />
                                </Box>
                                <Box width="100%">
                                    <Text fontSize="sm" as="label" display="block" marginBottom="8px">
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
                        </Stack>

                        {/* Информация о подписке */}
                        {!hasActiveSubscription && (
                            <Card.Root backgroundColor="blue.50" borderColor="blue.200" marginTop="16px">
                                <Card.Body>
                                    <Flex alignItems="center" gap="8px">
                                        <FaCrown color="#3182ce" />
                                        <Text fontSize="sm" color="blue.700">
                                            <strong>Получите больше возможностей с подпиской:</strong>
                                        </Text>
                                    </Flex>
                                    <Text fontSize="sm" color="blue.600" marginTop="4px">
                                        • До {SLIDES_OPTIONS_PREMIUM[SLIDES_OPTIONS_PREMIUM.length - 1]} слайдов вместо{' '}
                                        {features.maxSlides}
                                        <br />
                                        • Без водяного знака при экспорте
                                        <br />• Приоритетная обработка запросов
                                    </Text>
                                    <Link
                                        href="/payment"
                                        color="blue.600"
                                        fontSize="sm"
                                        marginTop="8px"
                                        display="inline-block"
                                    >
                                        Оформить подписку →
                                    </Link>
                                </Card.Body>
                            </Card.Root>
                        )}

                        {error && (
                            <Text color="red.500" marginTop="16px">
                                {error}
                            </Text>
                        )}

                        <Button
                            onClick={handlePlanSubmit}
                            colorScheme="blue"
                            disabled={isLoading || !planText.trim()}
                            marginTop="24px"
                            width="100%"
                        >
                            {isLoading ? 'Создание презентации...' : 'Создать презентацию из плана'}
                        </Button>
                    </Box>
                </Stack>
            )}

            {/* Description form step (existing flow) */}
            {step === 'form' && (
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        handleGenerateTopics();
                    }}
                >
                    <Button marginBottom="16px" onClick={handleBack} aria-label="Назад к выбору метода" tabIndex={0}>
                        ← Назад
                    </Button>
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
                                    onValueChange={value => handleSlidesChange(value.value[0])}
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
                                                    <Select.Item
                                                        item={option}
                                                        key={option.value}
                                                        style={{
                                                            opacity: option.disabled ? 0.5 : 1,
                                                            cursor: option.disabled ? 'not-allowed' : 'pointer',
                                                            color: option.disabled ? '#9ca3af' : 'inherit',
                                                            pointerEvents: option.disabled ? 'none' : 'auto',
                                                        }}
                                                    >
                                                        <Flex alignItems="center" gap="8px">
                                                            {option.label}
                                                            {option.disabled && <FaCrown size={12} color="#fbbf24" />}
                                                        </Flex>
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

                        <Box width="100%">
                            <Select.Root
                                collection={contentAmountOptions}
                                value={[contentAmount]}
                                onValueChange={value => setContentAmount(value.value[0])}
                                size="sm"
                                width="100%"
                            >
                                <Select.HiddenSelect />
                                <Select.Label>Объем контента на слайдах</Select.Label>
                                <Select.Control>
                                    <Select.Trigger>
                                        <Select.ValueText placeholder="Выберите объем контента" />
                                    </Select.Trigger>
                                    <Select.IndicatorGroup>
                                        <Select.Indicator />
                                    </Select.IndicatorGroup>
                                </Select.Control>
                                <Portal>
                                    <Select.Positioner>
                                        <Select.Content>
                                            {contentAmountOptions.items.map(option => (
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

            {/* Topics editing step */}
            {step === 'topics' && (
                <Box>
                    <Button marginBottom="16px" onClick={handleBack} aria-label="Назад" tabIndex={0}>
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

                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
                                _hover={{ borderColor: 'blue.400', backgroundColor: 'blue.50' }}
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
