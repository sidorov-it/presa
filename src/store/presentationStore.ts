import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useHistoryStore, HistoryAction } from './historyStore';
import {
    IPresentation,
    Slide,
    Layout,
    Element,
    GridStructure,
    LayoutType,
    BaseElement,
    GridCell,
    EditorElement,
    TipTapRefs,
    BackgroundSettings,
    SmartLayoutType,
    SmartLayoutElement,
    GeneratedContent,
    PresentationUpdateDiffRequest,
} from '@/types';
import getColumnWidths from '@/utils/getColumnWidths';
import { getNewEditorElement } from '@/utils/getNewEditorElement';
import debounce from 'lodash/debounce';
import cloneDeep from 'lodash/cloneDeep';
import { generateId } from '@/utils/id';
import { MutableRefObject } from 'react';
import getNewLayoutWithTextEditor from '@/utils/getNewLayoutWithTextEditor';
import { getPredefinedGridStructures } from '@/utils/getPredefinedGridStructures';
import { fillSlots } from '@/elements/commonRegisrty';
import { ChangeTiptapRefsEvent } from '@/customEvents/ChangeTiptapRefsEvent';
import { ElementType } from '@/types/elements';
import { diff, type Diff } from 'deep-diff';

export interface PresentationMeta {
    id: string;
    themeId: string | null;
    backgroundSettings?: BackgroundSettings;
}

export interface PresentationState {
    presentations: IPresentation[];
    lastSavedSnapshots: Record<string, IPresentation>;
    currentPresentationMeta: PresentationMeta | null;
    currentPresentationTitle: string;
    isLoading: boolean;
    isSaving: boolean;
    savingStatus: 'idle' | 'saving' | 'saved' | 'error';
    unsavedChanges: boolean;
    error: string | null;
    version: number;
    // incrementVersion: () => void;

    recordAction: (
        action: Omit<HistoryAction, 'timestamp' | 'transactionId' | 'changes'> & { before: any; after: any },
        isForceRecodrTransaction?: boolean
    ) => void;

    // Работа с презентациями
    createPresentation: (title: string) => Promise<string>;
    loadPresentation: (id: string) => Promise<IPresentation | null>;
    loadPresentationsList: () => Promise<void>;
    setCurrentPresentationMeta: (meta: PresentationMeta) => void;
    setCurrentPresentationTitle: (title: string) => void;
    updatePresentation: (id: string, data: Partial<IPresentation>) => void;
    deletePresentation: (id: string) => void;
    getPresentation: (id?: string) => IPresentation | undefined;
    setFullState: (state: { presentations: IPresentation[] }) => void;
    saveChanges: (id: string) => Promise<void>;

    // Theme management
    setTheme: (presentationId: string, themeId: string | null) => void;

    // Работа со слайдами
    addSlide: (presentationId: string, slide: Slide, index?: number) => void;
    addEmptySlide: (presentationId: string, index?: number) => string;
    updateSlide: (
        presentationId: string,
        slideId: string,
        data: Partial<Slide>,
        forceRecordTransactionAction?: boolean,
        isExcludeFromHistory?: {
            isExcludeFromHistory?: boolean;
            description?: string;
        }
    ) => void;
    deleteSlide: (presentationId: string, slideId: string) => void;
    duplicateSlide: (presentationId: string, slideId: string) => string;
    reorderSlides: (presentationId: string, startIndex: number, endIndex: number) => void;
    getSlide: (presentationId: string, slideId: string) => Slide | undefined;
    getSlideIndex: (presentationId: string, slideId: string) => number;
    setSlideLayouts: (presentationId: string, slideId: string, layouts: Layout[]) => void;

    getSlideIds: (presentationId: string) => string[];
    checkPresentationExists: (presentationId: string) => boolean;

    // Работа с макетами
    addLayout: (
        presentationId: string,
        slideId: string,
        layout: Omit<Layout, 'id'> | LayoutType,
        index?: number
    ) => string;
    updateLayout: (presentationId: string, slideId: string, layoutId: string, data: Partial<Layout>) => void;

    addColumnToTable: (presentationId: string, slideId: string, layoutId: string, columnIndex: number) => void;
    addRowToTable: (presentationId: string, slideId: string, layoutId: string, rowIndex: number) => void;
    deleteColumnFromTable: (presentationId: string, slideId: string, layoutId: string, columnIndex: number) => void;
    deleteRowFromTable: (presentationId: string, slideId: string, layoutId: string, rowIndex: number) => void;

    deleteLayout: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        isForceRecodrTransaction?: boolean
    ) => void;

    updateAlignLayout: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        alignment: 'top' | 'center' | 'bottom'
    ) => void;

    findLayoutByElementId: (elementId: string) => Layout | undefined;
    getLayout: (presentationId: string, slideId: string, layoutId: string) => Layout | undefined;
    getCell: (presentationId: string, slideId: string, layoutId: string, cellId: string) => GridCell | undefined;
    deleteCell: (presentationId: string, slideId: string, layoutId: string, cellId: string) => void;

    // Работа с элементами
    getElement: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        elementId: string
    ) => BaseElement | undefined;
    addElement: (presentationId: string, slideId: string, layoutId: string, element: Omit<BaseElement, 'id'>) => string;
    updateElement: ({
        presentationId,
        slideId,
        layoutId,
        elementId,
        data,
        createHistoryEntry,
        isTextElement,
        isExcludeFromHistory,
    }: {
        presentationId: string;
        slideId: string;
        layoutId: string;
        elementId: string;
        data: Partial<Element>;
        createHistoryEntry?: boolean;
        isTextElement?: boolean;
        isExcludeFromHistory?: boolean;
    }) => void;
    deleteElement: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        elementId: string,
        isForceRecodrTransaction?: boolean
    ) => void;
    duplicateElement: (presentationId: string, slideId: string, elementId: string) => void;
    addColumn: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        columnIndex: number,
        options?: {
            width?: number;
        }
    ) => void;
    addColumnLeft: (presentationId: string, slideId: string, layoutId: string, columnIndex: number) => void;
    addColumnRight: (presentationId: string, slideId: string, layoutId: string, columnIndex: number) => void;
    duplicateColumn: (presentationId: string, slideId: string, layoutId: string, cellId: string) => void;
    alignColumnTop: (presentationId: string, slideId: string, layoutId: string, cellId: string) => void;
    alignColumnCenter: (presentationId: string, slideId: string, layoutId: string, cellId: string) => void;
    alignColumnBottom: (presentationId: string, slideId: string, layoutId: string, cellId: string) => void;
    alignColumn: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        cellId: string,
        alignment: 'top' | 'center' | 'bottom'
    ) => void;
    deleteColumn: (presentationId: string, slideId: string, layoutId: string, columnIndex: number) => void;

    addColumnsAroundImage: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        options?: {
            width?: number;
            direction?: 'left' | 'right' | 'both';
        }
    ) => void;

    getCellElementIds: (presentationId: string, slideId: string, layoutId: string, cellId: string) => string[];

    changeTemplate: (presentationId: string, slideId: string, layoutId: string, template: LayoutType) => void;

    mergeSlideWithPrevious: (presentationId: string, slideId: string) => void;

    addTableLayout: (presentationId: string, slideId: string, tableLayout: Layout) => void;

    addLayoutWithElement: (
        presentationId: string,
        slideId: string,
        element: BaseElement
    ) => {
        layoutId: string;
        elementId: string;
    };

    getTableElements: (presentationId: string, slideId: string, layoutId: string) => BaseElement[];
    getTableColumnElements: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        tableColumnIndex: number
    ) => BaseElement[];
    getTableRowElements: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        tableRowIndex: number
    ) => BaseElement[];
    getTableFirstElement: (presentationId: string, slideId: string, layoutId: string) => BaseElement | null;

    getSlideElements: (presentationId: string, slideId: string) => BaseElement[];

    toggleItalicOnColumn: (presentationId: string, slideId: string, layoutId: string, tableColumnIndex: number) => void;
    toggleUnderlineOnColumn: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        tableColumnIndex: number
    ) => void;
    clearStylesOnColumn: (presentationId: string, slideId: string, layoutId: string, tableColumnIndex: number) => void;

    // getCommonTextColor: (presentationId: string, slideId: string, layoutId: string) => string;
    getCommonAlignment: (presentationId: string, slideId: string, layoutId: string) => string;
    getCommonHeadingLevel: (tiptapRefs: MutableRefObject<TipTapRefs>, elements: BaseElement[]) => number | null;
    getCommonTextColor: (tiptapRefs: MutableRefObject<TipTapRefs>, elements: BaseElement[]) => string | null;
    getCommonSlideTextColor: (
        tiptapRefs: MutableRefObject<TipTapRefs>,
        presentationId: string,
        slideId: string
    ) => string | null;
    getCommonTableHeadingLevel: (
        tiptapRefs: MutableRefObject<TipTapRefs>,
        presentationId: string,
        slideId: string,
        layoutId: string
    ) => number | null;
    getCommonRowHeadingLevel: (
        tiptapRefs: MutableRefObject<TipTapRefs>,
        presentationId: string,
        slideId: string,
        layoutId: string,
        tableRowIndex: number
    ) => number | null;
    getCommonColumnHeadingLevel: (
        tiptapRefs: MutableRefObject<TipTapRefs>,
        presentationId: string,
        slideId: string,
        layoutId: string,
        tableColumnIndex: number
    ) => number | null;

    equalizeTable: (presentationId: string, slideId: string, layoutId: string) => void;

    // Undo/Redo operations
    undo: (presentationId: string, tiptapRefs: MutableRefObject<TipTapRefs>) => void;
    redo: (presentationId: string, tiptapRefs: MutableRefObject<TipTapRefs>) => void;
    canUndo: (presentationId: string) => boolean;
    canRedo: (presentationId: string) => boolean;

    // Настройки фона презентации
    getBackgroundSettings: (presentationId: string) => BackgroundSettings | undefined;
    setBackgroundSettings: (
        presentationId: string,
        settings: { backgroundColor?: string; backgroundImage?: string }
    ) => void;

    changeSmartLayout: (presentationId: string, slideId: string, layoutId: string, type: SmartLayoutType) => void;

    removeSmartLayoutItem: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        elementId: string,
        itemId: string
    ) => void;
    removeImageFromSmartLayoutItem: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        elementId: string,
        itemId: string
    ) => void;
    addSmartLayoutItem: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        elementId: string,
        itemId: string,
        position: 'left' | 'right'
    ) => void;
    duplicateSmartLayoutItem: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        elementId: string,
        itemId: string
    ) => void;

    // Temporary state for resize operations
    resizeState: {
        isResizing: boolean;
        layoutId: string | null;
        columnWidths: string[] | null;
        originalColumnWidths: string[] | null;
    };

    // Resize state actions
    startResize: (layoutId: string, columnWidths: string[]) => void;
    updateTempColumnWidths: (columnWidths: string[]) => void;
    endResize: (presentationId: string, slideId: string, layoutId: string) => void;
    cancelResize: () => void;

    addTextEditorElement: (
        presentationId: string,
        slideId: string,
        layoutId: string,
        cellId: string,
        insertAtStart: boolean
    ) => string;

    updateSlideContent: (
        presentationId: string,
        slideId: string,
        content: GeneratedContent[],
        tiptapRefs: MutableRefObject<TipTapRefs>
    ) => void;

    clearCurrentPresentationMeta: () => void;
}

