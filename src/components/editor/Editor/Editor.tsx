import React, { useState, useEffect } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import SlidesList from '@/components/editor/SlidesList';
import SlideEditor from '@/components/editor/SlideEditor';
import ToolPanel from '@/components/editor/ToolPanel/ToolPanel';
import Button from '@/components/ui/Button';
import styles from './Editor.module.css';
interface EditorProps {
  presentationId: string;
}

const Editor: React.FC<EditorProps> = ({ presentationId }) => {
    const { getPresentation, addSlide } = usePresentationStore();
    const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const presentation = getPresentation(presentationId);

    useEffect(() => {
    // Выбираем первый слайд по умолчанию, если есть слайды
        if (presentation && presentation.slides.length > 0 && !activeSlideId) {
            setActiveSlideId(presentation.slides[0].id);
        }
    }, [presentation, activeSlideId]);

    if (!presentation) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg text-gray-500">Презентация не найдена</p>
            </div>
        );
    }

    const activeSlide = presentation.slides.find(
        (slide) => slide.id === activeSlideId
    );

    const handleAddSlide = () => {
        const newSlideId = addSlide(presentationId);
        setActiveSlideId(newSlideId);
    };

    const handleSlideSelect = (slideId: string) => {
        setActiveSlideId(slideId);
    };

    const handlePreviewToggle = () => {
        setShowPreview(!showPreview);
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#f6f4f4]">
            <header className="bg-white border-b border-gray-200 p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-blue-600">Presa</h1>

                    <div className="flex items-center space-x-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePreviewToggle}
                            aria-label={showPreview ? 'Выйти из режима просмотра' : 'Предпросмотр презентации'}
                        >
                            {showPreview ? 'Редактировать' : 'Просмотр'}
                        </Button>

                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => { }}
                            aria-label="Экспортировать презентацию"
                        >
              Экспорт
                        </Button>
                    </div>
                </div>
            </header>

            <SlidesList
                slides={presentation.slides}
                activeSlideId={activeSlideId}
                onSlideSelect={handleSlideSelect}
            />

            <div className="">
                {/* Основная область редактирования */}
                <div className="">
                    {presentation.slides.map(slide => (
                        // <div className={styles.slide}>
                        <SlideEditor
                            key={slide.id}
                            slide={slide}
                            presentationId={presentationId}
                            handleSelectSlide={handleSlideSelect}
                            isSelected={activeSlideId === slide.id}
                        />
                        // </div>
                    ))}
                </div>

                {/* Панель инструментов */}
                {!showPreview && activeSlide && (
                // <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
                    <ToolPanel
                        presentationId={presentationId}
                        slideId={activeSlide.id}
                    />
                // </div>
                )}
            </div>
        </div>
    );
};

export default Editor; 