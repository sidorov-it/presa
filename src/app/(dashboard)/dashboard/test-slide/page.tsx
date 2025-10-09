'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { SlideViewer } from '@/components/viewer';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import type { Slide } from '@/types';
import type { SupportedLLMProvider } from '@/types/llm';
import type { SlotKeyMapping } from '@/types/gigachat';
import styles from './page.module.css';

type ContentAmount = 'concise' | 'medium' | 'detailed';

interface TopicItem {
    title: string;
    instructions: string;
}

interface ThemesResponse {
    requestId: string;
    provider: SupportedLLMProvider;
    testScenario?: string;
    title?: string;
    topics: TopicItem[];
}

interface TemplateSelection {
    topicIndex: number;
    templateId: string;
    explanation: string;
}

interface TemplatesResponse {
    requestId: string;
    provider: SupportedLLMProvider;
    testScenario?: string;
    templateSelections: TemplateSelection[];
}

interface ContentResponse {
    requestId: string;
    provider: SupportedLLMProvider;
    testScenario?: string;
    functionArgs: Record<string, unknown>;
    slotMapping: Array<{ slotKey: string; mapping: SlotKeyMapping }>;
}

const providerOptions: Array<{ value: SupportedLLMProvider; label: string }> = [
    { value: 'gigachat', label: 'GigaChat' },
    { value: 'yagpt', label: 'YandexGPT' },
    { value: 'mock', label: 'MockGPT' },
];

const contentAmountOptions: Array<{ value: ContentAmount; label: string }> = [
    { value: 'concise', label: 'Краткий' },
    { value: 'medium', label: 'Средний' },
    { value: 'detailed', label: 'Подробный' },
];

const defaultTheme = {
    id: 'test-theme',
    name: 'Тестовая тема',
    isDefault: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    defaultForNewPresentations: false,
    colors: {
        primaryAccent: '#3182ce',
        primaryAccentTextColor: '#FFFFFF',
        secondaryAccents: ['#805ad5'],
        slideBackground: '#ffffff',
        pageBackground: {
            type: 'color',
            color: '#f7fafc',
            imageUrl: '',
        },
    },
    typography: {
        headingFont: 'Inter',
        headingWeight: 600,
        headingColor: '#2d3748',
        headingLineHeight: 1.2,
        headingLetterSpacing: 0,
        headingCapitalization: 'none',
        bodyFont: 'Inter',
        bodyWeight: 400,
        bodyColor: '#2d3748',
        bodyLineHeight: 1.5,
        bodyLetterSpacing: 0,
        bodyCapitalization: 'none',
    },
    design: {
        slide: {
            borderRadius: '8px',
            shadow: 'md',
            borderWidth: 'thin',
            borderColor: '#e2e8f0',
            opacity: 1,
            imageShape: null,
        },
        blocks: {
            backgroundColor: '#ffffff',
            backgroundBlockFillType: 'fill',
            borderWidth: 'thin',
            blockFillColorsType: 'primary',
            blockBackgroundCustomColors: [],
            shadow: 'sm',
        },
        buttons: {
            borderRadius: 'md',
        },
    },
} as const;

const stringify = (value: unknown) => JSON.stringify(value, null, 2);

