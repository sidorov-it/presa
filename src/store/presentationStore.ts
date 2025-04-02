import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useHistoryStore, HistoryAction } from './historyStore';
import {
    IPresentation,
    Slide,
    Layout,
    Element,
    GridStructure,
    EditorElement,
    LayoutType,
    TextElementType,
    BaseElement,
    GridCell,
    getPredefinedGridStructures
} from '@/types';
import { getColumnWidths } from '@/components/editor/SlideEditor/SlideEditor';
import { getNewEditorElement } from '@/elements/registry';
import debounce from 'lodash/debounce';

// Helper function to generate string IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

interface PresentationState {
    presentations: IPresentation[];
    isLoading: boolean;
    isSaving: boolean;
    savingStatus: 'idle' | 'saving' | 'saved' | 'error';
    error: string | null;

    recordAction: (action: Omit<HistoryAction, 'timestamp' | 'transactionId'>) => void;

    // Работа с презентациями
    createPresentation: (title: string) => Promise<string>;
    loadPresentation: (id: string) => Promise<IPresentation | null>;
    loadPresentationsList: () => Promise<void>;
    updatePresentation: (id: string, data: Partial<IPresentation>) => void;
    deletePresentation: (id: string) => void;
    getPresentation: (id: string) => IPresentation | undefined;
    setFullState: (state: { presentations: IPresentation[] }) => void;
    saveChanges: (id: string) => Promise<void>;

    // Работа со слайдами
    addSlide: (presentationId: string, index?: number) => string;
    updateSlide: (presentationId: string, slideId: string, data: Partial<Slide>) => void;
    deleteSlide: (presentationId: string, slideId: string) => void;
    duplicateSlide: (presentationId: string, slideId: string) => string;
    reorderSlides: (presentationId: string, startIndex: number, endIndex: number) => void;
    getSlide: (presentationId: string, slideId: string) => Slide | undefined;

    // Работа с макетами
    addLayout: (presentationId: string, slideId: string, layout: Omit<Layout, 'id'> | LayoutType, index?: number) => string;
    updateLayout: (presentationId: string, slideId: string, layoutId: string, data: Partial<Layout>) => void;
    deleteLayout: (presentationId: string, slideId: string, layoutId: string) => void;
    updateAndPotentiallyDeleteLayout: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        data: Partial<Layout>,
        deleteIfEmpty?: boolean
    ) => void;
    updateAlignLayout: (presentationId: string, layoutId: string, alignment: 'top' | 'center' | 'bottom') => void;

    findLayoutByElementId: (elementId: string) => Layout | undefined;
    getLayout: (presentationId: string, slideId: string, layoutId: string) => Layout | undefined;
    getCell: (presentationId: string, slideId: string, layoutId: string, cellId: string) => GridCell | undefined;

    // Работа с элементами
    getElement: (presentationId: string, slideId: string, layoutId: string, elementId: string) => BaseElement | undefined;
    addElement: (presentationId: string, slideId: string, layoutId: string, element: Omit<BaseElement, 'id'>) => string;
    updateElement: (presentationId: string, slideId: string, layoutId: string, elementId: string, data: Partial<BaseElement>) => void;
    deleteElement: (presentationId: string, slideId: string, layoutId: string, elementId: string) => void;
    duplicateElement: (presentationId: string, slideId: string, elementId: string) => void;
    addColumn: (presentationId: string, slideId: string, layoutId: string, columnIndex: number) => void;
    addColumnLeft: (presentationId: string, slideId: string, layoutId: string, columnId: string) => void;
    addColumnRight: (presentationId: string, slideId: string, layoutId: string, columnId: string) => void;
    duplicateColumn: (presentationId: string, slideId: string, layoutId: string, columnId: string) => void;
    alignColumnTop: (presentationId: string, slideId: string, layoutId: string, columnId: string) => void;
    alignColumnCenter: (presentationId: string, slideId: string, layoutId: string, columnId: string) => void;
    alignColumnBottom: (presentationId: string, slideId: string, layoutId: string, columnId: string) => void;
    alignColumn: (presentationId: string, slideId: string, layoutId: string, columnId: string, alignment: 'top' | 'center' | 'bottom') => void;
    deleteColumn: (presentationId: string, slideId: string, layoutId: string, columnId: string) => void;

    changeTemplate: (presentationId: string, slideId: string, layoutId: string, template: LayoutType) => void;

    mergeSlideWithPrevious: (presentationId: string, slideId: string) => void;

    // Undo/Redo operations
    undo: (presentationId: string) => void;
    redo: (presentationId: string) => void;
    canUndo: (presentationId: string) => boolean;
    canRedo: (presentationId: string) => boolean;
}