const getTiptapRefsIds = (elements: BaseElement[]) => {
    return elements
        .map(element => {
            if (element.elementTypeId === ElementType.SMART_LAYOUT) {
                return (element as SmartLayoutElement).items
                    .map(item => [`title-${element.id}-${item.id}`, `text-${element.id}-${item.id}`])
                    .flat();
            } else {
                return element.id;
            }
        })
        .filter(Boolean)
        .flat();
};

export const usePresentationStore = create<PresentationState>()(
    devtools(
        (set, get) => ({
            presentations: [],
            lastSavedSnapshots: {},
            currentPresentationMeta: null,
            currentPresentationTitle: 'Новая презентация',
            isLoading: false,
            isSaving: false,
            savingStatus: 'idle',
            unsavedChanges: false,
            error: null,
            version: 1,

            // incrementVersion: () => {
            //     set(state => ({ version: state.version + 1, unsavedChanges: true }));
            // },

            saveChanges: debounce(async (id: string) => {
                const presentation = get().getPresentation(id);
                if (!presentation) return;

                const snapshot = get().lastSavedSnapshots[id];

                if (!snapshot) {
                    console.warn('No snapshot found for presentation save operation', id);
                    return;
                }

                const changes = (diff(snapshot, presentation) ?? []) as Diff<IPresentation>[];

                if (changes.length === 0) {
                    return;
                }

                try {
                    set({ savingStatus: 'saving' });

                    const payload: PresentationUpdateDiffRequest = { diff: changes };

                    const response = await fetch(`/api/presentations/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                    });

                    if (!response.ok) {
                        throw new Error('Failed to save presentation');
                    }

                    set(state => {
                        const currentPresentation = state.presentations.find(p => p.id === id);
                        return {
                            lastSavedSnapshots: {
                                ...state.lastSavedSnapshots,
                                // Use current local state as the snapshot, not server data
                                // This ensures we compare against what we just saved, not what server returned
                                [id]: cloneDeep(currentPresentation),
                            },
                            savingStatus: 'saved',
                            unsavedChanges: false,
                        };
                    });

                    setTimeout(() => {
                        set({ savingStatus: 'idle' });
                    }, 2000);
                } catch (error) {
                    console.error('Error saving presentation:', error);
                    set({ savingStatus: 'error' });
                }
            }, 1000),

            recordAction: (
                action: Omit<HistoryAction, 'timestamp' | 'transactionId' | 'changes'> & { before: any; after: any },
                isForceRecodrTransaction?: boolean
            ) => {
                const historyStore = useHistoryStore.getState();
                if (historyStore.hasActiveTransaction(action.presentationId) && !isForceRecodrTransaction) {
                    // Don't record individual actions during a transaction
                    // Let the transaction helper handle it
                } else {
                    // Record action normally
                    historyStore.recordAction({ ...action });
                }
                // get().incrementVersion();
            },

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

                    set(state => ({
                        presentations: [...state.presentations, presentation],
                        lastSavedSnapshots: {
                            ...state.lastSavedSnapshots,
                            [presentation.id]: cloneDeep(presentation),
                        },
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
                    set({ isLoading: true, error: null, presentations: [] }); // Очищаем store перед загрузкой

                    const response = await fetch('/api/presentations');
                    if (!response.ok) {
                        throw new Error('Failed to load presentations');
                    }

                    const presentations = (await response.json()) as IPresentation[];

                    set(state => {
                        const updatedSnapshots = { ...state.lastSavedSnapshots };

                        presentations.forEach(presentation => {
                            updatedSnapshots[presentation.id] = cloneDeep(presentation);
                        });

                        return {
                            presentations,
                            isLoading: false,
                            lastSavedSnapshots: updatedSnapshots,
                        };
                    });
                } catch (error) {
                    console.error('Error loading presentations:', error);
                    set({
                        error: 'Failed to load presentations',
                        isLoading: false,
                    });
                }
            },

            setCurrentPresentationMeta: (meta: PresentationMeta) => {
                set({ currentPresentationMeta: meta });
            },

            setCurrentPresentationTitle: (title: string) => {
                set({ currentPresentationTitle: title });
            },

            loadPresentation: async (id: string) => {
                try {
                    set({ isLoading: true });

                    const response = await fetch(`/api/presentations/${id}`);
                    if (!response.ok) {
                        throw new Error('Failed to load presentation');
                    }

                    const presentation = await response.json();

                    set(state => ({
                        presentations: [...state.presentations.filter(p => p.id !== id), presentation],
                        currentPresentationMeta: {
                            id: presentation.id,
                            themeId: presentation.themeId,
                            backgroundSettings: presentation.backgroundSettings,
                        },
                        currentPresentationTitle: presentation.title,
                        lastSavedSnapshots: {
                            ...state.lastSavedSnapshots,
                            [presentation.id]: cloneDeep(presentation),
                        },
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

                set(state => {
                    const updatedPresentations = state.presentations.map(presentation =>
                        presentation.id === id ? { ...presentation, ...data, updatedAt: Date.now() } : presentation
                    );

                    let updatedMeta = state.currentPresentationMeta;
                    const metaKeys = ['themeId', 'backgroundSettings'];
                    const isMetaUpdated = Object.keys(data).some(key => metaKeys.includes(key));

                    if (state.currentPresentationMeta?.id === id && isMetaUpdated) {
                        updatedMeta = { ...state.currentPresentationMeta, ...(data as any) };
                    }
                    let updatedTitle = state.currentPresentationTitle;
                    if (state.currentPresentationMeta?.id === id && data.title !== undefined) {
                        updatedTitle = data.title;
                    }
                    const updatedState = {
                        presentations: updatedPresentations,
                        currentPresentationMeta: updatedMeta,
                        currentPresentationTitle: updatedTitle,
                    };

                    get().recordAction({
                        type: 'presentation',
                        description: 'Update presentation details',
                        presentationId: id,
                        before: { presentations: beforeState.presentations },
                        after: updatedState,
                    });

                    return updatedState;
                });

                // Save changes automatically
                get().saveChanges(id);
            },

            deletePresentation: id => {
                const presentation = get().getPresentation(id);
                if (!presentation) return;

                // Clear history for the presentation being deleted
                useHistoryStore.getState().clearHistory(id);

                set(state => {
                    const { [id]: _removedSnapshot, ...restSnapshots } = state.lastSavedSnapshots;

                    return {
                        presentations: state.presentations.filter(presentation => presentation.id !== id),
                        lastSavedSnapshots: restSnapshots,
                    };
                });
            },

            getPresentation: id => {
                return get().presentations.find(presentation => presentation.id === id);
            },

            addSlide: (presentationId, slide, index = 0) => {
                const beforeState = { ...get() };

                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                const newSlides = [...presentation.slides];

                                newSlides.splice(index, 0, slide);

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
                        slideId: slide.id,
                        before: { presentations: beforeState.presentations },
                        after: updatedState,
                    });

                    return updatedState;
                });

                // Add auto-save after completing the operation
                get().saveChanges(presentationId);
            },

            addEmptySlide: (presentationId, index = 0) => {
                const beforeState = { ...get() };

                const slideId = generateId();

                const defaultGridType = 'blank';
                const defaultLayoutGridStructure: GridStructure = getPredefinedGridStructures(defaultGridType);

                // Create editor elements for each cell
                const elements: EditorElement[] = defaultLayoutGridStructure.rows
                    .map(row => {
                        return row.cells.map(cell => {
                            return {
                                ...getNewEditorElement(),
                                cellId: cell.id,
                            };
                        });
                    })
                    .flat();

                const layout: Layout = {
                    id: generateId(),
                    gridStructure: defaultLayoutGridStructure,
                    type: defaultGridType,
                    style: {},
                    elements,
                };

                const newSlide: Slide = {
                    id: slideId,
                    title: `Слайд ${index + 1}`,
                    layouts: [layout],
                    style: {},
                    contentAlignment: 'center',
                    templateType: 'standard', // Default template type
                };

                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
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
                        after: updatedState,
                    });

                    return updatedState;
                });

                // Add auto-save after completing the operation
                get().saveChanges(presentationId);

                setTimeout(() => {
                    document.querySelector(`[data-slide-id="${slideId}"]`)?.scrollIntoView({ behavior: 'smooth' });
                }, 200);

                return slideId;
            },

            updateSlide: (presentationId, slideId, data, forceRecordTransactionAction, isExcludeFromHistory) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id === slideId) {
                                            return { ...slide, ...data };
                                        }
                                        return slide;
                                    }),
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    };

                    if (forceRecordTransactionAction) {
                        useHistoryStore.getState().recordTransactionAction({
                            type: 'element',
                            description: 'Update slide',
                            presentationId,
                            slideId,
                            before: { presentations: beforeState.presentations },
                            after: updatedState,
                        });
                    } else if (isExcludeFromHistory?.isExcludeFromHistory) {
                        console.log('exclude from history', isExcludeFromHistory.description);
                    } else {
                        get().recordAction({
                            type: 'slide',
                            description: 'Update slide',
                            presentationId,
                            slideId,
                            before: { presentations: beforeState.presentations },
                            after: updatedState,
                        });
                    }

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

                const removedElementsIds = getTiptapRefsIds(currentSlide.layouts.flatMap(layout => layout.elements));

                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.filter(slide => slide.id !== slideId),
                                    updatedAt: Date.now(),
                                };
                            }
                            return presentation;
                        }),
                    };

                    get().recordAction({
                        type: 'slide',
                        description: 'Delete slide',
                        presentationId,
                        slideId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState,
                    });

                    return updatedState;
                });

                removedElementsIds.forEach(elementId => {
                    ChangeTiptapRefsEvent.dispatch({
                        type: 'remove',
                        elementId,
                    });
                });
                // Add auto-save after deleting
                get().saveChanges(presentationId);
            },

            duplicateSlide: (presentationId, slideId) => {
                const beforeState = { ...get() };

                const { presentations } = get();
                const presentation = presentations.find(p => p.id === presentationId);

                if (!presentation) return '';

                const slideToClone = presentation.slides.find(s => s.id === slideId);

                if (!slideToClone) return '';

                const newSlideId = generateId();

                // Глубокое клонирование слайда с новыми ID
                const clonedSlide: Slide = {
                    ...JSON.parse(JSON.stringify(slideToClone)),
                    id: newSlideId,
                    title: `${slideToClone.title} (копия)`,
                    layouts: slideToClone.layouts.map(layout => ({
                        ...layout,
                        id: generateId(),
                        elements: layout.elements.map(element => ({
                            ...element,
                            id: generateId(),
                        })),
                    })),
                };

                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(p => {
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
                    };
                    get().recordAction({
                        type: 'slide',
                        description: 'Duplicate slide',
                        presentationId,
                        slideId: newSlideId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState,
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

                set(state => {
                    // удаляем текущий слайд
                    // обновляем layouts в предыдущем слайде
                    let updatedSlides = [...currentPresentation.slides];
                    updatedSlides.splice(currentSlideIndex, 1);

                    const updatedLayoutsInPreviousSlide = [...previousSlide.layouts, ...currentSlide.layouts];

                    updatedSlides = updatedSlides.map(slide => {
                        if (slide.id === previousSlide.id) {
                            return {
                                ...slide,
                                layouts: updatedLayoutsInPreviousSlide,
                            };
                        }
                        return slide;
                    });

                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
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
                        after: updatedState,
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

                set(state => {
                    const presentation = state.presentations.find(p => p.id === presentationId);

                    if (!presentation) return state;

                    const newSlides = [...presentation.slides];
                    const [removed] = newSlides.splice(startIndex, 1);
                    newSlides.splice(endIndex, 0, removed);

                    const updatedState = {
                        presentations: state.presentations.map(p =>
                            p.id === presentationId ? { ...p, slides: newSlides, updatedAt: Date.now() } : p
                        ),
                    };
                    get().recordAction({
                        type: 'presentation',
                        description: 'Reorder slides',
                        presentationId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState,
                    });

                    return updatedState;
                });

                // Add auto-save after reordering
                get().saveChanges(presentationId);
            },

            getSlideIds: (presentationId: string) => {
                const presentation = get().getPresentation(presentationId);
                if (!presentation) return [];
                return presentation.slides.map(slide => slide.id);
            },
            checkPresentationExists: (presentationId: string) => {
                const presentation = get().getPresentation(presentationId);
                return !!presentation;
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

            deleteCell: (presentationId, slideId, layoutId, cellId) => {
                const beforeState = { ...get() };

                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return;
                const cellElementsIds = getTiptapRefsIds(layout.elements.filter(element => element.cellId === cellId));

                layout.elements = layout.elements.filter(element => element.cellId !== cellId);

                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map(layout => {
                                                    if (layout.id === layoutId) {
                                                        return {
                                                            ...layout,
                                                            elements: layout.elements.filter(
                                                                element => element.cellId !== cellId
                                                            ),
                                                            gridStructure: {
                                                                ...layout.gridStructure,
                                                                rows: layout.gridStructure.rows.map(row => ({
                                                                    ...row,
                                                                    cells: row.cells.filter(cell => cell.id !== cellId),
                                                                })),
                                                                columns: layout.gridStructure.columns - 1,
                                                                columnWidths: getColumnWidths(
                                                                    layout.gridStructure.columns - 1
                                                                ),
                                                            },
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
                        type: 'layout',
                        description: 'Delete cell',
                        presentationId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState,
                    });

                    return updatedState;
                });

                // remove tiptap refs
                cellElementsIds.forEach(elementId => {
                    ChangeTiptapRefsEvent.dispatch({
                        type: 'remove',
                        elementId,
                    });
                });

                get().saveChanges(presentationId);
            },

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
                    const elements: EditorElement[] = gridStructure.rows
                        .map(row =>
                            row.cells.map(cell => {
                                return {
                                    ...getNewEditorElement(),
                                    cellId: cell.id,
                                };
                            })
                        )
                        .flat();

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
                        ...(layout as Layout),
                        id: layoutId,
                    };
                }

                set(state => {
                    const targetSlide = state.presentations
                        .find(p => p.id === presentationId)
                        ?.slides.find(s => s.id === slideId);

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
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
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
                        after: updatedState,
                    });

                    return updatedState;
                });

                // Add auto-save after adding layout
                get().saveChanges(presentationId);

                return layoutId;
            },

            addTableLayout: (presentationId, slideId, tableLayout) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: [...slide.layouts, tableLayout],
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
                        description: 'Add table',
                        presentationId,
                        slideId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState,
                    });

                    return updatedState;
                });

                get().saveChanges(presentationId);
            },

            addLayoutWithElement: (presentationId, slideId, element) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const layoutId = generateId();
                const elementId = generateId();
                set(state => {
                    const gridStructure = getPredefinedGridStructures('blank');

                    const cellId = gridStructure.rows[0].cells[0].id;

                    // Check if this element type should be treated as a table
                    const isTable = element.props?.isTable || false;

                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: [
                                                    ...slide.layouts,
                                                    {
                                                        id: layoutId,
                                                        elements: [
                                                            {
                                                                ...element,
                                                                id: elementId,
                                                                cellId,
                                                            },
                                                        ],
                                                        gridStructure,
                                                        type: 'blank' as LayoutType,
                                                        style: {},
                                                        isTable, // Add the isTable flag to the layout
                                                    },
                                                ],
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
                        description: 'Add layout with element',
                        presentationId,
                        slideId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState,
                    });

                    return updatedState;
                });

                get().saveChanges(presentationId);

                return {
                    layoutId,
                    elementId,
                };
            },

            getTableElements: (presentationId, slideId, layoutId) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return [];
                return layout.elements;
            },

            getTableColumnElements: (presentationId, slideId, layoutId, tableColumnIndex) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return [];
                const columnCellsIds = layout.gridStructure.rows.map(row => row.cells[tableColumnIndex].id);
                return layout.elements.filter(element => columnCellsIds.includes(element.cellId));
            },

            getTableRowElements: (presentationId, slideId, layoutId, tableRowIndex) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return [];
                const rowCellsIds = layout.gridStructure.rows[tableRowIndex].cells.map(cell => cell.id);
                return layout.elements.filter(element => rowCellsIds.includes(element.cellId));
            },

            getTableFirstElement: (presentationId, slideId, layoutId) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return null;
                return layout.elements[0];
            },

            getSlideElements: (presentationId, slideId) => {
                const slide = get().getSlide(presentationId, slideId);
                if (!slide) return [];
                return slide.layouts.flatMap(layout => layout.elements);
            },

            getCommonAlignment: (presentationId, slideId, layoutId) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return null;

                const allAlignments = layout.gridStructure.rows.flatMap(row => row.cells.map(cell => cell.alignment));
                const uniqueAlignments = new Set(allAlignments);

                return uniqueAlignments.size === 1 ? uniqueAlignments.values().next().value : null;
            },

            getCommonHeadingLevel: (tiptapRefs, elements) => {
                const notEmptyEditors = elements.filter(
                    element =>
                        tiptapRefs.current.editors[element.id] && !tiptapRefs.current.editors[element.id].editor.isEmpty
                );
                const allHeadingLevels = notEmptyEditors.map(
                    element => tiptapRefs.current.editors[element.id]?.editor.getAttributes('heading').level
                );
                const uniqueHeadingLevels = new Set(allHeadingLevels);
                return uniqueHeadingLevels.size === 1 ? uniqueHeadingLevels.values().next().value : null;
            },

            getCommonTextColor: (tiptapRefs, elements) => {
                const notEmptyEditors = elements.filter(
                    element =>
                        tiptapRefs.current.editors[element.id] && !tiptapRefs.current.editors[element.id].editor.isEmpty
                );
                const allTextColors = notEmptyEditors.map(
                    element => tiptapRefs.current.editors[element.id]?.editor.getAttributes('color').color
                );
                const uniqueTextColors = new Set(allTextColors);
                return uniqueTextColors.size === 1 ? uniqueTextColors.values().next().value : null;
            },

            getCommonSlideTextColor: (tiptapRefs, presentationId, slideId) => {
                const slide = get().getSlide(presentationId, slideId);
                if (!slide) return null;
                return get().getCommonTextColor(
                    tiptapRefs,
                    slide.layouts.flatMap(layout => layout.elements)
                );
            },

            getCommonTableHeadingLevel: (tiptapRefs, presentationId, slideId, layoutId) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return null;
                return get().getCommonHeadingLevel(tiptapRefs, layout.elements);
            },

            getCommonRowHeadingLevel: (tiptapRefs, presentationId, slideId, layoutId, tableRowIndex) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return null;
                const rowCellsIds = layout.gridStructure.rows[tableRowIndex].cells.map(cell => cell.id);
                return get().getCommonHeadingLevel(
                    tiptapRefs,
                    layout.elements.filter(element => rowCellsIds.includes(element.cellId))
                );
            },

            getCommonColumnHeadingLevel: (tiptapRefs, presentationId, slideId, layoutId, tableColumnIndex) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return null;
                const columnCellsIds = layout.gridStructure.rows.map(row => row.cells[tableColumnIndex].id);
                return get().getCommonHeadingLevel(
                    tiptapRefs,
                    layout.elements.filter(element => columnCellsIds.includes(element.cellId))
                );
            },

            equalizeTable: (presentationId, slideId, layoutId) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return;

                const beforeState = { ...get() };

                // const updatedGridStructure = {
                //     ...layout.gridStructure,
                //     columnWidths: getColumnWidths(layout.gridStructure.columns)
                // }
                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map(layout => {
                                                    if (layout.id === layoutId) {
                                                        return {
                                                            ...layout,
                                                            gridStructure: {
                                                                ...layout.gridStructure,
                                                                columnWidths: getColumnWidths(
                                                                    layout.gridStructure.columns
                                                                ),
                                                            },
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
                        description: 'Equalize table',
                        presentationId,
                        slideId,
                        layoutId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState,
                    });

                    return updatedState;
                });

                get().saveChanges(presentationId);
            },

            updateLayout: (presentationId, slideId, layoutId, data) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map(layout =>
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

                    // Record the action for history
                    get().recordAction({
                        type: 'layout',
                        description: 'Update layout',
                        presentationId,
                        slideId,
                        layoutId,
                        before: { presentations: beforeState.presentations },
                        after: updatedState,
                    });

                    console.log('updatedState', updatedState);
                    return updatedState;
                });

                // Add auto-save after updating layout
                get().saveChanges(presentationId);
            },

            deleteLayout: (presentationId, slideId, layoutId, isForceRecodrTransaction = false) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const layoutElementsIds = getTiptapRefsIds(currentLayout.elements);

                set(state => {
                    let updatedLayouts = currentSlide.layouts.filter(layout => layout.id !== layoutId);

                    if (updatedLayouts.length === 0) {
                        updatedLayouts = [getNewLayoutWithTextEditor()];
                    }

                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
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

                    get().recordAction(
                        {
                            type: 'layout',
                            description: 'Delete layout',
                            presentationId,
                            slideId,
                            layoutId,
                            before: { presentations: beforeState.presentations },
                            after: updatedState,
                        },
                        isForceRecodrTransaction
                    );

                    return updatedState;
                });

                layoutElementsIds.forEach(elementId => {
                    ChangeTiptapRefsEvent.dispatch({
                        type: 'remove',
                        elementId,
                    });
                });

                // Add auto-save after deleting layout
                get().saveChanges(presentationId);
            },

            addColumnToTable: (presentationId, slideId, layoutId, columnIndex) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                let updatedElements = currentLayout.elements;

                // Update grid structure
                const updatedGridStructure = {
                    ...currentLayout.gridStructure,
                    columns: currentLayout.gridStructure.columns + 1,
                    columnWidths: getColumnWidths(currentLayout.gridStructure.columns + 1),
                    rows: currentLayout.gridStructure.rows.map((row: { id: string; cells: GridCell[] }) => {
                        const cells = [...row.cells];

                        const newColumnId = generateId();

                        const newElement = {
                            ...getNewEditorElement(),
                            cellId: newColumnId,
                        };
                        updatedElements = [...updatedElements, newElement];

                        const newColumn: GridCell = {
                            id: newColumnId,
                            row: 0,
                            column: columnIndex,
                        };

                        cells.splice(columnIndex, 0, newColumn);
                        return {
                            ...row,
                            cells,
                        };
                    }),
                };

                // Create new elements for the column
                // let updatedElements = currentLayout.elements;
                // if (currentLayout.type === 'custom') {
                //     const firstRow = currentLayout.gridStructure.rows[0];
                //     if (!firstRow) return;
                //     const elements = currentLayout.elements.filter(element => element.cellId === firstRow.cells[0].id);
                //     const updatedNewElements = elements.map(element => ({
                //         ...element,
                //         id: generateId(),
                //         cellId: newColumnId,
                //     } as BaseElement));

                //     updatedElements = [...currentLayout.elements, ...updatedNewElements];
                // } else {
                // const newElement = getNewEditorElement(newColumnId);
                // updatedElements = [...currentLayout.elements, newElement];
                // }

                const updatedSlide = {
                    ...currentSlide,
                    layouts: currentSlide.layouts.map(layout => {
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

                const updatedPresentation = {
                    ...currentPresentation,
                    slides: currentPresentation.slides.map(slide => (slide.id === slideId ? updatedSlide : slide)),
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
                    position: 'right',
                    before: { presentations: beforeState.presentations },
                    after: updatedState,
                });

                get().saveChanges(presentationId);
            },

            deleteRowFromTable: (presentationId, slideId, layoutId, rowIndex) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const removedColumnsIds: string[] = [];

                currentLayout.gridStructure.rows[rowIndex].cells.forEach(cell => {
                    removedColumnsIds.push(cell.id);
                });

                const filteredElements = currentLayout.elements.filter(
                    element => !removedColumnsIds.includes(element.cellId)
                );

                const removedElementsIds = getTiptapRefsIds(
                    currentLayout.elements.filter(element => removedColumnsIds.includes(element.cellId))
                );

                const updatedRows = currentLayout.gridStructure.rows.filter(
                    row => row.id !== currentLayout.gridStructure.rows[rowIndex].id
                );

                // Update grid structure
                const updatedGridStructure: GridStructure = {
                    ...currentLayout.gridStructure,
                    rows: updatedRows,
                };

                const updatedSlide = {
                    ...currentSlide,
                    layouts: currentSlide.layouts.map(layout => {
                        if (layout.id === layoutId) {
                            return {
                                ...layout,
                                gridStructure: updatedGridStructure,
                                elements: filteredElements,
                            };
                        }
                        return layout;
                    }),
                };

                const updatedPresentation = {
                    ...currentPresentation,
                    slides: currentPresentation.slides.map(slide => (slide.id === slideId ? updatedSlide : slide)),
                };

                const updatedState = {
                    ...get(),
                    presentations: get().presentations.map(presentation =>
                        presentation.id === presentationId ? updatedPresentation : presentation
                    ),
                };

                set(updatedState);

                useHistoryStore.getState().recordAction({
                    type: 'row',
                    description: 'Remove row',
                    presentationId,
                    slideId,
                    layoutId,
                    before: { presentations: beforeState.presentations },
                    after: updatedState,
                });

                removedElementsIds.forEach(elementId => {
                    ChangeTiptapRefsEvent.dispatch({
                        type: 'remove',
                        elementId,
                    });
                });
                get().saveChanges(presentationId);
            },

            deleteColumnFromTable: (presentationId, slideId, layoutId, columnIndex) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const removedColumnsIds: string[] = [];

                // Update grid structure
                const updatedGridStructure = {
                    ...currentLayout.gridStructure,
                    columns: currentLayout.gridStructure.columns - 1,
                    columnWidths: getColumnWidths(currentLayout.gridStructure.columns - 1),
                    rows: currentLayout.gridStructure.rows.map((row: { id: string; cells: GridCell[] }) => {
                        removedColumnsIds.push(row.cells[columnIndex].id);

                        const cells = [...row.cells];
                        cells.splice(columnIndex, 1);
                        return {
                            ...row,
                            cells,
                        };
                    }),
                };

                // Create new elements for the column
                const updatedElements = currentLayout.elements.filter(
                    element => !removedColumnsIds.includes(element.cellId)
                );

                const removedElementsIds = getTiptapRefsIds(
                    currentLayout.elements.filter(element => removedColumnsIds.includes(element.cellId))
                );

                const updatedSlide = {
                    ...currentSlide,
                    layouts: currentSlide.layouts.map(layout => {
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

                const updatedPresentation = {
                    ...currentPresentation,
                    slides: currentPresentation.slides.map(slide => (slide.id === slideId ? updatedSlide : slide)),
                };

                const updatedState = {
                    ...get(),
                    presentations: get().presentations.map(presentation =>
                        presentation.id === presentationId ? updatedPresentation : presentation
                    ),
                };

                set(updatedState);

                removedElementsIds.forEach(elementId => {
                    ChangeTiptapRefsEvent.dispatch({
                        type: 'remove',
                        elementId,
                    });
                });

                useHistoryStore.getState().recordAction({
                    type: 'column',
                    description: 'Remove column',
                    presentationId,
                    slideId,
                    layoutId,
                    cellId: removedColumnsIds[0],
                    before: { presentations: beforeState.presentations },
                    after: updatedState,
                });

                get().saveChanges(presentationId);
            },

            addRowToTable: (presentationId, slideId, layoutId, rowIndex) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                // Получаем необходимые данные
                const cellsCount = currentLayout.gridStructure.columns;
                const rowsCount = currentLayout.gridStructure.rows.length;

                // Создаем новые ячейки для новой строки
                const newCells = Array.from({ length: cellsCount }, (_, i) => ({
                    id: generateId(8),
                    column: i,
                    row: rowsCount,
                }));

                // Создаем новые элементы для каждой ячейки
                const newElements: Element[] = newCells.map(cell => {
                    return {
                        ...getNewEditorElement(),
                        cellId: cell.id,
                    } as Element;
                });

                const updatedRows = [...currentLayout.gridStructure.rows];
                updatedRows.splice(rowIndex, 0, {
                    id: generateId(8),
                    cells: newCells,
                });

                // Создаем обновленную структуру сетки с новой строкой
                const updatedGridStructure = {
                    ...currentLayout.gridStructure,
                    rows: updatedRows,
                };

                // Создаем обновленный layout
                const updatedLayout = {
                    ...currentLayout,
                    gridStructure: updatedGridStructure,
                    elements: [...currentLayout.elements, ...newElements],
                };

                // Обновляем состояние, соблюдая иммутабельность на всех уровнях
                set(state => {
                    return {
                        ...state,
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id !== presentationId) return presentation;

                            return {
                                ...presentation,
                                updatedAt: Date.now(),
                                slides: presentation.slides.map(slide => {
                                    if (slide.id !== slideId) return slide;

                                    return {
                                        ...slide,
                                        layouts: slide.layouts.map(layout =>
                                            layout.id === layoutId ? updatedLayout : layout
                                        ),
                                    };
                                }),
                            };
                        }),
                    };
                });

                // Запись действия для истории
                get().recordAction({
                    type: 'layout',
                    description: 'Add row to table',
                    presentationId,
                    slideId,
                    layoutId,
                    before: { presentations: beforeState.presentations },
                    after: { presentations: get().presentations },
                });

                // Автосохранение
                get().saveChanges(presentationId);
            },

            updateAlignLayout: (presentationId, slideId, layoutId, alignment) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id !== slideId) return slide;
                                        return {
                                            ...slide,
                                            layouts: slide.layouts.map(layout => {
                                                if (layout.id === layoutId) {
                                                    return {
                                                        ...layout,
                                                        gridStructure: {
                                                            ...layout.gridStructure,
                                                            rows: layout.gridStructure.rows.map(row => {
                                                                return {
                                                                    ...row,
                                                                    cells: row.cells.map(cell => ({
                                                                        ...cell,
                                                                        alignment,
                                                                    })),
                                                                };
                                                            }),
                                                        },
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
                        after: updatedState,
                    });

                    return updatedState;
                });

                get().saveChanges(presentationId);
            },

            findLayoutByElementId: elementId => {
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

            getCellElementIds: (presentationId, slideId, layoutId, cellId) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return [];
                return layout.elements.filter(element => element.cellId === cellId).map(el => el.id);
            },

            getElement: (presentationId, slideId, layoutId, elementId) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return null;
                return layout.elements.find(element => element.id === elementId);
            },
            addElement: (presentationId, slideId, layoutId, elementData) => {
                const beforeState = { ...get() };

                const elementId = generateId();

                const newElement: BaseElement = {
                    ...(elementData as BaseElement),
                    id: elementId,
                    elementTypeId: elementData.elementTypeId || '',
                    cellId: elementData.cellId || '',
                };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return elementId;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return elementId;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return elementId;

                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map(layout => {
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
                        after: updatedState,
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

                const currentLayout = currentSlide.layouts.find(layout =>
                    layout.elements.some(element => element.id === elementId)
                );
                if (!currentLayout) return;

                const currentElement = currentLayout.elements.find(element => element.id === elementId);
                if (!currentElement) return;

                const newElement = {
                    ...getNewEditorElement(),
                    cellId: currentElement.cellId,
                };

                set(state => {
                    let updatedState;
                    if (currentLayout.gridStructure.columns > 1) {
                        updatedState = {
                            presentations: state.presentations.map(presentation => {
                                if (presentation.id === presentationId) {
                                    return {
                                        ...presentation,
                                        slides: presentation.slides.map(slide => {
                                            if (slide.id === slideId) {
                                                return {
                                                    ...slide,
                                                    layouts: slide.layouts.map(layout => {
                                                        if (layout.id === currentLayout.id) {
                                                            const updatedElements = [...layout.elements];
                                                            const targetIndex = updatedElements.findIndex(
                                                                element => element.id === elementId
                                                            );
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
                            after: updatedState,
                        });
                    } else {
                        const cellId = generateId();
                        const newLayout: Layout = {
                            id: generateId(),
                            gridStructure: {
                                columns: 1,
                                columnWidths: getColumnWidths(1),
                                rows: [
                                    {
                                        id: generateId(),
                                        cells: [
                                            {
                                                id: cellId,
                                                row: 0,
                                                column: 1,
                                            },
                                        ],
                                    },
                                ],
                            },
                            type: currentLayout.type,
                            elements: [
                                {
                                    ...newElement,
                                    cellId,
                                },
                            ],
                            style: currentLayout.style,
                        };
                        const currentLayoutIndex = currentSlide.layouts.findIndex(
                            layout => layout.id === currentLayout.id
                        );
                        const updatedLayouts = JSON.parse(JSON.stringify(currentSlide.layouts));

                        updatedLayouts.splice(currentLayoutIndex + 1, 0, newLayout);

                        updatedState = {
                            presentations: state.presentations.map(presentation => {
                                if (presentation.id === presentationId) {
                                    return {
                                        ...presentation,
                                        slides: presentation.slides.map(slide => {
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
                });
            },
            updateElement: ({
                presentationId,
                slideId,
                layoutId,
                elementId,
                data,
                createHistoryEntry = true,
                isTextElement = false,
                isExcludeFromHistory = false,
            }) => {
                const beforeStatePresentations = JSON.parse(JSON.stringify(get().presentations));

                set(state => {
                    const newPresentations = state.presentations.map(presentation => {
                        if (presentation.id !== presentationId) {
                            return presentation;
                        }

                        // Ensure the element exists before creating new object references
                        const slideExists = presentation.slides.some(s => s.id === slideId);
                        const layoutExists =
                            slideExists &&
                            presentation.slides.find(s => s.id === slideId)!.layouts.some(l => l.id === layoutId);
                        const elementExists =
                            layoutExists &&
                            presentation.slides
                                .find(s => s.id === slideId)!
                                .layouts.find(l => l.id === layoutId)!
                                .elements.some(e => e.id === elementId);

                        if (!elementExists) {
                            return presentation;
                        }

                        return {
                            ...presentation,
                            updatedAt: Date.now(),
                            slides: presentation.slides.map(slide => {
                                if (slide.id !== slideId) {
                                    return slide;
                                }
                                return {
                                    ...slide,
                                    layouts: slide.layouts.map(layout => {
                                        if (layout.id !== layoutId) {
                                            return layout;
                                        }
                                        return {
                                            ...layout,
                                            elements: layout.elements.map(element => {
                                                if (element.id !== elementId) {
                                                    return element;
                                                }
                                                return {
                                                    ...element,
                                                    ...data,
                                                };
                                            }),
                                        };
                                    }),
                                };
                            }),
                        };
                    });

                    return { presentations: newPresentations };
                });

                // Record action for history
                const afterStatePresentations = get().presentations;
                if (createHistoryEntry && !isExcludeFromHistory) {
                    useHistoryStore.getState().recordTransactionAction({
                        type: 'element',
                        description: 'Update element',
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        isTextElement,
                        before: { presentations: beforeStatePresentations },
                        after: { presentations: afterStatePresentations },
                    });
                } else if (!isExcludeFromHistory) {
                    get().recordAction({
                        type: 'element',
                        description: 'Update element',
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        isTextElement,
                        before: { presentations: beforeStatePresentations },
                        after: { presentations: afterStatePresentations },
                    });
                }
                get().saveChanges(presentationId);
            },

            deleteElement: (presentationId, slideId, layoutId, elementId, isForceRecodrTransaction = false) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const currentElement = currentLayout.elements.find(element => element.id === elementId);
                if (!currentElement) return;

                set(state => {
                    const presentation = state.presentations.find(p => p.id === presentationId);
                    const slide = presentation!.slides.find(s => s.id === slideId);

                    const filteredElements = currentLayout.elements.filter(element => element.id !== elementId);
                    let updatedLayouts;

                    if (currentLayout.isTable) {
                        const cellId = currentElement.cellId;

                        const isEmptyCell = !filteredElements.some(element => element.cellId === cellId);

                        if (isEmptyCell) {
                            updatedLayouts = slide!.layouts.filter(layout => layout.id !== layoutId);
                            const newElement = {
                                ...getNewEditorElement(),
                                cellId,
                            };

                            filteredElements.push(newElement);

                            updatedLayouts = slide!.layouts.map(layout => {
                                if (layout.id === layoutId) {
                                    return { ...layout, elements: filteredElements };
                                }
                                return layout;
                            });
                        } else {
                            updatedLayouts = slide!.layouts.map(layout => {
                                if (layout.id === layoutId) {
                                    return { ...layout, elements: filteredElements };
                                }
                                return layout;
                            });
                        }
                    } else if (filteredElements.length === 0) {
                        updatedLayouts = slide!.layouts.filter(layout => layout.id !== layoutId);
                        if (updatedLayouts.length === 0) {
                            updatedLayouts = [getNewLayoutWithTextEditor()];
                        }
                    } else {
                        updatedLayouts = slide!.layouts.map(layout => {
                            if (layout.id === layoutId) {
                                return { ...layout, elements: filteredElements };
                            }
                            return layout;
                        });
                    }

                    // const filteredLayouts = slide.layouts.filter(layout => layout.id !== layoutId);

                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
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

                    // Record the action for history
                    get().recordAction(
                        {
                            type: 'element',
                            description: 'Delete element',
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            before: { presentations: beforeState.presentations },
                            after: updatedState,
                        },
                        isForceRecodrTransaction
                    );
                    return updatedState;
                });

                ChangeTiptapRefsEvent.dispatch({
                    type: 'remove',
                    elementId,
                });
                // Add auto-save after deleting element
                get().saveChanges(presentationId);
            },

            addColumnsAroundImage: (presentationId, slideId, layoutId, options) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                if (options?.direction === 'left' || options?.direction === 'right') {
                    const newColumnId = generateId();

                    const newColumnIndex = options?.direction === 'left' ? 1 : 2;
                    const columnIndex = options?.direction === 'left' ? 1 : 0;

                    const newColumn: GridCell = {
                        id: newColumnId,
                        row: 0,
                        column: newColumnIndex,
                    };

                    let columnWidths;
                    if (options?.width) {
                        columnWidths = getColumnWidths(currentLayout.gridStructure.columns + 1, {
                            columnIndex,
                            width: options?.width,
                        });
                    } else {
                        columnWidths = getColumnWidths(currentLayout.gridStructure.columns + 1);
                    }
                    // Update grid structure
                    const updatedGridStructure = {
                        ...currentLayout.gridStructure,
                        columns: currentLayout.gridStructure.columns + 1,
                        columnWidths,
                        rows: currentLayout.gridStructure.rows.map((row: { id: string; cells: GridCell[] }) => {
                            const updatedCells = row.cells.map(cell => {
                                if (options?.direction === 'left') {
                                    return {
                                        ...cell,
                                        column: cell.column + 1,
                                    };
                                }
                                return cell;
                            });

                            updatedCells.splice(newColumnIndex, 0, newColumn);
                            updatedCells.sort((a, b) => a.column - b.column);
                            return {
                                ...row,
                                cells: updatedCells,
                            };
                        }),
                    };

                    const newElement = {
                        ...getNewEditorElement(),
                        cellId: newColumnId,
                    };
                    const updatedElements = [...currentLayout.elements, newElement];

                    set(state => {
                        const updatedState = {
                            ...state,
                            presentations: state.presentations.map(presentation => {
                                if (presentation.id === presentationId) {
                                    return {
                                        ...presentation,
                                        slides: presentation.slides.map(slide => {
                                            if (slide.id === slideId) {
                                                return {
                                                    ...slide,
                                                    layouts: slide.layouts.map(layout => {
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

                        useHistoryStore.getState().recordAction({
                            type: 'column',
                            description: 'Add column',
                            presentationId,
                            slideId,
                            layoutId,
                            cellId: newColumnId,
                            position: 'right',
                            before: { presentations: beforeState.presentations },
                            after: updatedState,
                        });

                        return updatedState;
                    });
                } else {
                    // создаем 2 новые ячейки
                    const newLeftCellId = generateId();
                    const newRightCellId = generateId();
                    // создаем 2 новых редактора
                    const newLeftCell: GridCell = {
                        id: newLeftCellId,
                        row: 0,
                        column: 1,
                    };
                    const newRightCell: GridCell = {
                        id: newRightCellId,
                        row: 0,
                        column: 3,
                    };
                    const newLeftElement = {
                        ...getNewEditorElement(),
                        cellId: newLeftCellId,
                    };
                    const newRightElement = {
                        ...getNewEditorElement(),
                        cellId: newRightCellId,
                    };
                    // обновляем gridStructure.
                    const columnWidths = getColumnWidths(currentLayout.gridStructure.columns + 2, {
                        columnIndex: 1,
                        width: options!.width!,
                    });

                    const updatedGridStructure = {
                        ...currentLayout.gridStructure,
                        columns: currentLayout.gridStructure.columns + 2,
                        columnWidths,
                        rows: currentLayout.gridStructure.rows.map((row: { id: string; cells: GridCell[] }) => {
                            const updatedCells = [
                                {
                                    ...row.cells[0],
                                    column: 2,
                                },
                            ];
                            updatedCells.splice(0, 0, newLeftCell);
                            updatedCells.splice(2, 0, newRightCell);
                            return {
                                ...row,
                                cells: updatedCells,
                            };
                        }),
                    };

                    const updatedElements = [newLeftElement, ...currentLayout.elements, newRightElement];

                    set(state => {
                        const updatedState = {
                            ...state,
                            presentations: state.presentations.map(presentation => {
                                if (presentation.id === presentationId) {
                                    return {
                                        ...presentation,
                                        slides: presentation.slides.map(slide => {
                                            if (slide.id === slideId) {
                                                return {
                                                    ...slide,
                                                    layouts: slide.layouts.map(layout => {
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

                        useHistoryStore.getState().recordAction({
                            type: 'column',
                            description: 'Add columns',
                            presentationId,
                            slideId,
                            layoutId,
                            // cellId: newColumnId,
                            // position: 'right',
                            before: { presentations: beforeState.presentations },
                            after: updatedState,
                        });

                        return updatedState;
                    });
                }
            },

            addColumn: (presentationId, slideId, layoutId, columnIndex, options) => {
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
                    column: columnIndex,
                };

                let columnWidths;
                if (options?.width) {
                    columnWidths = getColumnWidths(currentLayout.gridStructure.columns + 1, {
                        columnIndex,
                        width: options?.width,
                    });
                } else {
                    columnWidths = getColumnWidths(currentLayout.gridStructure.columns + 1);
                }
                // Update grid structure
                const updatedGridStructure = {
                    ...currentLayout.gridStructure,
                    columns: currentLayout.gridStructure.columns + 1,
                    columnWidths,
                    rows: currentLayout.gridStructure.rows.map((row: { id: string; cells: GridCell[] }) => {
                        const updatedCells = [...row.cells];
                        updatedCells.splice(columnIndex, 0, newColumn);
                        return {
                            ...row,
                            cells: updatedCells,
                        };
                    }),
                };

                // Create new elements for the column
                let updatedElements = currentLayout.elements;
                if (currentLayout.type === 'custom') {
                    const firstRow = currentLayout.gridStructure.rows[0];
                    if (!firstRow) return;
                    const elements = currentLayout.elements.filter(element => element.cellId === firstRow.cells[0].id);
                    const updatedNewElements = elements.map(
                        element =>
                            ({
                                ...element,
                                id: generateId(),
                                cellId: newColumnId,
                            }) as BaseElement
                    );
                    updatedElements = [...currentLayout.elements, ...updatedNewElements];
                } else {
                    const newElement = {
                        ...getNewEditorElement(),
                        cellId: newColumnId,
                    };
                    updatedElements = [...currentLayout.elements, newElement];
                }

                const updatedSlide = {
                    ...currentSlide,
                    layouts: currentSlide.layouts.map(layout => {
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

                const updatedPresentation = {
                    ...currentPresentation,
                    slides: currentPresentation.slides.map(slide => (slide.id === slideId ? updatedSlide : slide)),
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
                    cellId: newColumnId,
                    position: 'right',
                    before: { presentations: beforeState.presentations },
                    after: updatedState,
                });
            },

            addColumnLeft: (presentationId: string, slideId: string, layoutId: string, columnIndex: number) => {
                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                get().addColumn(presentationId, slideId, layoutId, columnIndex);
            },

            addColumnRight: (presentationId: string, slideId: string, layoutId: string, columnIndex: number) => {
                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                // +2 так как +1 - это индекс следующего элемента, и +1, так как columnIndex начинается с 1
                get().addColumn(presentationId, slideId, layoutId, columnIndex + 2);
            },

            duplicateColumn: (presentationId: string, slideId: string, layoutId: string, cellId: string) => {
                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const currentCell = currentLayout.gridStructure.rows[0].cells.find(cell => cell.id === cellId);
                if (!currentCell) return;

                const cellIndex = currentLayout.gridStructure.rows[0].cells.findIndex(cell => cell.id === cellId);
                if (cellIndex === -1) return;

                // 1. Get all elements from the original cell
                const elementsToClone = currentLayout.elements.filter(element => element.cellId === cellId);

                // 2. Generate new cell ID and create cell structure
                const newCellId = generateId();
                const newCell: GridCell = {
                    id: newCellId,
                    row: 0,
                    column: cellIndex + 1,
                };

                // 3. Clone elements and assign new IDs
                const clonedElements = elementsToClone.map(element => {
                    // Create base clone with new ID
                    const baseClone = {
                        ...element,
                        id: generateId(),
                        cellId: newCellId,
                    };

                    // Handle special cases for different element types
                    if (element.elementTypeId === 'smart-layout') {
                        // Clone SmartLayout items with new IDs
                        const smartLayoutElement = element as SmartLayoutElement;
                        return {
                            ...baseClone,
                            items: smartLayoutElement.items.map(item => ({
                                ...item,
                                id: generateId(),
                            })),
                        };
                    }

                    return baseClone;
                });

                const beforeState = { ...get() };
                let updatedState: { presentations: IPresentation[] } = { presentations: [] };

                // 4. Update the state with new cell and cloned elements
                set(state => {
                    updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map(layout => {
                                                    if (layout.id === layoutId) {
                                                        // Calculate new column widths
                                                        const columnCount =
                                                            layout.gridStructure.rows[0].cells.length + 1;
                                                        const columnWidths = getColumnWidths(columnCount);

                                                        return {
                                                            ...layout,
                                                            elements: [...layout.elements, ...clonedElements],
                                                            gridStructure: {
                                                                ...layout.gridStructure,
                                                                columns: columnCount,
                                                                columnWidths,
                                                                rows: layout.gridStructure.rows.map((row, rowIndex) => {
                                                                    if (rowIndex === 0) {
                                                                        // Insert new cell after the current cell
                                                                        const cells = [...row.cells];
                                                                        cells.splice(cellIndex + 1, 0, newCell);
                                                                        return {
                                                                            ...row,
                                                                            cells,
                                                                        };
                                                                    }
                                                                    return row;
                                                                }),
                                                            },
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

                    return updatedState;
                });

                get().recordAction({
                    type: 'column',
                    description: 'Duplicate column',
                    presentationId,
                    slideId,
                    layoutId,
                    cellId: newCellId,
                    before: { presentations: beforeState.presentations },
                    after: updatedState,
                });

                get().saveChanges(presentationId);
            },

            alignColumn: (presentationId, slideId, layoutId, cellId, alignment) => {
                const beforeState = { ...get() };

                const currentPresentation = get().getPresentation(presentationId);
                if (!currentPresentation) return;

                const currentSlide = currentPresentation.slides.find(slide => slide.id === slideId);
                if (!currentSlide) return;

                const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
                if (!currentLayout) return;

                const currentCell = currentLayout.gridStructure.rows[0].cells.find(cell => cell.id === cellId);
                if (!currentCell) return;

                const updatedGridStructure = JSON.parse(JSON.stringify(currentLayout.gridStructure));
                updatedGridStructure.rows[0].cells.find((cell: GridCell) => cell.id === cellId).alignment = alignment;

                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map(layout => {
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
                        cellId,
                        alignment,
                        before: { presentations: beforeState.presentations },
                        after: updatedState,
                    });
                    return updatedState;
                });

                get().saveChanges(presentationId);
            },

            alignColumnTop: (presentationId, slideId, layoutId, cellId) => {
                get().alignColumn(presentationId, slideId, layoutId, cellId, 'top');
            },

            alignColumnCenter: (presentationId, slideId, layoutId, cellId) => {
                get().alignColumn(presentationId, slideId, layoutId, cellId, 'center');
            },

            alignColumnBottom: (presentationId, slideId, layoutId, cellId) => {
                get().alignColumn(presentationId, slideId, layoutId, cellId, 'bottom');
            },

            deleteColumn: (presentationId: string, slideId: string, layoutId: string, cellId: string) => {
                const beforeState = { ...get() };
                const presentation = get().getPresentation(presentationId);
                if (!presentation) return;

                const slide = presentation.slides.find(s => s.id === slideId);
                if (!slide) return;

                const layout = slide.layouts.find(l => l.id === layoutId);
                if (!layout) return;

                // Find the column to delete
                let rowIndex = -1;
                let columnIndex = -1;

                // Find the row and column index
                layout.gridStructure.rows.forEach((row, rIndex) => {
                    row.cells.forEach((cell, cIndex) => {
                        if (cell.id === cellId) {
                            rowIndex = rIndex;
                            columnIndex = cIndex;
                        }
                    });
                });

                if (rowIndex === -1 || columnIndex === -1) return;

                // Make a deep copy of the grid structure
                const newGridStructure = JSON.parse(JSON.stringify(layout.gridStructure));

                // Get the row
                const row = newGridStructure.rows[rowIndex];

                // Remove the cell
                row.cells.splice(columnIndex, 1);

                const removedElementsIds = getTiptapRefsIds(
                    layout.elements.filter(element => element.cellId === cellId)
                );

                // Remove all elements in the cell
                const updatedElements = layout.elements.filter(element => element.cellId !== cellId);

                // Update layout
                const updatedLayouts = slide.layouts.map(l => {
                    if (l.id === layoutId) {
                        return {
                            ...l,
                            gridStructure: newGridStructure,
                            elements: updatedElements,
                        };
                    }
                    return l;
                });

                // Update the slide
                const updatedSlides = presentation.slides.map(s => {
                    if (s.id === slideId) {
                        return {
                            ...s,
                            layouts: updatedLayouts,
                        };
                    }
                    return s;
                });

                // Update the presentation
                set({
                    presentations: get().presentations.map(p => {
                        if (p.id === presentationId) {
                            return {
                                ...p,
                                slides: updatedSlides,
                                updatedAt: Date.now(),
                            };
                        }
                        return p;
                    }),
                });

                removedElementsIds.forEach(elementId => {
                    ChangeTiptapRefsEvent.dispatch({
                        type: 'remove',
                        elementId,
                    });
                });

                // Save changes
                get().saveChanges(presentationId);

                // Record action
                get().recordAction({
                    type: 'layout',
                    description: 'Delete column',
                    presentationId,
                    before: { presentations: beforeState.presentations },
                    after: { presentations: get().presentations },
                });

                // Increment version to ensure UI updates
                // get().incrementVersion();
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
                    const strippedColumns = updatedGridStructure.rows[0].cells.slice(
                        newColumnsCount,
                        updatedGridStructure.rows[0].cells.length
                    );
                    const updatedColumns = updatedGridStructure.rows[0].cells.slice(0, newColumnsCount);

                    const lastColumn = updatedColumns[updatedColumns.length - 1];

                    updatedGridStructure.columns = newColumnsCount;

                    const updatedElements = layout.elements.map(element => {
                        if (strippedColumns.some(column => column.id === element.cellId)) {
                            return {
                                ...element,
                                cellId: lastColumn.id,
                            };
                        }
                        return element;
                    });

                    updatedGridStructure.rows[0].cells = updatedColumns;

                    set(state => {
                        const updatedState = {
                            presentations: state.presentations.map(presentation => {
                                if (presentation.id === presentationId) {
                                    return {
                                        ...presentation,
                                        slides: presentation.slides.map(slide => {
                                            if (slide.id === slideId) {
                                                return {
                                                    ...slide,
                                                    layouts: slide.layouts.map(layout => {
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
                            after: updatedState,
                        });

                        return updatedState;
                    });
                } else if (currentColumnsCount < newColumnsCount) {
                    updatedGridStructure.columns = newColumnsCount;

                    const newElements: BaseElement[] = [];

                    const newCells: GridCell[] = new Array(newColumnsCount - currentColumnsCount)
                        .fill(null)
                        .map((_, index) => {
                            const cellId = generateId();

                            const newEditor = {
                                ...getNewEditorElement(),
                                cellId,
                            };
                            newElements.push(newEditor as BaseElement);

                            return {
                                id: cellId,
                                row: 0,
                                column: currentColumnsCount + index + 1,
                            };
                        });

                    updatedGridStructure.rows[0].cells = updatedGridStructure.rows[0].cells.concat(newCells);
                    const updatedElements = layout.elements.concat(newElements);

                    set(state => {
                        const updatedState = {
                            presentations: state.presentations.map(presentation => {
                                if (presentation.id === presentationId) {
                                    return {
                                        ...presentation,
                                        slides: presentation.slides.map(slide => {
                                            if (slide.id === slideId) {
                                                return {
                                                    ...slide,
                                                    layouts: slide.layouts.map(layout => {
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
                            after: updatedState,
                        });

                        return updatedState;
                    });
                } else {
                    set(state => {
                        const updatedState = {
                            presentations: state.presentations.map(presentation => {
                                if (presentation.id === presentationId) {
                                    return {
                                        ...presentation,
                                        slides: presentation.slides.map(slide => {
                                            if (slide.id === slideId) {
                                                return {
                                                    ...slide,
                                                    layouts: slide.layouts.map(layout => {
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
                            after: updatedState,
                        });

                        return updatedState;
                    });
                }

                get().saveChanges(presentationId);
            },

            // Undo/Redo operations - delegate to history store
            undo: (presentationId: string, tiptapRefs: MutableRefObject<TipTapRefs>) => {
                useHistoryStore.getState().undo(presentationId, tiptapRefs);
                get().saveChanges(presentationId);
            },

            redo: (presentationId: string, tiptapRefs: MutableRefObject<TipTapRefs>) => {
                useHistoryStore.getState().redo(presentationId, tiptapRefs);
                get().saveChanges(presentationId);
            },

            canUndo: (presentationId: string) => {
                return useHistoryStore.getState().canUndo(presentationId);
            },

            canRedo: (presentationId: string) => {
                return useHistoryStore.getState().canRedo(presentationId);
            },

            getBackgroundSettings: (presentationId: string) => {
                const presentation = get().getPresentation(presentationId);
                return presentation?.backgroundSettings;
            },
            setBackgroundSettings: (
                presentationId: string,
                settings: { backgroundColor?: string; backgroundImage?: string }
            ) => {
                const presentation = get().getPresentation(presentationId);
                if (!presentation) return;
                get().updatePresentation(presentationId, {
                    backgroundSettings: { ...presentation.backgroundSettings, ...settings },
                });
            },

            removeSmartLayoutItem: (
                presentationId: string,
                slideId: string,
                layoutId: string,
                elementId: string,
                itemId: string
            ) => {
                const presentation = get().getPresentation(presentationId);
                if (!presentation) return;
                get().updatePresentation(presentationId, {
                    slides: presentation.slides.map(slide => {
                        if (slide.id === slideId) {
                            return {
                                ...slide,
                                layouts: slide.layouts.map(layout => {
                                    if (layout.id === layoutId) {
                                        return {
                                            ...layout,
                                            elements: layout.elements.map(element => {
                                                if (element.id === elementId && 'items' in element) {
                                                    const updatedItems = (element as SmartLayoutElement).items.filter(
                                                        item => item.id !== itemId
                                                    );

                                                    return { ...element, items: updatedItems } as SmartLayoutElement;
                                                }
                                                return element;
                                            }),
                                        };
                                    }
                                    return layout;
                                }),
                            };
                        }
                        return slide;
                    }),
                });
            },

            removeImageFromSmartLayoutItem: (
                presentationId: string,
                slideId: string,
                layoutId: string,
                elementId: string,
                itemId: string
            ) => {
                const presentation = get().getPresentation(presentationId);
                if (!presentation) return;
                get().updatePresentation(presentationId, {
                    slides: presentation.slides.map(slide => {
                        if (slide.id === slideId) {
                            return {
                                ...slide,
                                layouts: slide.layouts.map(layout => {
                                    if (layout.id === layoutId) {
                                        return {
                                            ...layout,
                                            elements: layout.elements.map(element => {
                                                if (element.id === elementId && 'items' in element) {
                                                    const updatedItems = (element as SmartLayoutElement).items.map(
                                                        item => (item.id === itemId ? { ...item, imageUrl: '' } : item)
                                                    );

                                                    return { ...element, items: updatedItems } as SmartLayoutElement;
                                                }
                                                return element;
                                            }),
                                        };
                                    }
                                    return layout;
                                }),
                            };
                        }
                        return slide;
                    }),
                });
            },

            addSmartLayoutItem: (
                presentationId: string,
                slideId: string,
                layoutId: string,
                elementId: string,
                itemId: string,
                position: 'left' | 'right'
            ) => {
                const presentation = get().getPresentation(presentationId);
                if (!presentation) return;
                get().updatePresentation(presentationId, {
                    slides: presentation.slides.map(slide => {
                        if (slide.id === slideId) {
                            return {
                                ...slide,
                                layouts: slide.layouts.map(layout => {
                                    if (layout.id === layoutId) {
                                        const element = layout.elements.find(element => element.id === elementId);

                                        if (!element) return layout;

                                        const itemIndex = (element as SmartLayoutElement).items.findIndex(
                                            item => item.id === itemId
                                        );
                                        const updatedItems = [...(element as SmartLayoutElement).items];
                                        updatedItems.splice(position === 'left' ? itemIndex : itemIndex + 1, 0, {
                                            id: generateId(),
                                            imageUrl: '',
                                            title: '',
                                            text: '',
                                        });
                                        return {
                                            ...layout,
                                            elements: layout.elements.map(element =>
                                                element.id === elementId ? { ...element, items: updatedItems } : element
                                            ),
                                        };
                                    }
                                    return layout;
                                }),
                            };
                        }
                        return slide;
                    }),
                });
            },

            duplicateSmartLayoutItem: (
                presentationId: string,
                slideId: string,
                layoutId: string,
                elementId: string,
                itemId: string
            ) => {
                const presentation = get().getPresentation(presentationId);
                if (!presentation) return;
                get().updatePresentation(presentationId, {
                    slides: presentation.slides.map(slide => {
                        if (slide.id === slideId) {
                            return {
                                ...slide,
                                layouts: slide.layouts.map(layout => {
                                    if (layout.id === layoutId) {
                                        const element = layout.elements.find(
                                            element => element.id === elementId
                                        ) as SmartLayoutElement;

                                        const updatedItems = [...element.items];
                                        const sourceItemIndex = updatedItems.findIndex(item => item.id === itemId);
                                        if (sourceItemIndex === -1) return layout;
                                        const sourceItem = updatedItems[sourceItemIndex];
                                        updatedItems.splice(sourceItemIndex + 1, 0, {
                                            ...sourceItem,
                                            id: generateId(),
                                        });

                                        return {
                                            ...layout,
                                            elements: layout.elements.map(element =>
                                                element.id === elementId ? { ...element, items: updatedItems } : element
                                            ),
                                        };
                                    }
                                    return layout;
                                }),
                            };
                        }

                        return slide;
                    }),
                });
            },
            setFullState: (state: { presentations: IPresentation[] }) => {
                if (state && Array.isArray(state.presentations)) {
                    const presentationsClone = cloneDeep(state.presentations);
                    const snapshots = { ...get().lastSavedSnapshots };

                    presentationsClone.forEach(presentation => {
                        if (!snapshots[presentation.id]) {
                            snapshots[presentation.id] = cloneDeep(presentation);
                        }
                    });

                    set({
                        presentations: presentationsClone,
                        lastSavedSnapshots: snapshots,
                    });
                }
            },

            setTheme: (presentationId, themeId) => {
                const beforeState = { ...get() };

                let updatedState;

                set(state => {
                    updatedState = {
                        presentations: state.presentations.map(presentation =>
                            presentation.id === presentationId
                                ? { ...presentation, themeId, updatedAt: Date.now(), backgroundSettings: undefined }
                                : presentation
                        ),
                        currentPresentationMeta: {
                            ...state.currentPresentationMeta!,
                            themeId,
                        },
                    };

                    return updatedState;
                });

                get().recordAction({
                    type: 'presentation',
                    description: 'Change theme',
                    presentationId,
                    before: { presentations: beforeState.presentations },
                    after: updatedState,
                });

                // Save changes automatically
                get().saveChanges(presentationId);
            },

            getSlideIndex: (presentationId, slideId) => {
                const presentation = get().getPresentation(presentationId);
                if (!presentation) return -1;
                return presentation.slides.findIndex(slide => slide.id === slideId);
            },

            setSlideLayouts: (presentationId: string, slideId: string, layouts: Layout[], title?: string) => {
                const presentation = get().getPresentation(presentationId);
                if (!presentation) return;

                get().updatePresentation(presentationId, {
                    slides: presentation.slides.map(slide =>
                        slide.id === slideId ? { ...slide, layouts, title } : slide
                    ),
                });
            },
            // Temporary state for resize operations
            resizeState: {
                isResizing: false,
                layoutId: null,
                columnWidths: null,
                originalColumnWidths: null,
            },

            // Resize state actions
            startResize: (layoutId: string, columnWidths: string[]) => {
                set({
                    resizeState: {
                        isResizing: true,
                        layoutId,
                        columnWidths: [...columnWidths],
                        originalColumnWidths: [...columnWidths],
                    },
                });
            },

            updateTempColumnWidths: (columnWidths: string[]) => {
                set(state => ({
                    resizeState: {
                        ...state.resizeState,
                        columnWidths: [...columnWidths],
                    },
                }));
            },

            endResize: (presentationId: string, slideId: string, layoutId: string) => {
                const { columnWidths, isResizing, layoutId: currentLayoutId } = get().resizeState;

                if (isResizing && columnWidths && currentLayoutId === layoutId) {
                    const beforeState = { ...get() };

                    set(state => {
                        const updatedState = {
                            presentations: state.presentations.map(presentation => {
                                if (presentation.id !== presentationId) return presentation;

                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id !== slideId) return slide;

                                        return {
                                            ...slide,
                                            layouts: slide.layouts.map(layout => {
                                                if (layout.id !== layoutId) return layout;

                                                return {
                                                    ...layout,
                                                    gridStructure: {
                                                        ...layout.gridStructure,
                                                        columnWidths: [...columnWidths],
                                                    },
                                                };
                                            }),
                                        };
                                    }),
                                };
                            }),
                            resizeState: {
                                isResizing: false,
                                layoutId: null,
                                columnWidths: null,
                                originalColumnWidths: null,
                            },
                        };

                        get().recordAction({
                            type: 'layout',
                            description: 'Resize columns',
                            presentationId,
                            slideId,
                            layoutId,
                            before: { presentations: beforeState.presentations },
                            after: { presentations: updatedState.presentations },
                        });

                        return updatedState;
                    });

                    // Save changes automatically
                    get().saveChanges(presentationId);
                } else {
                    // Reset resize state if conditions not met
                    set({
                        resizeState: {
                            isResizing: false,
                            layoutId: null,
                            columnWidths: null,
                            originalColumnWidths: null,
                        },
                    });
                }
            },

            cancelResize: () => {
                set({
                    resizeState: {
                        isResizing: false,
                        layoutId: null,
                        columnWidths: null,
                        originalColumnWidths: null,
                    },
                });
            },

            addTextEditorElement: (
                presentationId: string,
                slideId: string,
                layoutId: string,
                cellId: string,
                insertAtStart: boolean = false
            ) => {
                const layout = get().getLayout(presentationId, slideId, layoutId);
                if (!layout) return '';

                const beforeState = { ...get() };

                const newElement: EditorElement = {
                    ...getNewEditorElement(),
                    cellId,
                };
                const elementsInCell = layout.elements.filter(e => e.cellId === cellId);
                const insertIndex = insertAtStart ? 0 : elementsInCell.length;

                const updatedElements = [...layout.elements];
                updatedElements.splice(insertIndex, 0, newElement);

                let updatedState: { presentations: IPresentation[] } = { presentations: [] };

                set(state => {
                    updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: slide.layouts.map(layout => {
                                                    if (layout.id === layoutId) {
                                                        return {
                                                            ...layout,
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

                    return updatedState;
                });

                get().recordAction({
                    type: 'element',
                    description: 'Add text editor element',
                    presentationId,
                    slideId,
                    layoutId,
                    elementId: newElement.id,
                    before: { presentations: beforeState.presentations },
                    after: updatedState,
                });

                get().saveChanges(presentationId);

                // Return the new element ID so it can be focused
                return newElement.id;
            },

            updateSlideContent: (
                presentationId: string,
                slideId: string,
                content: GeneratedContent[],
                tiptapRefs: MutableRefObject<TipTapRefs>
            ) => {
                const beforeState = { ...get() };

                console.log('updateSlideContent', presentationId, slideId, content);
                const updateElementsData: any = {};

                const slide = get().getSlide(presentationId, slideId);
                if (!slide) return;

                content.forEach(item => {
                    if (!updateElementsData[item.elementId]) {
                        updateElementsData[item.elementId] = [];
                    }
                    updateElementsData[item.elementId].push(item);
                });

                const updatedLayouts = slide.layouts.map(layout => {
                    return {
                        ...layout,
                        elements: layout.elements.map(element => {
                            if (updateElementsData[element.id]) {
                                const updatedElement = fillSlots({
                                    element: element as Element,
                                    content: updateElementsData[element.id],
                                    tiptapRefs: tiptapRefs,
                                });
                                return updatedElement;
                            }
                            return element;
                        }),
                    };
                });

                console.log('updatedLayouts', updatedLayouts);

                set(state => {
                    const updatedState = {
                        presentations: state.presentations.map(presentation => {
                            if (presentation.id === presentationId) {
                                return {
                                    ...presentation,
                                    slides: presentation.slides.map(slide => {
                                        if (slide.id === slideId) {
                                            return {
                                                ...slide,
                                                layouts: updatedLayouts,
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
                        type: 'slide',
                        description: 'Add new slide',
                        presentationId,
                        slideId: slide.id,
                        before: { presentations: beforeState.presentations },
                        after: updatedState,
                    });

                    return updatedState;
                });

                // Add auto-save after completing the operation
                get().saveChanges(presentationId);
                console.log('slide after', slide);

                // set(state => {
                //     const updatedState = {
                //         presentations: state.presentations.map(presentation => {
                //             if (presentation.id === presentationId) {
                //                 return {
                //                     ...presentation,
                //                     slides: presentation.slides.map(slide => {
                //                         if (slide.id === slideId) {
                //                             return {
                //                                 ...slide,
                //                                 layouts: slide.layouts.map(layout => {
                //                                     if (layout.id === layoutId) {
                //                                         return {
                //                                             ...layout,
                //                                             elements: layout.elements.map(element => {
                //                                                 if (element.id === elementId) {
                //                                                     return {
                //                                                         ...element,
                //                                                         content: content,
                //                                                     };
                //                                                 }
                //                                                 return element;
                //                                             }),
                //                                         };
                //                                     }
                //                                     return layout;
                //                                 }),
                //                             };
                //                         }
                //                         return slide;
                //                     }),
                //                 };
                //             }
                //             return presentation;
                //         }),
                //     };

                //     return updatedState;
                // });
            },

            clearCurrentPresentationMeta: () => {
                set({ currentPresentationMeta: null, currentPresentationTitle: 'Новая презентация' });
            },
        }),
        {
            name: 'presentation-store',
            enabled: true,
        }
    )
);

export const selectCellElementIds =
    (presentationId: string, slideId: string, layoutId: string, cellId: string) => (state: PresentationState) =>
        state.getCellElementIds(presentationId, slideId, layoutId, cellId);
