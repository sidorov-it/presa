import React, { useState } from 'react';
import { SlideTemplatesRegistry } from '@/templates/SlideTemplatesRegistry';
import { SlideTemplateCore } from '@/types/templates';
import styles from './TemplateTestModal.module.css';

interface TemplateTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectTemplate: (templateId: string) => void;
}

const TemplateTestModal: React.FC<TemplateTestModalProps> = ({ isOpen, onClose, onSelectTemplate }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Filter out disabled templates
    const availableTemplates = Object.values(SlideTemplatesRegistry).filter(template => !template.disabled);

    // Group templates by category
    const templatesByCategory = availableTemplates.reduce((acc, template) => {
        const category = template.ui.category || 'other';
        if (!acc[category]) {
            acc[category] = [];
        }
        acc[category].push(template);
        return acc;
    }, {} as Record<string, SlideTemplateCore[]>);

    const categoryLabels = {
        'basic-templates': 'Базовые шаблоны',
        'column-templates': 'Колонки',
        'list-templates': 'Списки',
        'image-templates': 'Изображения',
        'chart-templates': 'Диаграммы',
        'accent-templates': 'Акценты',
        'intro-templates': 'Приветствие',
        'table-templates': 'Таблицы',
        'other': 'Другие',
    };

    const handleTemplateSelect = (templateId: string) => {
        setSelectedTemplate(templateId);
        setFeedback(null); // Clear any previous feedback
    };

    const handleConfirm = async () => {
        if (!selectedTemplate) return;
        
        setIsLoading(true);
        setFeedback(null);
        
        try {
            await onSelectTemplate(selectedTemplate);
            setFeedback({
                type: 'success',
                message: 'Тестовый слайд успешно создан! Слайд добавлен в презентацию с заполненным шаблоном.'
            });
            
            // Auto-close after success with delay
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error testing template:', error);
            setFeedback({
                type: 'error',
                message: 'Произошла ошибка при создании тестового слайда. Попробуйте еще раз.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isLoading) {
            onClose();
        }
    };

    const handleClose = () => {
        if (!isLoading) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={handleBackdropClick}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Выберите шаблон для тестирования</h2>
                    <button 
                        className={styles.closeButton} 
                        onClick={handleClose}
                        disabled={isLoading}
                        aria-label="Закрыть модальное окно"
                    >
                        ×
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <p className={styles.description}>
                        Выберите шаблон слайда для заполнения тестовыми данными. 
                        Это поможет проверить корректность отображения и структуры шаблона.
                    </p>

                    {feedback && (
                        <div className={`${styles.feedback} ${styles[feedback.type]}`}>
                            <div className={styles.feedbackIcon}>
                                {feedback.type === 'success' ? '✓' : '⚠'}
                            </div>
                            <div className={styles.feedbackMessage}>
                                {feedback.message}
                            </div>
                        </div>
                    )}

                    <div className={styles.templatesContainer}>
                        {Object.entries(templatesByCategory).map(([category, templates]) => (
                            <div key={category} className={styles.categorySection}>
                                <h3 className={styles.categoryTitle}>
                                    {categoryLabels[category] || category}
                                </h3>
                                <div className={styles.templatesGrid}>
                                    {templates.map((template) => {
                                        const IconComponent = template.ui.icon;
                                        return (
                                            <button
                                                key={template.id}
                                                className={`${styles.templateCard} ${
                                                    selectedTemplate === template.id ? styles.selected : ''
                                                }`}
                                                onClick={() => handleTemplateSelect(template.id)}
                                                disabled={isLoading}
                                            >
                                                <div className={styles.templateIcon}>
                                                    <IconComponent size={24} />
                                                </div>
                                                <div className={styles.templateInfo}>
                                                    <h4 className={styles.templateName}>{template.name}</h4>
                                                    <p className={styles.templateDescription}>
                                                        {template.ui.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button 
                        className={styles.cancelButton} 
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Отмена
                    </button>
                    <button 
                        className={styles.confirmButton} 
                        onClick={handleConfirm}
                        disabled={!selectedTemplate || isLoading}
                    >
                        {isLoading ? (
                            <span className={styles.loadingContent}>
                                <span className={styles.spinner}></span>
                                Создание...
                            </span>
                        ) : (
                            'Создать тестовый слайд'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplateTestModal; 