// Create the store with properly configured middleware
export const usePresentationStore = create<PresentationState>()(
    devtools(
        (set, get) => ({
            presentations: [],
            isLoading: false,
            isSaving: false,
            savingStatus: 'idle',
            error: null,

            // Debounced function to save presentation changes to backend
            saveChanges: debounce(async (id: string) => {
                const presentation = get().getPresentation(id);
                if (!presentation) return;

                try {
                    const response = await fetch(`/api/presentations/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(presentation),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to save presentation');
                    }
                } catch (error) {
                    console.error('Error saving presentation:', error);
                }
            }, 1000), // 1 second debounce

            recordAction: (action: Omit<HistoryAction, 'timestamp' | 'transactionId'>) => {
                const historyStore = useHistoryStore.getState();
                if (historyStore.hasActiveTransaction(action.presentationId)) {
                    // Don't record individual actions during a transaction
                    // Let the transaction helper handle it
                } else {
                    // Record action normally
                    historyStore.recordAction({ ...action });
                }
            },
            // Методы для работы с презентациями
            createPresentation: async (title: string) => {
                try {
                    set({ isLoading: true });

                    const response = await fetch('/api/presentations', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ title }),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to create presentation');
                    }

                    const { presentation } = await response.json();

                    set((state) => ({
                        presentations: [...state.presentations, presentation],
                    }));

                    // Инициализируем историю для новой презентации
                    useHistoryStore.getState().initHistory(presentation.id);

                    return presentation.id;
                } catch (error) {
                    console.error('Error creating presentation:', error);
                    set({ error: 'Failed to create presentation' });
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            loadPresentationsList: async () => {
                try {
                    set({ isLoading: true, error: null });

                    const response = await fetch('/api/presentations');
                    if (!response.ok) {
                        throw new Error('Failed to load presentations');
                    }

                    const { presentations } = await response.json();

                    set({
                        presentations,
                        isLoading: false
                    });
                } catch (error) {
                    console.error('Error loading presentations:', error);
                    set({
                        error: 'Failed to load presentations',
                        isLoading: false
                    });
                }
            },

            loadPresentation: async (id: string) => {
                try {
                    set({ isLoading: true });

                    const response = await fetch(`/api/presentations/${id}`);
                    if (!response.ok) {
                        throw new Error('Failed to load presentation');
                    }

                    const { presentation } = await response.json();

                    set((state) => ({
                        presentations: [
                            ...state.presentations.filter(p => p.id !== id),
                            presentation
                        ],
                    }));

                    // Инициализируем историю для загруженной презентации
                    useHistoryStore.getState().initHistory(presentation.id);

                    return presentation;
                } catch (error) {
                    console.error('Error loading presentation:', error);
                    set({ error: 'Failed to load presentation' });
                    throw error;
                } finally {
                    set({ isLoading: false });
                }
            },

            updatePresentation: (id, data) => {
                const currentPresentation = get().getPresentation(id);
                if (!currentPresentation) return;

                // Capture the state before the operation
                const beforeState = { ...get() };

                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((presentation) =>
                            presentation.id === id
                                ? { ...presentation, ...data, updatedAt: Date.now() }
                                : presentation
                        ),
                    }
                    get().recordAction({
                        type: 'presentation',
                        description: 'Update presentation details',
                        presentationId: id,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });

                    return updatedState;
                });

                // Save changes automatically
                get().saveChanges(id);
            },

            deletePresentation: (id) => {
                const presentation = get().getPresentation(id);
                if (!presentation) return;

                // Clear history for the presentation being deleted
                useHistoryStore.getState().clearHistory(id);

                set((state) => ({
                    presentations: state.presentations.filter((presentation) => presentation.id !== id),
                }));
            },

            getPresentation: (id) => {
                return get().presentations.find((presentation) => presentation.id === id);
            },

            // Методы для работы со слайдами
            addSlide: (presentationId, index = 0) => {
                const beforeState = { ...get() };

                const slideId = generateId();

                const defaultGridType = 'single-column';
                const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures(defaultGridType);

                // Create editor elements for each cell
                const elements: EditorElement[] = defaultLayoutGridStructure.rows.map(row => {
                    return row.cells.map(cell => ({
                        id: generateId(),
                        type: 'editor' as const,
                        content: '',
                        position: { x: 0, y: 0 },
                        size: { width: 100, height: 100 },
                        style: {},
                        zIndex: 0,
                        cellId: cell.id,
                    }))
                }).flat();

                const layout: Layout = {
                    id: generateId(),
                    gridStructure: defaultLayoutGridStructure,
                    type: defaultGridType,
                    style: {},
                    elements,
                }

                const newSlide: Slide = {
                    id: slideId,
                    title: `Слайд ${index + 1}`,
                    layouts: [layout],
                    background: {
                        type: 'color',
                        value: '#ffffff',
                    },
                    style: {},
                };

                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                const newSlides = [...presentation.slides];

                                newSlides.splice(index, 0, newSlide);

                                return {
                                    ...presentation,
                                    slides: newSlides,
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    };

                    get().recordAction({
                        type: 'slide',
                        description: 'Add new slide',
                        presentationId,
                        slideId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });

                    return updatedState;
                });

                // Add auto-save after completing the operation
                get().saveChanges(presentationId);

                return slideId;
            },

            updateSlide: (presentationId, slideId, data) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map((slide) =>
                                        slide.id === slideId ? { ...slide, ...data } : slide
                                    ),
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    }

                    // Record the action for history
                    get().recordAction({
                        type: 'slide',
                        description: 'Update slide',
                        presentationId,
                        slideId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });

                    return updatedState;
                });

                // Add auto-save after updating
                get().saveChanges(presentationId);
            },

            deleteSlide: (presentationId, slideId) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.filter((slide) => slide.id !== slideId),
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    }

                    get().recordAction({
                        type: 'slide',
                        description: 'Delete slide',
                        presentationId,
                        slideId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });

                    return updatedState;
                });

                // Add auto-save after deleting
                get().saveChanges(presentationId);
            },

            duplicateSlide: (presentationId, slideId) => {
                const beforeState = { ...get() };

                const { presentations } = get();
                const presentation = presentations.find((p) => p.id === presentationId);

                if (!presentation) return '';

                const slideToClone = presentation.slides.find((s) => s.id === slideId);

                if (!slideToClone) return '';

                const newSlideId = generateId();

                // Глубокое клонирование слайда с новыми ID
                const clonedSlide: Slide = {
                    ...JSON.parse(JSON.stringify(slideToClone)),
                    id: newSlideId,
                    title: `${slideToClone.title} (копия)`,
                    layouts: slideToClone.layouts.map((layout) => ({
                        ...layout,
                        id: generateId(),
                        elements: layout.elements.map((element) => ({
                            ...element,
                            id: generateId(),
                        })),
                    })),
                };


                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((p) => {
                            if (p.id === presentationId) {
                                const updatedSlides = [...p.slides];

                                const originSlideIndex = updatedSlides.findIndex(slide => slide.id === slideId);
                                if (originSlideIndex !== -1) {
                                    updatedSlides.splice(originSlideIndex + 1, 0, clonedSlide);
                                }

                                return {
                                    ...p,
                                    slides: updatedSlides,
                                    updatedAt: Date.now(),
                                };
                            }
                            return p;
                        }),
                    }
                    get().recordAction({
                        type: 'slide',
                        description: 'Duplicate slide',
                        presentationId,
                        slideId: newSlideId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });
                    return updatedState;
                });

                // Add auto-save after duplicating
                get().saveChanges(presentationId);

                return newSlideId;
            },

            mergeSlideWithPrevious: (presentationId, slideId) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentSlideIndex = currentPresentation.slides.findIndex(slide => slide.id === slideId);
                if (currentSlideIndex === 0) return;

                const previousSlide = currentPresentation.slides[currentSlideIndex - 1];
                if (!previousSlide) return;

                set((state) => {
                    // удаляем текущий слайд
                    // обновляем layouts в предыдущем слайде
                    let updatedSlides = [...currentPresentation.slides];
                    updatedSlides.splice(currentSlideIndex, 1);

                    const updatedLayoutsInPreviousSlide = [...previousSlide.layouts, ...currentSlide.layouts];

                    updatedSlides = updatedSlides.map((slide) => {
                        if (slide.id === previousSlide.id) {
                            return {
                                ...slide,
                                layouts: updatedLayoutsInPreviousSlide,
                            };
                        }
                        return slide;
                    })

                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: updatedSlides,
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    };

                    get().recordAction({
                        type: 'slide',
                        description: 'Merge slide with previous',
                        presentationId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });

                    return updatedState;
                });
            },

            reorderSlides: (presentationId, startIndex, endIndex) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const newSlides = [...currentPresentation.slides];
                const [removed] = newSlides.splice(startIndex, 1);
                newSlides.splice(endIndex, 0, removed);

                set((state) => {
                    const presentation = state.presentations.find((p) => p.id === presentationId);

                    if (!presentation) return state;

                    const newSlides = [...presentation.slides];
                    const [removed] = newSlides.splice(startIndex, 1);
                    newSlides.splice(endIndex, 0, removed);

                    const updatedState = {
                        presentations: state.presentations.map((p) =>
                            p.id === presentationId
                                ? { ...p, slides: newSlides, updatedAt: Date.now() }
                                : p
                        ),
                    };
                    get().recordAction({
                        type: 'presentation',
                        description: 'Reorder slides',
                        presentationId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });

                    return updatedState;
                });

                // Add auto-save after reordering
                get().saveChanges(presentationId);
            },

            getSlide: (presentationId, slideId) => {
                const presentation = get().getPresentation(presentationId);
                if (!presentation) return null;
                return presentation.slides.find(slide => slide.id === slideId);
            },
            getLayout: (presentationId, slideId, layoutId) => {
                const slide = get().getSlide(presentationId, slideId);
                if (!slide) return null;
                return slide.layouts.find(layout => layout.id === layoutId);
            },
            getCell: (presentationId, slideId, layoutId, cellId) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return null;
                return layout.gridStructure.rows[0].cells.find(cell => cell.id === cellId);
            },

            // Методы для работы с макетами
            addLayout: (presentationId, slideId, layout, index) => {
                const beforeState = { ...get() };

                const layoutId = generateId();
                let newLayout: Layout;

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return layoutId;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return layoutId;

                if (typeof layout === 'string') {
                    // Это тип макета (LayoutType), создаем новый макет по типу
                    const gridStructure = getPredefinedGridStructures(layout as LayoutType);

                    // Создаем элементы для каждой ячейки сетки
                    const elements: EditorElement[] = gridStructure.rows.map(row =>
                        row.cells.map(cell => ({
                            id: generateId(),
                            type: 'editor' as const,
                            content: '',
                            position: { x: 0, y: 0 },
                            size: { width: 100, height: 100 },
                            style: { fontSize: '16px', color: '#333333' },
                            zIndex: 1,
                            placeholder: 'Введите текст...',
                            cellId: cell.id,
                        }))
                    ).flat();

                    newLayout = {
                        id: layoutId,
                        type: layout as LayoutType,
                        elements,
                        gridStructure,
                        style: {},
                    };
                } else {
                    // Это объект макета, добавляем только ID
                    newLayout = {
                        ...layout as Layout,
                        id: layoutId,
                    };
                }

                set((state) => {
                    const targetSlide = state.presentations.find((p) => p.id === presentationId)?.slides.find((s) => s.id === slideId);

                    let layouts: Layout[];
                    if (typeof index === 'number' && targetSlide && index <= targetSlide.layouts.length) {
                        // Если индекс указан и валиден
                        layouts = [...targetSlide.layouts];
                        layouts.splice(index, 0, newLayout);
                    } else {
                        // Иначе добавляем в конец
                        layouts = targetSlide ? [...targetSlide.layouts, newLayout] : [newLayout];
                    }

                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map((slide) => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts,
                                            };
                                        }
                                        return slide;
                                    }),
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    };

                    get().recordAction({
                        type: 'layout',
                        description: 'Add layout',
                        presentationId,
                        slideId,
                        layoutId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });

                    return updatedState;
                });

                // Add auto-save after adding layout
                get().saveChanges(presentationId);

                return layoutId;
            },

            updateLayout: (presentationId, slideId, layoutId, data) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;


                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map((slide) => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map((layout) =>
                                                    layout.id === layoutId ? { ...layout, ...data } : layout
                                                ),
                                            };
                                        }
                                        return slide;
                                    }),
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    };

                    console.log('updatedState', updatedState);
                    // Record the action for history
                    get().recordAction({
                        type: 'layout',
                        description: 'Update layout',
                        presentationId,
                        slideId,
                        layoutId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });

                    return updatedState;
                });

                // Add auto-save after updating layout
                get().saveChanges(presentationId);
            },

            deleteLayout: (presentationId, slideId, layoutId) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map((slide) => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.filter((layout) => layout.id !== layoutId),
                                            };
                                        }
                                        return slide;
                                    }),
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    }

                    get().recordAction({
                        type: 'layout',
                        description: 'Delete layout',
                        presentationId,
                        slideId,
                        layoutId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });

                    return updatedState;
                });

                // Add auto-save after deleting layout
                get().saveChanges(presentationId);
            },

            updateAlignLayout: (presentationId, layoutId, alignment) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map((slide) => {
                                        return {
                                            ...slide,
                                            layouts: slide.layouts.map((layout) => {
                                                if (layout.id === layoutId) {
                                                    return {
                                                        ...layout,
                                                        gridStructure: {
                                                            ...layout.gridStructure,
                                                            rows: layout.gridStructure.rows.map((row) => {
                                                                return { ...row, cells: row.cells.map((cell) => ({ ...cell, alignment })) };
                                                            })
                                                        }
                                                    };
                                                }
                                                return layout;
                                            }),
                                        };
                                    }),
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    };

                    get().recordAction({
                        type: 'layout',
                        description: 'Update align layout',
                        presentationId,
                        layoutId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });

                    return updatedState;
                });
            },
            updateAndPotentiallyDeleteLayout: (
                presentationId,
                slideId,
                layoutId,
                data,
                deleteIfEmpty = false
            ) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                let shouldDelete = false;
                if (deleteIfEmpty && 'elements' in data) {
                    const updatedElements = data.elements as Element[];
                    shouldDelete = updatedElements.length === 0;
                }

                set((state) => {
                    const presentation = state.presentations.find((p) => p.id === presentationId);
                    if (!presentation) return state;

                    // First, update the layout with the new data
                    const updatedSlides = presentation.slides.map((slide) => {
                        if (slide.id !== slideId) return slide;

                        // Get the updated layout
                        const updatedLayouts = slide.layouts.map((layout) =>
                            layout.id === layoutId ? { ...layout, ...data } : layout
                        );

                        // Check if we need to delete the layout
                        const updatedLayout = updatedLayouts.find((layout) => layout.id === layoutId);

                        if (deleteIfEmpty && updatedLayout && updatedLayout.elements.length === 0) {
                            // If the layout is now empty and deleteIfEmpty is true, remove it
                            return {
                                ...slide,
                                layouts: updatedLayouts.filter((layout) => layout.id !== layoutId)
                            };
                        }

                        // Otherwise just return the slide with updated layouts
                        return {
                            ...slide,
                            layouts: updatedLayouts
                        };
                    });

                    // Update the presentation with new slides
                    const updatedState = {
                        presentations: state.presentations.map((p) => {
                            if (p.id === presentationId) {
                                return {
                                    ...p,
                                    slides: updatedSlides,
                                    updatedAt: Date.now()
                                };
                            }
                            return p;
                        })
                    };

                    get().recordAction({
                        type: 'layout',
                        description: shouldDelete ? 'Delete empty layout' : 'Update layout',
                        presentationId,
                        slideId,
                        layoutId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });

                    return updatedState;
                });

                // Add auto-save after updating layout
                get().saveChanges(presentationId);
            },

            findLayoutByElementId: (elementId) => {
                for (const presentation of get().presentations) {
                    for (const slide of presentation.slides) {
                        for (const layout of slide.layouts) {
                            if (layout.elements.some(e => e.id === elementId)) {
                                return layout;
                            }
                        }
                    }
                }
                return undefined;
            },

            getElement: (presentationId, slideId, layoutId, elementId) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return null;
                return layout.elements.find(element => element.id === elementId);
            },
            // Методы для работы с элементами
            addElement: (presentationId, slideId, layoutId, elementData) => {
                const beforeState = { ...get() };

                const elementId = generateId();

                const newElement: BaseElement = {
                    ...elementData as BaseElement,
                    id: elementId,
                    type: 'text' as TextElementType,
                    position: elementData.position || { x: 0, y: 0 },
                    size: elementData.size || { width: 100, height: 100 },
                    style: elementData.style || {},
                    zIndex: elementData.zIndex || 0,
                    cellId: elementData.cellId || '',
                };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return elementId;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return elementId;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return elementId;

                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map((slide) => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map((layout) => {
                                                    if (layout.id === layoutId) {
                                                        return {
                                                            ...layout,
                                                            elements: [...layout.elements, newElement],
                                                        };
                                                    }
                                                    return layout;
                                                }),
                                            };
                                        }
                                        return slide;
                                    }),
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    };

                    get().recordAction({
                        type: 'element',
                        description: 'Add element',
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });

                    return updatedState;
                });

                // Add auto-save after adding element
                get().saveChanges(presentationId);

                return elementId;
            },

            duplicateElement: (presentationId, slideId, elementId) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.elements.some(element => element.id === elementId));
                if (!currentLayout) return;

                const currentElement = currentLayout.elements.find(element => element.id === elementId);
                if (!currentElement) return;

                const newElementId = generateId();

                const newElement: BaseElement = {
                    ...currentElement,
                    id: newElementId,
                    type: currentElement.type as TextElementType,
                    position: currentElement.position || { x: 0, y: 0 },
                    size: currentElement.size || { width: 100, height: 100 },
                    style: currentElement.style || {},
                    zIndex: currentElement.zIndex || 0,
                    cellId: currentElement.cellId || '',
                };

                set((state) => {
                    let updatedState;
                    if (currentLayout.gridStructure.columns > 1) {
                        updatedState = {
                            presentations: state.presentations.map((presentation) => {
                                if (presentation.id === presentationId) {
                                    return {
                                        ...presentation,
                                        slides: presentation.slides.map((slide) => {
                                            if (slide.id === slideId) {
                                                return {
                                                    ...slide,
                                                    layouts: slide.layouts.map((layout) => {
                                                        if (layout.id === currentLayout.id) {
                                                            const updatedElements = [...layout.elements];
                                                            const targetIndex = updatedElements.findIndex(element => element.id === elementId);
                                                            updatedElements.splice(targetIndex + 1, 0, newElement);
                                                            return { ...layout, elements: updatedElements };
                                                        }
                                                        return layout;
                                                    }),
                                                };
                                            }
                                            return slide;
                                        }),
                                        updatedAt: Date.now(),
                                    };
                                }
                                return presentation;
                            }),
                        };

                        get().recordAction({
                            type: 'element',
                            description: 'Duplicate element',
                            presentationId,
                            slideId,
                            layoutId: currentLayout.id,
                            elementId,
                            before: { presentations: beforeState.presentations },
                            after: updatedState
                        });
                    } else {
                        const cellId = generateId();
                        const newLayout: Layout = {
                            id: generateId(),
                            gridStructure: {
                                columns: 1,
                                columnWidths: getColumnWidths(1),
                                rows: [{
                                    id: generateId(),
                                    cells: [{
                                        id: cellId,
                                        row: 0,
                                        column: 1,
                                    }]
                                }]
                            },
                            type: currentLayout.type,
                            elements: [{
                                ...newElement,
                                cellId,
                            }],
                            style: currentLayout.style,
                        };
                        const currentLayoutIndex = currentSlide.layouts.findIndex(layout => layout.id === currentLayout.id);
                        const updatedLayouts = JSON.parse(JSON.stringify(currentSlide.layouts));

                        updatedLayouts.splice(currentLayoutIndex + 1, 0, newLayout);

                        updatedState = {
                            presentations: state.presentations.map((presentation) => {
                                if (presentation.id === presentationId) {
                                    return {
                                        ...presentation,
                                        slides: presentation.slides.map((slide) => {
                                            if (slide.id === slideId) {
                                                return {
                                                    ...slide,
                                                    layouts: updatedLayouts,
                                                };
                                            }
                                            return slide;
                                        }),
                                        updatedAt: Date.now(),
                                    };
                                }
                                return presentation;
                            }),
                        };
                    }
                    return updatedState;
                })
            },
            updateElement: (presentationId, slideId, layoutId, elementId, data) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const currentElement = currentLayout.elements.find(element => element.id === elementId);
                if (!currentElement) return;

                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map((slide) => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map((layout) => {
                                                    if (layout.id === layoutId) {
                                                        return {
                                                            ...layout,
                                                            elements: layout.elements.map((element) =>
                                                                element.id === elementId ? { ...element, ...data } : element
                                                            ),
                                                        };
                                                    }
                                                    return layout;
                                                }),
                                            };
                                        }
                                        return slide;
                                    }),
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    };

                    get().recordAction({
                        type: 'element',
                        description: 'Update element',
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });
                    return updatedState;
                });

                // Add auto-save after updating element
                get().saveChanges(presentationId);
            },

            deleteElement: (presentationId, slideId, layoutId, elementId) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const currentElement = currentLayout.elements.find(element => element.id === elementId);
                if (!currentElement) return;

                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map((slide) => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map((layout) => {
                                                    if (layout.id === layoutId) {
                                                        return {
                                                            ...layout,
                                                            elements: layout.elements.filter(
                                                                (element) => element.id !== elementId
                                                            ),
                                                        };
                                                    }
                                                    return layout;
                                                }),
                                            };
                                        }
                                        return slide;
                                    }),
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    };

                    // Record the action for history
                    get().recordAction({
                        type: 'element',
                        description: 'Delete element',
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });
                    return updatedState;
                });

                // Add auto-save after deleting element
                get().saveChanges(presentationId);
            },


            addColumn: (presentationId, slideId, layoutId, columnIndex) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const newColumnId = generateId();

                const newColumn: GridCell = {
                    id: newColumnId,
                    row: 0,
                    column: columnIndex + 1,
                };

                // Update grid structure
                const updatedGridStructure = {
                    ...currentLayout.gridStructure,
                    columns: currentLayout.gridStructure.columns + 1,
                    columnWidths: getColumnWidths(currentLayout.gridStructure.columns + 1),
                    rows: currentLayout.gridStructure.rows.map((row: { id: string; cells: GridCell[] }) => ({
                        ...row,
                        cells: [...row.cells, newColumn],
                    })),
                };

                // Create new elements for the column
                let updatedElements = currentLayout.elements;
                if (currentLayout.type === 'custom') {
                    const firstRow = currentLayout.gridStructure.rows[0];
                    if (!firstRow) return;
                    const elements = currentLayout.elements.filter(element => element.cellId === firstRow.cells[0].id);
                    const updatedNewElements = elements.map(element => ({
                        ...element,
                        id: generateId(),
                        cellId: newColumnId,
                        type: element.type,
                        position: { x: 0, y: 0 },
                        size: { width: 100, height: 100 },
                        style: {},
                        zIndex: element.zIndex || 0,
                    } as BaseElement));
                    updatedElements = [...currentLayout.elements, ...updatedNewElements];
                } else {
                    const newElement: BaseElement = {
                        id: generateId(),
                        type: 'text' as TextElementType,
                        position: { x: 0, y: 0 },
                        size: { width: 100, height: 100 },
                        style: {},
                        zIndex: 0,
                        cellId: newColumnId,
                    };
                    updatedElements = [...currentLayout.elements, newElement];
                }

                const updatedSlide = {
                    ...currentSlide,
                    layouts: currentSlide.layouts.map(layout =>
                        layout.id === layoutId
                            ? {
                                ...layout,
                                gridStructure: updatedGridStructure,
                                elements: updatedElements,
                            }
                            : layout
                    ),
                };

                const updatedPresentation = {
                    ...currentPresentation,
                    slides: currentPresentation.slides.map(slide =>
                        slide.id === slideId ? updatedSlide : slide
                    ),
                };

                const updatedState = {
                    ...get(),
                    presentations: get().presentations.map(presentation =>
                        presentation.id === presentationId ? updatedPresentation : presentation
                    ),
                };

                set(updatedState);

                useHistoryStore.getState().recordAction({
                    type: 'column',
                    description: 'Add column',
                    presentationId,
                    slideId,
                    layoutId,
                    columnId: newColumnId,
                    position: 'right',
                    before: { presentations: beforeState.presentations },
                    after: updatedState
                });
            },

            addColumnLeft: (presentationId: string, slideId: string, layoutId: string, columnId: string) => {
                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const columnIndex = currentLayout.gridStructure.rows[0].cells.findIndex(cell => cell.id === columnId);
                if (columnIndex === -1) return;

                get().addColumn(presentationId, slideId, layoutId, columnIndex);
            },

            addColumnRight: (presentationId: string, slideId: string, layoutId: string, columnId: string) => {
                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const columnIndex = currentLayout.gridStructure.rows[0].cells.findIndex(cell => cell.id === columnId);
                if (columnIndex === -1) return;

                get().addColumn(presentationId, slideId, layoutId, columnIndex + 1);
            },

            duplicateColumn: (presentationId: string, slideId: string, layoutId: string, columnId: string) => {
                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const currentColumn = currentLayout.gridStructure.rows[0].cells.find(cell => cell.id === columnId);
                if (!currentColumn) return;

                const columnIndex = currentLayout.gridStructure.rows[0].cells.findIndex(cell => cell.id === columnId);
                if (columnIndex === -1) return;

                get().addColumn(presentationId, slideId, layoutId, columnIndex + 1);
            },

            alignColumn: (presentationId, slideId, layoutId, columnId, alignment) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const currentColumn = currentLayout.gridStructure.rows[0].cells.find(cell => cell.id === columnId);
                if (!currentColumn) return;

                const updatedGridStructure = JSON.parse(JSON.stringify(currentLayout.gridStructure));
                updatedGridStructure.rows[0].cells.find((cell: GridCell) => cell.id === columnId).alignment = alignment;

                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map((slide) => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map((layout) => {
                                                    if (layout.id === layoutId) {
                                                        return {
                                                            ...layout,
                                                            gridStructure: updatedGridStructure,
                                                        };
                                                    }
                                                    return layout;
                                                }),
                                            };
                                        }
                                        return slide;
                                    }),
                                };
                            }
                            return presentation;
                        }),
                    };

                    get().recordAction({
                        type: 'column',
                        description: 'Align column',
                        presentationId,
                        slideId,
                        layoutId,
                        columnId,
                        alignment,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });
                    return updatedState;
                });
            },

            alignColumnTop: (presentationId, slideId, layoutId, columnId) => {
                get().alignColumn(presentationId, slideId, layoutId, columnId, 'top');
            },

            alignColumnCenter: (presentationId, slideId, layoutId, columnId) => {
                get().alignColumn(presentationId, slideId, layoutId, columnId, 'center');
            },

            alignColumnBottom: (presentationId, slideId, layoutId, columnId) => {
                get().alignColumn(presentationId, slideId, layoutId, columnId, 'bottom');
            },

            deleteColumn: (presentationId, slideId, layoutId, columnId) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const currentColumn = currentLayout.gridStructure.rows[0].cells.find(cell => cell.id === columnId);
                if (!currentColumn) return;

                const updatedGridStructure = JSON.parse(JSON.stringify(currentLayout.gridStructure));
                updatedGridStructure.rows[0].cells = updatedGridStructure.rows[0].cells.filter((cell: GridCell) => cell.id !== currentColumn.id);
                updatedGridStructure.columns = updatedGridStructure.columns - 1;
                updatedGridStructure.columnWidths = getColumnWidths(updatedGridStructure.columns);

                const updatedElements = currentLayout.elements.filter(element => element.cellId !== currentColumn.id);

                set((state) => {
                    const updatedState = {
                        presentations: state.presentations.map((presentation) => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map((slide) => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map((layout) => {
                                                    if (layout.id === layoutId) {
                                                        return {
                                                            ...layout,
                                                            gridStructure: updatedGridStructure,
                                                            elements: updatedElements,
                                                        };
                                                    }
                                                    return layout;
                                                }),
                                            };
                                        }
                                        return slide;
                                    }),
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    };

                    get().recordAction({
                        type: 'column',
                        description: 'Delete column',
                        presentationId,
                        slideId,
                        layoutId,
                        columnId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState
                    });
                    return updatedState;
                });
            },


            changeTemplate: (presentationId: string, slideId: string, layoutId: string, template: LayoutType) => {
                const beforeState = { ...get() };

                let newColumnsCount;
                let newColumnsWidths;

                switch (template) {
                    case 'two-columns-right':
                        newColumnsCount = 2;
                        newColumnsWidths = ['34%', '66%'];
                        break;
                    case 'two-columns-left':
                        newColumnsCount = 2;
                        newColumnsWidths = ['66%', '34%'];
                        break;
                    case 'two-columns-equal':
                        newColumnsCount = 2;
                        newColumnsWidths = getColumnWidths(newColumnsCount);
                        break;

                    case 'three-columns':
                        newColumnsCount = 3;
                        newColumnsWidths = getColumnWidths(newColumnsCount);
                        break;
                    case 'four-columns':
                        newColumnsCount = 4;
                        newColumnsWidths = getColumnWidths(newColumnsCount);
                        break;
                    default:
                        return;
                }

                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return;

                const updatedGridStructure = { ...layout.gridStructure };
                updatedGridStructure.columnWidths = newColumnsWidths;

                const currentColumnsCount = updatedGridStructure.columns;

                if (currentColumnsCount > newColumnsCount) {
                    const strippedColumns = updatedGridStructure.rows[0].cells.slice(newColumnsCount, updatedGridStructure.rows[0].cells.length);
                    const updatedColumns = updatedGridStructure.rows[0].cells.slice(0, newColumnsCount);

                    const lastColumn = updatedColumns[updatedColumns.length - 1];

                    updatedGridStructure.columns = newColumnsCount;

                    const updatedElements = layout.elements.map((element) => {
                        if (strippedColumns.some((column) => column.id === element.cellId)) {
                            return {
                                ...element,
                                cellId: lastColumn.id,
                            };
                        }
                        return element;
                    });

                    updatedGridStructure.rows[0].cells = updatedColumns;

                    set((state) => {
                        const updatedState = {
                            presentations: state.presentations.map((presentation) => {
                                if (presentation.id === presentationId) {
                                    return {
                                        ...presentation,
                                        slides: presentation.slides.map((slide) => {
                                            if (slide.id === slideId) {
                                                return {
                                                    ...slide,
                                                    layouts: slide.layouts.map((layout) => {
                                                        if (layout.id === layoutId) {
                                                            return {
                                                                ...layout,
                                                                elements: updatedElements,
                                                                gridStructure: updatedGridStructure,
                                                            };
                                                        }
                                                        return layout;
                                                    }),
                                                };
                                            }
                                            return slide;
                                        }),
                                    };
                                }
                                return presentation;
                            }),
                        };

                        get().recordAction({
                            type: 'layout',
                            description: 'Change template',
                            presentationId,
                            slideId,
                            layoutId,
                            before: { presentations: beforeState.presentations },
                            after: updatedState
                        });

                        return updatedState;
                    });

                } else if (currentColumnsCount < newColumnsCount) {
                    updatedGridStructure.columns = newColumnsCount;

                    const newElements: BaseElement[] = [];

                    const newCells: GridCell[] = new Array(newColumnsCount - currentColumnsCount).fill(null).map((_, index) => {
                        const cellId = generateId();

                        const newEditor = getNewEditorElement(cellId);
                        newElements.push(newEditor as BaseElement);

                        return {
                            id: cellId,
                            row: 0,
                            column: currentColumnsCount + index,
                            elements: [],
                        };
                    });

                    updatedGridStructure.rows[0].cells = updatedGridStructure.rows[0].cells.concat(newCells);
                    const updatedElements = layout.elements.concat(newElements);

                    set((state) => {
                        const updatedState = {
                            presentations: state.presentations.map((presentation) => {
                                if (presentation.id === presentationId) {
                                    return {
                                        ...presentation,
                                        slides: presentation.slides.map((slide) => {
                                            if (slide.id === slideId) {
                                                return {
                                                    ...slide,
                                                    layouts: slide.layouts.map((layout) => {
                                                        if (layout.id === layoutId) {
                                                            return {
                                                                ...layout,
                                                                gridStructure: updatedGridStructure,
                                                                elements: updatedElements,
                                                            };
                                                        }
                                                        return layout;
                                                    }),
                                                };
                                            }
                                            return slide;
                                        }),
                                    };
                                }
                                return presentation;
                            }),
                        };

                        get().recordAction({
                            type: 'layout',
                            description: 'Change template',
                            presentationId,
                            slideId,
                            layoutId,
                            before: { presentations: beforeState.presentations },
                            after: updatedState
                        });

                        return updatedState;
                    });
                } else {
                    set((state) => {
                        const updatedState = {
                            presentations: state.presentations.map((presentation) => {
                                if (presentation.id === presentationId) {
                                    return {
                                        ...presentation,
                                        slides: presentation.slides.map((slide) => {
                                            if (slide.id === slideId) {
                                                return {
                                                    ...slide,
                                                    layouts: slide.layouts.map((layout) => {
                                                        if (layout.id === layoutId) {
                                                            return {
                                                                ...layout,
                                                                gridStructure: updatedGridStructure,
                                                            };
                                                        }
                                                        return layout;
                                                    }),
                                                };
                                            }
                                            return slide;
                                        }),
                                    };
                                }
                                return presentation;
                            }),
                        };

                        get().recordAction({
                            type: 'layout',
                            description: 'Change template',
                            presentationId,
                            slideId,
                            layoutId,
                            before: { presentations: beforeState.presentations },
                            after: updatedState
                        });

                        return updatedState;
                    });
                }
            },

            // Undo/Redo operations - delegate to history store
            undo: (presentationId: string) => {
                useHistoryStore.getState().undo(presentationId);
            },

            redo: (presentationId: string) => {
                useHistoryStore.getState().redo(presentationId);
            },

            canUndo: (presentationId: string) => {
                return useHistoryStore.getState().canUndo(presentationId);
            },

            canRedo: (presentationId: string) => {
                return useHistoryStore.getState().canRedo(presentationId);
            },

            setFullState: (state: { presentations: IPresentation[] }) => {
                // Direct setter for presentations array used by undo/redo operations
                if (state && Array.isArray(state.presentations)) {
                    set({ presentations: JSON.parse(JSON.stringify(state.presentations)) });
                }
            },
        }),
        {
            name: 'presentation-store',
            enabled: true,
        }
    )
);
