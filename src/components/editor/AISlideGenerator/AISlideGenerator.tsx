import React, { useState } from 'react';
import styles from './AISlideGenerator.module.css';
import { usePresentationStore } from '@/store/presentationStore';
import { toast } from 'sonner';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { Slide } from '@/types';
// import extractTextsFromPresentation from '@/utils/extractTextsFromPresentation';

interface AISlideGeneratorProps {
    presentationId: string;
    slideId: string;
    onClose: () => void;
}

const RELEVANT_TEMPLATES_IDS = [
    'text-image',
    'two-columns-headings',
    'three-columns',
    'title-bullets',
    'text-boxes-with-title',
];

// Get 5 most relevant templates from registry
const RELEVANT_TEMPLATES = [
    { id: 'auto', label: 'Автоматически', icon: '◻' },
    ...Object.entries(SlideTemplatesRegistry)
        // .filter(([id]) =>
        //     // Filter for templates that are good for general content
        //     RELEVANT_TEMPLATES_IDS.includes(id)
        // )
        // .slice(0, 4)
        .map(([id, template]) => ({
            id,
            label: template.name,
            icon: template.ui.icon ? '◫' : '•',
        })),
];

const AISlideGenerator: React.FC<AISlideGeneratorProps> = ({ presentationId, slideId, onClose }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState('auto');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            toast.error('Пожалуйста, опишите содержание слайда');
            return;
        }

        setIsLoading(true);
        try {
            // Get the current slide index and surrounding slides
            const getSlideIndex = usePresentationStore.getState().getSlideIndex;
            const slideIndex = getSlideIndex(presentationId, slideId);

            // Get all slides to provide context
            const presentation = usePresentationStore.getState().getPresentation(presentationId);
            if (!presentation) {
                toast.error('Не удалось получить презентацию');
                return;
            }
            // const slideTexts = extractTextsFromPresentation(presentation);
            // const surroundingSlides = slideTexts.slice(Math.max(0, slideIndex - 2), slideIndex + 2);

            // Call the AI slide generation API
            const response = await fetch('/api/ai/slide', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    presentationId,
                    slideIndex: slideIndex + 1, // Insert after current slide
                    prompt,
                    templateId: selectedTemplate,
                    // surroundingSlides,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || 'Failed to generate slide');
            }

            const { slide } = (await response.json()) as { slide: Slide };

            // Add the generated slide to the presentation
            const addSlide = usePresentationStore.getState().addSlide;
            addSlide(presentationId, slide, slideIndex + 1);

            toast.success('Слайд создан');
            onClose();
        } catch (error) {
            console.error('Error generating slide:', error);
            toast.error(error instanceof Error ? error.message : 'Не удалось создать слайд');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h2>Создать слайд</h2>
                <button onClick={onClose} className={styles.closeButton} aria-label="Закрыть">
                    ×
                </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                    <input
                        type="text"
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        placeholder="Опишите, что вы хотите создать"
                        className={styles.input}
                        disabled={isLoading}
                    />
                    <div className={styles.credits}>395 credits</div>
                </div>

                <div className={styles.templateSection}>
                    <p className={styles.templateTitle}>Выберите шаблон</p>
                    <div className={styles.templateGrid}>
                        {RELEVANT_TEMPLATES.map(template => (
                            <button
                                key={template.id}
                                type="button"
                                className={`${styles.templateButton} ${
                                    selectedTemplate === template.id ? styles.selectedTemplate : ''
                                }`}
                                onClick={() => setSelectedTemplate(template.id)}
                                disabled={isLoading}
                            >
                                <div className={styles.templateIcon}>{template.icon}</div>
                                <div className={styles.templateLabel}>{template.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                <button type="submit" className={styles.generateButton} disabled={isLoading}>
                    {isLoading ? 'Создание...' : 'Создать слайд'}
                </button>
            </form>
        </div>
    );
};

export default AISlideGenerator;
