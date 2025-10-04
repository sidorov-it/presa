'use client';

import { useState } from 'react';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { Slide } from '@/types';
import { SlideViewer } from '@/components/viewer';
import styles from './page.module.css';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface TestSlidePageProps {}

const TestSlidePage: React.FC<TestSlidePageProps> = () => {
    const [jsonInput, setJsonInput] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [generatedSlide, setGeneratedSlide] = useState<Slide | null>(null);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Получаем список доступных шаблонов
    const templateOptions = Object.entries(SlideTemplatesRegistry).map(([id, template]) => ({
        value: id,
        label: `${template.name} (${template.ui.category})`,
    }));

    const handleGenerateSlide = async () => {
        if (!jsonInput.trim() || !selectedTemplate) {
            setError('Пожалуйста, введите JSON и выберите шаблон');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Отправляем запрос на сервер
            const response = await fetch('/api/test-slide', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jsonInput,
                    selectedTemplate,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ошибка сервера');
            }

            setGeneratedSlide(data.slide);
        } catch (err) {
            setError(`Ошибка при создании слайда: ${err instanceof Error ? err.message : 'Неизвестная ошибка'}`);
            console.error('Error generating slide:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setJsonInput('');
        setSelectedTemplate('');
        setGeneratedSlide(null);
        setError('');
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Тестирование генерации слайдов</h1>
                <p className={styles.description}>
                    Вставьте JSON из логов (functionArguments) и выберите шаблон для тестирования 6-го этапа генерации слайдов
                </p>
            </div>

            <div className={styles.content}>
                {/* Левая панель - ввод данных */}
                <div className={styles.leftPanel}>
                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>JSON из логов (functionArguments)</h2>
                        <textarea
                            className={styles.textarea}
                            value={jsonInput}
                            onChange={e => setJsonInput(e.target.value)}
                            placeholder='Вставьте JSON из логов, например: {"title": "Заголовок", "content": "Основной контент"}'
                        />
                        <button
                            className={`${styles.button} ${styles.buttonSecondary} ${styles.buttonSmall}`}
                            onClick={() =>
                                setJsonInput(
                                    '{"title": "Тестовый заголовок", "content": "Это тестовый контент для проверки генерации слайда", "subtitle": "Подзаголовок"}'
                                )
                            }
                        >
                            Вставить пример JSON
                        </button>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles.sectionTitle}>Выберите шаблон</h2>
                        <select
                            className={styles.select}
                            value={selectedTemplate}
                            onChange={e => setSelectedTemplate(e.target.value)}
                        >
                            <option value="">Выберите шаблон слайда</option>
                            {templateOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.buttonGroup}>
                        <button
                            className={`${styles.button} ${styles.buttonPrimary}`}
                            onClick={handleGenerateSlide}
                            disabled={!jsonInput.trim() || !selectedTemplate || isLoading}
                        >
                            {isLoading ? 'Генерация...' : 'Создать слайд'}
                        </button>
                        <button
                            className={`${styles.button} ${styles.buttonSecondary}`}
                            onClick={handleClear}
                            disabled={isLoading}
                        >
                            Очистить
                        </button>
                    </div>

                    {error && (
                        <div className={styles.alert}>
                            <div className={styles.alertTitle}>Ошибка!</div>
                            <div className={styles.alertDescription}>{error}</div>
                        </div>
                    )}
                </div>

                {/* Правая панель - предварительный просмотр */}
                <div className={styles.rightPanel}>
                    <h2 className={styles.previewTitle}>Предварительный просмотр слайда</h2>

                    {generatedSlide ? (
                        <div className={styles.previewContainer}>
                            <SlideViewer
                                slide={generatedSlide}
                                theme={{
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
                                            buttonColor: '#3182ce',
                                            buttonShape: 'rounded',
                                            linkColor: '#3182ce',
                                        },
                                    },
                                }}
                                primaryAccentColor="#3182ce"
                                isSlidePreview={true}
                                showImagePlaceholder={true}
                                hasActiveSubscription={true}
                            />
                        </div>
                    ) : (
                        <div className={styles.previewPlaceholder}>Слайд будет отображен здесь после генерации</div>
                    )}
                </div>
            </div>

            {/* Информация о шаблоне */}
            {selectedTemplate && SlideTemplatesRegistry[selectedTemplate] && (
                <div className={styles.templateInfo}>
                    <h3 className={styles.templateInfoTitle}>Информация о выбранном шаблоне</h3>
                    <div className={styles.templateInfoList}>
                        <div className={styles.templateInfoItem}>
                            <strong>Название:</strong> {SlideTemplatesRegistry[selectedTemplate].name}
                        </div>
                        <div className={styles.templateInfoItem}>
                            <strong>Категория:</strong> {SlideTemplatesRegistry[selectedTemplate].ui.category}
                        </div>
                        <div className={styles.templateInfoItem}>
                            <strong>Описание:</strong> {SlideTemplatesRegistry[selectedTemplate].ui.description}
                        </div>
                        <div className={styles.templateInfoItem}>
                            <strong>LLM описание:</strong> {SlideTemplatesRegistry[selectedTemplate].llm.description}
                        </div>
                        <div className={styles.templateInfoItem}>
                            <strong>Элементы:</strong>{' '}
                            {SlideTemplatesRegistry[selectedTemplate].layouts.reduce(
                                (acc, layout) => acc + layout.elements.length,
                                0
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestSlidePage;