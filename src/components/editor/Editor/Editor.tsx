import React, { useState, useEffect } from 'react';
import { usePresentationStore } from '@/store/presentationStore';
import SlidesList from '@/components/editor/SlidesList';
import ElementsPanel from '@/components/editor/ElementsPanel/ElementsPanel';
import Button from '@/components/ui/Button';
import { DndProvider } from '@/contexts/DragDropContext';
import { SlideMenuProvider } from '@/contexts/SlideMenuContext';
import Presentation from '../Presentation';
import DragDropIndicator from '@/components/DragDropIndicator';
import UndoRedoControls from '@/components/UndoRedoControls';
import { Slide } from '@/types';
import SlideMenu from '../SlideMenu/SlideMenu';
import SaveStatus from '@/components/ui/SaveStatus';

interface EditorProps {
    presentationId: string;
}

const Editor: React.FC<EditorProps> = ({ presentationId }) => {
    const { getPresentation, addSlide, savingStatus } = usePresentationStore();
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
        (slide: Slide) => slide.id === activeSlideId
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
        <DndProvider presentationId={presentationId}>
            <SlideMenuProvider presentationId={presentationId}>
                <div className="min-h-screen flex flex-col bg-[#f6f4f4]">
                    <header className="bg-white border-b border-gray-200 p-4">
                        <div className="container mx-auto flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <h1 className="text-2xl font-bold text-blue-600">Presa</h1>
                                <SaveStatus status={savingStatus} />
                            </div>

                            <div className="flex items-center space-x-4">
                                <UndoRedoControls presentationId={presentationId} />
                                
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
                        <Presentation
                            presentation={presentation}
                            presentationId={presentationId}
                            activeSlideId={activeSlideId}
                            handleSlideSelect={handleSlideSelect}
                        />

                        {/* Панель инструментов */}
                        {!showPreview && activeSlide && (
                            // <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
                            <ElementsPanel
                                presentationId={presentationId}
                                slideId={activeSlide.id}
                            />
                            // </div>
                        )}
                    </div>
                    <SlideMenu />
                    {/* Global drag-drop indicator */}
                    <DragDropIndicator />
                </div>
            </SlideMenuProvider>
        </DndProvider>
    );
};

export default Editor; 