const TestSlidePage: React.FC = () => {
    const [provider, setProvider] = useState<SupportedLLMProvider>('gigachat');
    const [testScenario, setTestScenario] = useState('');

    const [themesForm, setThemesForm] = useState({
        description: '',
        numSlides: '8',
        tone: 'neutral',
        contentAmount: 'medium' as ContentAmount,
        durationMinutes: '',
        goal: '',
        audience: '',
    });
    const [themesLoading, setThemesLoading] = useState(false);
    const [themesError, setThemesError] = useState('');
    const [themesResult, setThemesResult] = useState<ThemesResponse | null>(null);

    const [templatesForm, setTemplatesForm] = useState({
        title: '',
        prompt: '',
        topicsJson: '[]',
        tone: 'neutral',
        contentAmount: 'medium' as ContentAmount,
        durationMinutes: '',
        goal: '',
        audience: '',
    });
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [templatesError, setTemplatesError] = useState('');
    const [templatesResult, setTemplatesResult] = useState<TemplatesResponse | null>(null);

    const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [contentLoading, setContentLoading] = useState(false);
    const [contentError, setContentError] = useState('');
    const [contentResult, setContentResult] = useState<ContentResponse | null>(null);
    const [functionArgsDraft, setFunctionArgsDraft] = useState('');

    const [assemblyLoading, setAssemblyLoading] = useState(false);
    const [assemblyError, setAssemblyError] = useState('');
    const [assembledSlide, setAssembledSlide] = useState<Slide | null>(null);

    const topics = themesResult?.topics ?? [];

    useEffect(() => {
        if (!themesResult) {
            return;
        }

        setTemplatesForm(prev => ({
            ...prev,
            title: themesResult.title || prev.title || 'Черновая презентация',
            prompt: themesForm.description,
            topicsJson: stringify(themesResult.topics),
            tone: themesForm.tone,
            contentAmount: themesForm.contentAmount,
            durationMinutes: themesForm.durationMinutes,
            goal: themesForm.goal,
            audience: themesForm.audience,
        }));
        setSelectedSlideIndex(0);
    }, [
        themesResult,
        themesForm.description,
        themesForm.tone,
        themesForm.contentAmount,
        themesForm.durationMinutes,
        themesForm.goal,
        themesForm.audience,
    ]);

    useEffect(() => {
        if (!templatesResult || topics.length === 0) {
            return;
        }

        const initialSelection = templatesResult.templateSelections.find(
            selection => selection.topicIndex === selectedSlideIndex
        );

        if (initialSelection) {
            setSelectedTemplateId(initialSelection.templateId);
        }
    }, [templatesResult, selectedSlideIndex, topics.length]);

    useEffect(() => {
        if (!contentResult) {
            return;
        }

        setFunctionArgsDraft(stringify(contentResult.functionArgs));
    }, [contentResult]);

    const selectedTopic = topics[selectedSlideIndex];
    const selectedTemplate = selectedTemplateId ? SlideTemplatesRegistry[selectedTemplateId] : undefined;

    const handleGenerateThemes = async (event: FormEvent) => {
        event.preventDefault();
        setThemesError('');
        setThemesLoading(true);
        setTemplatesResult(null);
        setContentResult(null);
        setAssembledSlide(null);

        try {
            const numSlides = Number(themesForm.numSlides);
            if (!Number.isFinite(numSlides) || numSlides <= 0) {
                throw new Error('Укажите корректное количество слайдов');
            }

            const durationMinutes = themesForm.durationMinutes ? Number(themesForm.durationMinutes) : undefined;
            if (themesForm.durationMinutes && (Number.isNaN(durationMinutes) || durationMinutes < 0)) {
                throw new Error('Длительность должна быть положительным числом');
            }

            const response = await fetch('/api/test/llm/themes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    testScenario: provider === 'mock' ? testScenario || undefined : undefined,
                    input: {
                        description: themesForm.description,
                        numSlides,
                        tone: themesForm.tone,
                        contentAmount: themesForm.contentAmount,
                        durationMinutes,
                        goal: themesForm.goal || undefined,
                        audience: themesForm.audience || undefined,
                    },
                }),
            });

            const data = (await response.json()) as { error?: string } & ThemesResponse;
            if (!response.ok) {
                throw new Error(data.error || 'Не удалось получить темы');
            }

            setThemesResult(data);
        } catch (error) {
            setThemesError(error instanceof Error ? error.message : 'Неожиданная ошибка при генерации тем');
        } finally {
            setThemesLoading(false);
        }
    };

    const handleGenerateTemplates = async (event: FormEvent) => {
        event.preventDefault();
        setTemplatesError('');
        setTemplatesLoading(true);
        setTemplatesResult(null);
        setContentResult(null);
        setAssembledSlide(null);

        try {
            let parsedTopics: TopicItem[] = [];
            try {
                parsedTopics = JSON.parse(templatesForm.topicsJson) as TopicItem[];
            } catch {
                throw new Error('Не удалось разобрать topics JSON');
            }

            if (!Array.isArray(parsedTopics) || parsedTopics.length === 0) {
                throw new Error('Topics должен содержать хотя бы один элемент');
            }

            const durationMinutes = templatesForm.durationMinutes ? Number(templatesForm.durationMinutes) : undefined;
            if (templatesForm.durationMinutes && (Number.isNaN(durationMinutes) || durationMinutes < 0)) {
                throw new Error('Длительность должна быть положительным числом');
            }

            const response = await fetch('/api/test/llm/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    testScenario: provider === 'mock' ? testScenario || undefined : undefined,
                    payload: {
                        title: templatesForm.title,
                        prompt: templatesForm.prompt,
                        topics: parsedTopics,
                        contentAmount: templatesForm.contentAmount,
                        durationMinutes,
                        goal: templatesForm.goal || undefined,
                        audience: templatesForm.audience || undefined,
                        tone: templatesForm.tone,
                    },
                }),
            });

            const data = (await response.json()) as { error?: string } & TemplatesResponse;
            if (!response.ok) {
                throw new Error(data.error || 'Не удалось подобрать шаблоны');
            }

            setTemplatesResult(data);
            const initialSelection = data.templateSelections.find(
                selection => selection.topicIndex === selectedSlideIndex
            );
            if (initialSelection) {
                setSelectedTemplateId(initialSelection.templateId);
            }
        } catch (error) {
            setTemplatesError(error instanceof Error ? error.message : 'Неожиданная ошибка при подборе шаблонов');
        } finally {
            setTemplatesLoading(false);
        }
    };

    const handleGenerateContent = async (event: FormEvent) => {
        event.preventDefault();
        setContentError('');
        setContentLoading(true);
        setContentResult(null);
        setAssembledSlide(null);

        try {
            if (!selectedTopic) {
                throw new Error('Выберите тему слайда');
            }

            if (!selectedTemplateId) {
                throw new Error('Выберите шаблон');
            }

            const durationMinutes = templatesForm.durationMinutes ? Number(templatesForm.durationMinutes) : undefined;
            if (templatesForm.durationMinutes && (Number.isNaN(durationMinutes) || durationMinutes < 0)) {
                throw new Error('Длительность должна быть положительным числом');
            }

            const response = await fetch('/api/test/llm/content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    testScenario: provider === 'mock' ? testScenario || undefined : undefined,
                    payload: {
                        templateId: selectedTemplateId,
                        topic: selectedTopic.title,
                        instructions: selectedTopic.instructions,
                        slideIndex: selectedSlideIndex,
                        totalSlides: topics.length,
                        contentAmount: templatesForm.contentAmount,
                        durationMinutes,
                        goal: templatesForm.goal || undefined,
                        audience: templatesForm.audience || undefined,
                        tone: templatesForm.tone,
                    },
                }),
            });

            const data = (await response.json()) as { error?: string } & ContentResponse;
            if (!response.ok) {
                throw new Error(data.error || 'Не удалось сгенерировать контент');
            }

            setContentResult(data);
        } catch (error) {
            setContentError(error instanceof Error ? error.message : 'Неожиданная ошибка при генерации контента');
        } finally {
            setContentLoading(false);
        }
    };

    const handleAssembleSlide = async (event: FormEvent) => {
        event.preventDefault();
        setAssemblyError('');
        setAssemblyLoading(true);
        setAssembledSlide(null);

        try {
            if (!contentResult) {
                throw new Error('Сначала сгенерируйте контент');
            }

            if (!selectedTemplateId) {
                throw new Error('Шаблон не выбран');
            }

            if (!functionArgsDraft.trim()) {
                throw new Error('JSON с контентом пустой');
            }

            let parsedFunctionArgs: Record<string, unknown>;
            try {
                parsedFunctionArgs = JSON.parse(functionArgsDraft) as Record<string, unknown>;
            } catch {
                throw new Error('Не удалось распарсить JSON с контентом');
            }

            const response = await fetch('/api/test/llm/slide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider,
                    testScenario: provider === 'mock' ? testScenario || undefined : undefined,
                    payload: {
                        templateId: selectedTemplateId,
                        slotMapping: contentResult.slotMapping,
                        functionArgs: parsedFunctionArgs,
                        title: selectedTopic?.title,
                    },
                }),
            });

            const data = (await response.json()) as { error?: string; slide?: Slide };
            if (!response.ok || !data.slide) {
                throw new Error(data.error || 'Не удалось собрать слайд');
            }

            setAssembledSlide(data.slide);
        } catch (error) {
            setAssemblyError(error instanceof Error ? error.message : 'Не удалось собрать слайд');
        } finally {
            setAssemblyLoading(false);
        }
    };

    const templateOptions = useMemo(
        () =>
            Object.values(SlideTemplatesRegistry)
                .filter(template => !template.disabled)
                .map(template => ({ value: template.id, label: `${template.name} (${template.ui.category})` })),
        []
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>LLM Playground для генерации слайдов</h1>
                <p className={styles.subtitle}>
                    Воспроизводите отдельные этапы пайплайна: темы, шаблоны, контент и финальную сборку. Можно
                    подключать MockGPT сценарии или боевые провайдеры для ручной проверки.
                </p>
            </header>

            <section className={styles.controlPanel}>
                <div className={styles.controlGroup}>
                    <label className={styles.label} htmlFor="provider">
                        Провайдер
                    </label>
                    <select
                        id="provider"
                        className={styles.select}
                        value={provider}
                        onChange={event => {
                            const value = event.target.value as SupportedLLMProvider;
                            setProvider(value);
                            if (value !== 'mock') {
                                setTestScenario('');
                            }
                        }}
                    >
                        {providerOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={styles.controlGroup}>
                    <label className={styles.label} htmlFor="scenario">
                        MockGPT сценарий (опционально)
                    </label>
                    <input
                        id="scenario"
                        className={styles.input}
                        type="text"
                        placeholder="Например: pdf-bullet-fix"
                        value={testScenario}
                        onChange={event => setTestScenario(event.target.value)}
                        disabled={provider !== 'mock'}
                    />
                </div>
            </section>

            <section className={styles.stage}>
                <div className={styles.stageHeader}>
                    <h2 className={styles.stageTitle}>1. Генерация тем</h2>
                    {themesResult?.requestId && (
                        <span className={styles.requestId}>requestId: {themesResult.requestId}</span>
                    )}
                </div>
                <div className={styles.stageContent}>
                    <form className={styles.form} onSubmit={handleGenerateThemes}>
                        <label className={styles.label} htmlFor="description">
                            Описание презентации
                        </label>
                        <textarea
                            id="description"
                            className={styles.textarea}
                            placeholder="Опишите цель, аудиторию и ключевые пункты презентации"
                            value={themesForm.description}
                            onChange={event => setThemesForm(prev => ({ ...prev, description: event.target.value }))}
                            required
                        />

                        <div className={styles.formRow}>
                            <div className={styles.formField}>
                                <label className={styles.label} htmlFor="numSlides">
                                    Количество слайдов
                                </label>
                                <input
                                    id="numSlides"
                                    className={styles.input}
                                    type="number"
                                    min={1}
                                    value={themesForm.numSlides}
                                    onChange={event =>
                                        setThemesForm(prev => ({ ...prev, numSlides: event.target.value }))
                                    }
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.label} htmlFor="tone">
                                    Тон
                                </label>
                                <input
                                    id="tone"
                                    className={styles.input}
                                    type="text"
                                    placeholder="Например: вдохновляющий"
                                    value={themesForm.tone}
                                    onChange={event => setThemesForm(prev => ({ ...prev, tone: event.target.value }))}
                                />
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formField}>
                                <label className={styles.label} htmlFor="contentAmount">
                                    Объем контента
                                </label>
                                <select
                                    id="contentAmount"
                                    className={styles.select}
                                    value={themesForm.contentAmount}
                                    onChange={event =>
                                        setThemesForm(prev => ({
                                            ...prev,
                                            contentAmount: event.target.value as ContentAmount,
                                        }))
                                    }
                                >
                                    {contentAmountOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.label} htmlFor="duration">
                                    Длительность (мин.)
                                </label>
                                <input
                                    id="duration"
                                    className={styles.input}
                                    type="number"
                                    min={0}
                                    value={themesForm.durationMinutes}
                                    onChange={event =>
                                        setThemesForm(prev => ({
                                            ...prev,
                                            durationMinutes: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        <label className={styles.label} htmlFor="goal">
                            Цель и аудитория
                        </label>
                        <input
                            id="goal"
                            className={styles.input}
                            type="text"
                            placeholder="Цель презентации"
                            value={themesForm.goal}
                            onChange={event => setThemesForm(prev => ({ ...prev, goal: event.target.value }))}
                        />
                        <input
                            className={styles.input}
                            type="text"
                            placeholder="Аудитория"
                            value={themesForm.audience}
                            onChange={event => setThemesForm(prev => ({ ...prev, audience: event.target.value }))}
                        />

                        <button className={styles.primaryButton} type="submit" disabled={themesLoading}>
                            {themesLoading ? 'Генерация…' : 'Сгенерировать темы'}
                        </button>
                        {themesError && <div className={styles.error}>{themesError}</div>}
                    </form>

                    <div className={styles.stageOutput}>
                        <h3 className={styles.outputTitle}>Результат</h3>
                        {themesResult ? (
                            <pre className={styles.jsonViewer}>{stringify(themesResult)}</pre>
                        ) : (
                            <div className={styles.placeholder}>Сгенерированные темы появятся здесь</div>
                        )}
                    </div>
                </div>
            </section>

            <section className={styles.stage}>
                <div className={styles.stageHeader}>
                    <h2 className={styles.stageTitle}>2. Подбор шаблонов</h2>
                    {templatesResult?.requestId && (
                        <span className={styles.requestId}>requestId: {templatesResult.requestId}</span>
                    )}
                </div>
                <div className={styles.stageContent}>
                    <form className={styles.form} onSubmit={handleGenerateTemplates}>
                        <label className={styles.label} htmlFor="title">
                            Заголовок презентации
                        </label>
                        <input
                            id="title"
                            className={styles.input}
                            type="text"
                            value={templatesForm.title}
                            onChange={event => setTemplatesForm(prev => ({ ...prev, title: event.target.value }))}
                            required
                        />

                        <label className={styles.label} htmlFor="prompt">
                            Промпт для LLM
                        </label>
                        <textarea
                            id="prompt"
                            className={styles.textarea}
                            value={templatesForm.prompt}
                            onChange={event => setTemplatesForm(prev => ({ ...prev, prompt: event.target.value }))}
                            required
                        />

                        <label className={styles.label} htmlFor="topics">
                            Темы (JSON)
                        </label>
                        <textarea
                            id="topics"
                            className={styles.textarea}
                            value={templatesForm.topicsJson}
                            onChange={event => setTemplatesForm(prev => ({ ...prev, topicsJson: event.target.value }))}
                            required
                        />

                        <div className={styles.formRow}>
                            <div className={styles.formField}>
                                <label className={styles.label} htmlFor="tone-templates">
                                    Тон
                                </label>
                                <input
                                    id="tone-templates"
                                    className={styles.input}
                                    type="text"
                                    value={templatesForm.tone}
                                    onChange={event =>
                                        setTemplatesForm(prev => ({ ...prev, tone: event.target.value }))
                                    }
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.label} htmlFor="amount-templates">
                                    Объем
                                </label>
                                <select
                                    id="amount-templates"
                                    className={styles.select}
                                    value={templatesForm.contentAmount}
                                    onChange={event =>
                                        setTemplatesForm(prev => ({
                                            ...prev,
                                            contentAmount: event.target.value as ContentAmount,
                                        }))
                                    }
                                >
                                    {contentAmountOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formField}>
                                <label className={styles.label} htmlFor="duration-templates">
                                    Длительность
                                </label>
                                <input
                                    id="duration-templates"
                                    className={styles.input}
                                    type="number"
                                    min={0}
                                    value={templatesForm.durationMinutes}
                                    onChange={event =>
                                        setTemplatesForm(prev => ({
                                            ...prev,
                                            durationMinutes: event.target.value,
                                        }))
                                    }
                                />
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.label} htmlFor="goal-templates">
                                    Цель
                                </label>
                                <input
                                    id="goal-templates"
                                    className={styles.input}
                                    type="text"
                                    value={templatesForm.goal}
                                    onChange={event =>
                                        setTemplatesForm(prev => ({ ...prev, goal: event.target.value }))
                                    }
                                />
                            </div>
                        </div>

                        <label className={styles.label} htmlFor="audience-templates">
                            Аудитория
                        </label>
                        <input
                            id="audience-templates"
                            className={styles.input}
                            type="text"
                            value={templatesForm.audience}
                            onChange={event => setTemplatesForm(prev => ({ ...prev, audience: event.target.value }))}
                        />

                        <button className={styles.primaryButton} type="submit" disabled={templatesLoading}>
                            {templatesLoading ? 'Подбор…' : 'Подобрать шаблоны'}
                        </button>
                        {templatesError && <div className={styles.error}>{templatesError}</div>}
                    </form>

                    <div className={styles.stageOutput}>
                        <h3 className={styles.outputTitle}>Результат</h3>
                        {templatesResult ? (
                            <pre className={styles.jsonViewer}>{stringify(templatesResult)}</pre>
                        ) : (
                            <div className={styles.placeholder}>Подбор шаблонов появится здесь</div>
                        )}
                    </div>
                </div>
            </section>

            <section className={styles.stage}>
                <div className={styles.stageHeader}>
                    <h2 className={styles.stageTitle}>3. Генерация контента</h2>
                    {contentResult?.requestId && (
                        <span className={styles.requestId}>requestId: {contentResult.requestId}</span>
                    )}
                </div>
                <div className={styles.stageContent}>
                    <form className={styles.form} onSubmit={handleGenerateContent}>
                        <div className={styles.formRow}>
                            <div className={styles.formField}>
                                <label className={styles.label} htmlFor="slide-index">
                                    Слайд
                                </label>
                                <select
                                    id="slide-index"
                                    className={styles.select}
                                    value={selectedSlideIndex}
                                    onChange={event => {
                                        setSelectedSlideIndex(Number(event.target.value));
                                        setContentResult(null);
                                        setAssembledSlide(null);
                                    }}
                                >
                                    {topics.map((topic, index) => (
                                        <option key={topic.title} value={index}>
                                            {index + 1}. {topic.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formField}>
                                <label className={styles.label} htmlFor="template-id">
                                    Шаблон
                                </label>
                                <select
                                    id="template-id"
                                    className={styles.select}
                                    value={selectedTemplateId}
                                    onChange={event => {
                                        setSelectedTemplateId(event.target.value);
                                        setContentResult(null);
                                        setAssembledSlide(null);
                                    }}
                                >
                                    <option value="">Не выбран</option>
                                    {templateOptions.map(option => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedTemplate && (
                            <div className={styles.templateMeta}>
                                <span className={styles.templateName}>{selectedTemplate.name}</span>
                                <span className={styles.templateCategory}>{selectedTemplate.ui.category}</span>
                            </div>
                        )}

                        <label className={styles.label} htmlFor="topic-overview">
                            Инструкции для слайда
                        </label>
                        <textarea
                            id="topic-overview"
                            className={styles.textarea}
                            value={selectedTopic?.instructions ?? ''}
                            onChange={event => {
                                if (!topics[selectedSlideIndex]) {
                                    return;
                                }

                                const updatedTopics = [...topics];
                                updatedTopics[selectedSlideIndex] = {
                                    ...updatedTopics[selectedSlideIndex],
                                    instructions: event.target.value,
                                };
                                setTemplatesForm(prev => ({ ...prev, topicsJson: stringify(updatedTopics) }));
                                setThemesResult(prev => (prev ? { ...prev, topics: updatedTopics } : prev));
                            }}
                        />

                        <button
                            className={styles.primaryButton}
                            type="submit"
                            disabled={contentLoading || !selectedTemplateId}
                        >
                            {contentLoading ? 'Генерация…' : 'Сгенерировать контент'}
                        </button>
                        {contentError && <div className={styles.error}>{contentError}</div>}
                    </form>

                    <div className={styles.stageOutput}>
                        <h3 className={styles.outputTitle}>Результат</h3>
                        {contentResult ? (
                            <>
                                <details className={styles.details} open>
                                    <summary>functionArgs</summary>
                                    <pre className={styles.jsonViewer}>{stringify(contentResult.functionArgs)}</pre>
                                </details>
                                <details className={styles.details}>
                                    <summary>slotMapping</summary>
                                    <pre className={styles.jsonViewer}>{stringify(contentResult.slotMapping)}</pre>
                                </details>
                            </>
                        ) : (
                            <div className={styles.placeholder}>Контент появится здесь</div>
                        )}
                    </div>
                </div>
            </section>

            <section className={styles.stage}>
                <div className={styles.stageHeader}>
                    <h2 className={styles.stageTitle}>4. Сборка слайда</h2>
                    {assemblyError && <div className={styles.errorInline}>{assemblyError}</div>}
                </div>
                <div className={styles.stageContent}>
                    <form className={styles.formSmall} onSubmit={handleAssembleSlide}>
                        <label className={styles.label} htmlFor="function-args">
                            JSON с контентом
                        </label>
                        <textarea
                            id="function-args"
                            className={styles.textarea}
                            value={functionArgsDraft}
                            onChange={event => setFunctionArgsDraft(event.target.value)}
                            disabled={!contentResult}
                        />

                        <button
                            className={styles.primaryButton}
                            type="submit"
                            disabled={assemblyLoading || !contentResult}
                        >
                            {assemblyLoading ? 'Сборка…' : 'Собрать слайд'}
                        </button>
                    </form>

                    <div className={styles.outputStack}>
                        <div className={styles.stageOutput}>
                            <h3 className={styles.outputTitle}>JSON от LLM</h3>
                            {contentResult ? (
                                <pre className={styles.jsonViewer}>{stringify(contentResult.functionArgs)}</pre>
                            ) : (
                                <div className={styles.placeholder}>
                                    Здесь появится исходный JSON функции generate_slide_text
                                </div>
                            )}
                        </div>

                        <div className={styles.previewWrapper}>
                            <h3 className={styles.outputTitle}>Предпросмотр</h3>
                            {assembledSlide ? (
                                <div className={styles.previewCanvas}>
                                    <SlideViewer slide={assembledSlide} theme={defaultTheme} />
                                </div>
                            ) : (
                                <div className={styles.placeholder}>Слайд появится после сборки</div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default TestSlidePage;
