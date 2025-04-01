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
import { useRouter } from 'next/navigation';

interface EditorProps {
    presentationId: string;
}

const Editor: React.FC<EditorProps> = ({ presentationId }) => {
    const { getPresentation, addSlide, savingStatus, createPresentation } = usePresentationStore();
    const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const router = useRouter();

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

    const handleCreateEmpty = async () => {
        try {
            const presentationId = await createPresentation('Untitled Presentation');
            router.push(`/editor/${presentationId}`);
        } catch (error) {
            console.error('Failed to create presentation:', error);
        }
    };

    return (
        <DndProvider presentationId={presentationId}>
            <SlideMenuProvider presentationId={presentationId}>
                <div className="min-h-screen flex flex-col bg-[#f6f4f4]">
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