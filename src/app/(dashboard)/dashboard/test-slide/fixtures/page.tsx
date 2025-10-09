'use client';

import { useEffect, useMemo, useState } from 'react';
import { SlideViewer, ThemeStylesApplier } from '@/components/viewer';
import type { Slide } from '@/types';
import styles from './page.module.css';

interface FixtureSummary {
    id: string;
    requestId: string;
    topic: string;
    createdAt: string;
}

interface TemplateFixtures {
    templateId: string;
    templateName: string;
    fixtures: FixtureSummary[];
}

interface FixturesResponse {
    templates: TemplateFixtures[];
}

interface FixtureSlideResponse {
    slide: Slide;
    functionArgs: Record<string, unknown>;
    scenario?: { topic?: string; instructions?: string };
}

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

const FixturesPage = () => {
    const [templates, setTemplates] = useState<TemplateFixtures[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [selectedFixtureId, setSelectedFixtureId] = useState('');
    const [slide, setSlide] = useState<Slide | null>(null);
    const [functionArgs, setFunctionArgs] = useState<Record<string, unknown> | null>(null);
    const [scenario, setScenario] = useState<{ topic?: string; instructions?: string } | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const response = await fetch('/api/test/fixtures');
                const data = (await response.json()) as FixturesResponse;
                setTemplates(data.templates);
                if (data.templates.length > 0) {
                    setSelectedTemplateId(data.templates[0].templateId);
                    if (data.templates[0].fixtures.length > 0) {
                        setSelectedFixtureId(data.templates[0].fixtures[0].id);
                    }
                }
            } catch (err) {
                console.error('Failed to load fixtures', err);
                setError('Не удалось загрузить список заготовок');
            }
        };

        loadTemplates();
    }, []);

    const fixturesForTemplate = useMemo(() => {
        return templates.find(template => template.templateId === selectedTemplateId)?.fixtures ?? [];
    }, [templates, selectedTemplateId]);

    useEffect(() => {
        if (!selectedTemplateId || !selectedFixtureId) {
            return;
        }

        setIsLoading(true);
        setError(null);

        const loadFixtureSlide = async () => {
            try {
                const response = await fetch(
                    `/api/test/fixtures/${encodeURIComponent(selectedTemplateId)}/${encodeURIComponent(selectedFixtureId)}`
                );
                const data = (await response.json()) as FixtureSlideResponse & { error?: string };
                if (response.ok) {
                    setSlide(data.slide);
                    setFunctionArgs(data.functionArgs);
                    setScenario(data.scenario);
                } else {
                    setError(data.error ?? 'Не удалось собрать слайд');
                    setSlide(null);
                    setFunctionArgs(null);
                }
            } catch (err) {
                console.error('Failed to load fixture slide', err);
                setError('Ошибка при сборке слайда');
                setSlide(null);
                setFunctionArgs(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadFixtureSlide();
    }, [selectedTemplateId, selectedFixtureId]);

    const handleTemplateChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newTemplateId = event.target.value;
        setSelectedTemplateId(newTemplateId);
        const firstFixture = templates.find(template => template.templateId === newTemplateId)?.fixtures?.[0]?.id;
        setSelectedFixtureId(firstFixture ?? '');
    };

    const handleFixtureChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFixtureId(event.target.value);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Готовые LLM сценарии</h1>
                <p className={styles.subtitle}>
                    Выберите шаблон и сохраненный ответ от LLM, чтобы быстро собрать слайд и проверить макет на реальном
                    контенте.
                </p>
            </header>

            <section className={styles.controls}>
                <div className={styles.controlGroup}>
                    <label className={styles.label} htmlFor="template-select">
                        Шаблон
                    </label>
                    <select
                        id="template-select"
                        className={styles.select}
                        value={selectedTemplateId}
                        onChange={handleTemplateChange}
                    >
                        {templates.map(template => (
                            <option key={template.templateId} value={template.templateId}>
                                {template.templateName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.controlGroup}>
                    <label className={styles.label} htmlFor="fixture-select">
                        Вариант наполнения
                    </label>
                    <select
                        id="fixture-select"
                        className={styles.select}
                        value={selectedFixtureId}
                        onChange={handleFixtureChange}
                        disabled={fixturesForTemplate.length === 0}
                    >
                        {fixturesForTemplate.map(fixture => (
                            <option key={fixture.id} value={fixture.id}>
                                {fixture.topic}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            {error && <div className={styles.error}>{error}</div>}

            <section className={styles.previewSection}>
                <h2 className={styles.sectionTitle}>Предпросмотр</h2>
                {slide ? (
                    <ThemeStylesApplier theme={defaultTheme} className={styles.previewCanvas}>
                        <SlideViewer
                            slide={slide}
                            theme={defaultTheme}
                            primaryAccentColor={defaultTheme.colors.primaryAccent}
                        />
                    </ThemeStylesApplier>
                ) : (
                    <div className={styles.placeholder}>Выберите шаблон и вариант, чтобы собрать слайд</div>
                )}
            </section>

            <section className={styles.detailsSection}>
                <div className={styles.infoPanel}>
                    <h3 className={styles.sectionTitle}>Информация</h3>
                    {isLoading && <p className={styles.placeholder}>Загружаем данные...</p>}
                    {!isLoading && scenario && (
                        <div className={styles.infoBlock}>
                            {scenario.topic && <p className={styles.infoItem}>Тема: {scenario.topic}</p>}
                            {scenario.instructions && (
                                <p className={styles.infoItem}>Инструкции: {scenario.instructions}</p>
                            )}
                        </div>
                    )}
                    {!isLoading && !scenario && (
                        <p className={styles.placeholder}>Выберите вариант, чтобы увидеть описание</p>
                    )}
                </div>

                <div className={styles.jsonPanel}>
                    <h3 className={styles.sectionTitle}>Аргументы функции</h3>
                    {functionArgs ? (
                        <pre className={styles.jsonViewer}>{JSON.stringify(functionArgs, null, 2)}</pre>
                    ) : (
                        <p className={styles.placeholder}>Здесь появится JSON после выбора варианта</p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default FixturesPage;
