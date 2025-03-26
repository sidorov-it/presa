
import { v4 as uuidv4 } from 'uuid';
import {
    IPresentation,
    Slide,
    Layout,
    Element,
    LayoutType,
    EditorElement,
    GridStructure,
    getPredefinedGridStructures
} from '@/types';
import { devtools } from 'zustand/middleware';
import { generateId } from '@/utils/id';
import { HistoryAction, useHistoryStore } from './historyStore';
import { create } from 'zustand';
import { getColumnWidths } from '@/components/editor/SlideEditor/SlideEditor';

interface PresentationState {
    presentations: IPresentation[];

    recordAction: (action: Omit<HistoryAction, 'timestamp' | 'transactionId'>) => void;

    // Работа с презентациями
    createPresentation: (title: string) => string;
    updatePresentation: (id: string, data: Partial<IPresentation>) => void;
    deletePresentation: (id: string) => void;
    getPresentation: (id: string) => IPresentation | undefined;
    setFullState: (state: { presentations: IPresentation[] }) => void;

    // Работа со слайдами
    addSlide: (presentationId: string, index?: number) => string;
    updateSlide: (presentationId: string, slideId: string, data: Partial<Slide>) => void;
    deleteSlide: (presentationId: string, slideId: string) => void;
    duplicateSlide: (presentationId: string, slideId: string) => string;
    reorderSlides: (presentationId: string, startIndex: number, endIndex: number) => void;

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
    findLayoutByElementId: (elementId: string) => Layout | undefined;

    // Работа с элементами
    addElement: (presentationId: string, slideId: string, layoutId: string, element: Omit<Element, 'id'>) => string;
    updateElement: (presentationId: string, slideId: string, layoutId: string, elementId: string, data: Partial<Element>) => void;
    deleteElement: (presentationId: string, slideId: string, layoutId: string, elementId: string) => void;
    duplicateElement: (presentationId: string, slideId: string, elementId: string) => void;

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
            createPresentation: (title: string) => {
                const id = uuidv4();
                const now = Date.now();

                const newPresentation: IPresentation = {
                    id,
                    title,
                    slides: [],
                    createdAt: now,
                    updatedAt: now,
                };

                // Capture the state before the operation
                const beforeState = { ...get() };

                set((state) => ({
                    presentations: [...state.presentations, newPresentation],
                }));

                // Initialize history for the new presentation
                useHistoryStore.getState().initHistory(id);

                // Capture the state after the operation
                const afterState = { ...get() };

                // Record this action with the entire store state
                get().recordAction({
                    type: 'presentation',
                    description: 'Create presentation',
                    presentationId: id,
                    before: { presentations: beforeState.presentations },
                    after: afterState
                });

                // Добавляем первый слайд по умолчанию
                get().addSlide(id, 0);

                return id;
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

                const slideId = uuidv4();

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
            },

            duplicateSlide: (presentationId, slideId) => {
                const beforeState = { ...get() };

                const { presentations } = get();
                const presentation = presentations.find((p) => p.id === presentationId);

                if (!presentation) return '';

                const slideToClone = presentation.slides.find((s) => s.id === slideId);

                if (!slideToClone) return '';

                const newSlideId = uuidv4();

                // Глубокое клонирование слайда с новыми ID
                const clonedSlide: Slide = {
                    ...JSON.parse(JSON.stringify(slideToClone)),
                    id: newSlideId,
                    title: `${slideToClone.title} (копия)`,
                    layouts: slideToClone.layouts.map((layout) => ({
                        ...layout,
                        id: uuidv4(),
                        elements: layout.elements.map((element) => ({
                            ...element,
                            id: uuidv4(),
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

                return newSlideId;
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
            },

            // Методы для работы с макетами
            addLayout: (presentationId, slideId, layout, index) => {
                const beforeState = { ...get() };

                const layoutId = uuidv4();
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
                            id: uuidv4(),
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

            // Методы для работы с элементами
            addElement: (presentationId, slideId, layoutId, elementData) => {
                const beforeState = { ...get() };

                const elementId = uuidv4();

                const newElement: Element = {
                    ...elementData as Element,
                    id: elementId,
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

                const newElementId = uuidv4();

                const newElement: Element = {
                    ...currentElement,
                    id: newElementId,
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
                        const cellId = generateId(8);
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
