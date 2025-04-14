import { Extension } from '@tiptap/core';
import { usePresentationStore } from '@/store/presentationStore';
import { Editor } from '@tiptap/react';
import { TipTapRefs } from '@/types';
import { RefObject } from 'react';

export interface EditorWithMethods {
    editor: Editor;
    focus: () => void;
    getText: () => string;
    isEmpty: boolean;
}

export const ArrowNavigationExtension = (
    presentationId: string,
    slideId: string,
    layoutId: string,
    elementId: string,
    tiptapRefs: RefObject<TipTapRefs>
) => {
    return Extension.create({
        name: 'arrowNavigation',

        addKeyboardShortcuts() {
            return {
                'ArrowRight': ({ editor }) => {
                    const { selection } = editor.state;
                    const docLength = editor.state.doc.content.size;

                    // Check if cursor is at the end of the document
                    if (selection.$anchor.pos >= docLength - 1) {
                        // Find the next editor element in the same layout or in the next layout
                        const targetInfo = findNextEditor(
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            'right'
                        );

                        if (targetInfo) {
                            const { targetElementId, targetType, targetSlideId } = targetInfo;
                            console.log(`Navigating right to: ${targetElementId} (${targetType}) in slide ${targetSlideId}`);

                            // Check if we're moving to a different slide
                            const isCrossingSlides = targetSlideId !== slideId;

                            if (targetType === 'editor') {
                                // Focus the target editor
                                setTimeout(() => {
                                    const targetEditor = tiptapRefs.current?.editors[targetElementId];
                                    if (targetEditor) {
                                        console.log(`Focusing editor: ${targetElementId}`);
                                        // Focus at the beginning of the content (position 1)
                                        targetEditor.editor.commands.focus('start');
                                        // targetEditor.focus();
                                    } else {
                                        console.warn(`Editor not found in refs: ${targetElementId}`);
                                        // If the editor ref isn't available yet (due to slide change),
                                        // we can try to find it in the DOM and focus it
                                        const editorElement = document.querySelector(`[data-element-id="${targetElementId}"]`);
                                        if (editorElement) {
                                            console.log(`Found editor in DOM: ${targetElementId}`);
                                            (editorElement as HTMLElement).click();
                                        }
                                    }
                                }, isCrossingSlides ? 100 : 10); // Wait longer for slide changes
                            } else {
                                // Wait a bit longer for slide changes before focusing non-editor elements
                                setTimeout(() => {
                                    // Find and focus the element by its ID
                                    const element = document.querySelector(`[data-element-id="${targetElementId}"]`);
                                    if (element) {
                                        console.log(`Focusing non-editor element: ${targetElementId}`);
                                        // Add a focus visual indicator class
                                        element.classList.add('element-focus');
                                        // Set focus on the element for keyboard navigation
                                        (element as HTMLElement).tabIndex = 0;
                                        (element as HTMLElement).focus();

                                        // Remove the focus class after animation completes
                                        setTimeout(() => {
                                            element.classList.remove('element-focus');
                                        }, 1000);
                                    } else {
                                        console.warn(`Element not found in DOM: ${targetElementId}`);
                                    }
                                }, isCrossingSlides ? 100 : 10); // Wait longer for slide changes
                            }

                            if (isCrossingSlides) {
                                // Try to find and click the slide in the slidesList
                                setTimeout(() => {
                                    const slideElement = document.querySelector(`[data-slide-id="${targetSlideId}"]`);
                                    if (slideElement && slideElement.parentElement) {
                                        console.log(`Clicking slide in list: ${targetSlideId}`);
                                        (slideElement.parentElement as HTMLElement).click();
                                    }
                                }, 0);
                            }

                            return true;
                        }
                    }

                    return false;
                },

                'ArrowLeft': ({ editor }) => {
                    const { selection } = editor.state;

                    // Check if cursor is at the beginning of the document
                    if (selection.$anchor.pos === 1) {
                        // Find the previous editor element
                        const targetInfo = findNextEditor(
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            'left'
                        );

                        if (targetInfo) {
                            const { targetElementId, targetType, targetSlideId } = targetInfo;
                            console.log(`Navigating left to: ${targetElementId} (${targetType}) in slide ${targetSlideId}`);

                            // Check if we're moving to a different slide
                            const isCrossingSlides = targetSlideId !== slideId;

                            if (targetType === 'editor') {
                                // Focus the target editor
                                setTimeout(() => {
                                    const targetEditor = tiptapRefs.current?.editors[targetElementId];
                                    if (targetEditor) {
                                        console.log(`Focusing editor: ${targetElementId}`);
                                        // Focus at the end of the content
                                        targetEditor.editor.commands.focus('end');
                                        // targetEditor.focus();
                                    } else {
                                        console.warn(`Editor not found in refs: ${targetElementId}`);
                                        // If the editor ref isn't available yet (due to slide change),
                                        // we can try to find it in the DOM and focus it
                                        const editorElement = document.querySelector(`[data-element-id="${targetElementId}"]`);
                                        if (editorElement) {
                                            console.log(`Found editor in DOM: ${targetElementId}`);
                                            (editorElement as HTMLElement).click();
                                        }
                                    }
                                }, isCrossingSlides ? 100 : 10); // Wait longer for slide changes
                            } else {
                                // Wait a bit longer for slide changes before focusing non-editor elements
                                setTimeout(() => {
                                    // Find and focus the element by its ID
                                    const element = document.querySelector(`[data-element-id="${targetElementId}"]`);
                                    if (element) {
                                        console.log(`Focusing non-editor element: ${targetElementId}`);
                                        // Add a focus visual indicator class
                                        element.classList.add('element-focus');
                                        // Set focus on the element for keyboard navigation
                                        (element as HTMLElement).tabIndex = 0;
                                        (element as HTMLElement).focus();

                                        // Remove the focus class after animation completes
                                        setTimeout(() => {
                                            element.classList.remove('element-focus');
                                        }, 1000);
                                    } else {
                                        console.warn(`Element not found in DOM: ${targetElementId}`);
                                    }
                                }, isCrossingSlides ? 100 : 10); // Wait longer for slide changes
                            }

                            if (isCrossingSlides) {
                                // Try to find and click the slide in the slidesList
                                setTimeout(() => {
                                    const slideElement = document.querySelector(`[data-slide-id="${targetSlideId}"]`);
                                    if (slideElement && slideElement.parentElement) {
                                        console.log(`Clicking slide in list: ${targetSlideId}`);
                                        (slideElement.parentElement as HTMLElement).click();
                                    }
                                }, 0);
                            }

                            return true;
                        }
                    }

                    return false;
                },

                'ArrowDown': ({ editor }) => {
                    const { selection } = editor.state;
                    const position = selection.$anchor.pos;
                    const docLength = editor.state.doc.content.size;

                    // Check if cursor is on the last line (approximation)
                    // We're assuming if the user presses down and there's no line below, they want to navigate down
                    const text = editor.getText();
                    const lastLineStart = text.lastIndexOf('\n') + 1;

                    if (position >= lastLineStart || position >= docLength - 1) {
                        // Find the editor element below this one
                        const targetInfo = findNextEditor(
                            presentationId,
                            slideId,
                            layoutId,
                            elementId,
                            'down'
                        );

                        if (targetInfo) {
                            const { targetElementId, targetType, targetSlideId } = targetInfo;
                            console.log(`Navigating down to: ${targetElementId} (${targetType}) in slide ${targetSlideId}`);

                            // Check if we're moving to a different slide
                            const isCrossingSlides = targetSlideId !== slideId;

                            if (targetType === 'editor') {
                                // Focus the target editor
                                setTimeout(() => {
                                    const targetEditor = tiptapRefs.current?.editors[targetElementId];
                                    if (targetEditor) {
                                        console.log(`Focusing editor: ${targetElementId}`);
                                        // Try to maintain the same horizontal position when moving down
                                        // For simplicity, we'll focus at the start
                                        targetEditor.editor.commands.focus();
                                        // targetEditor.focus();
                                    } else {
                                        console.warn(`Editor not found in refs: ${targetElementId}`);
                                        // If the editor ref isn't available yet (due to slide change),
                                        // we can try to find it in the DOM and focus it
                                        const editorElement = document.querySelector(`[data-element-id="${targetElementId}"]`);
                                        if (editorElement) {
                                            console.log(`Found editor in DOM: ${targetElementId}`);
                                            (editorElement as HTMLElement).click();
                                        }
                                    }
                                }, isCrossingSlides ? 100 : 10); // Wait longer for slide changes
                            } else {
                                // Wait a bit longer for slide changes before focusing non-editor elements
                                setTimeout(() => {
                                    // Find and focus the element by its ID
                                    const element = document.querySelector(`[data-element-id="${targetElementId}"]`);
                                    if (element) {
                                        console.log(`Focusing non-editor element: ${targetElementId}`);
                                        // Add a focus visual indicator class
                                        element.classList.add('element-focus');
                                        // Set focus on the element for keyboard navigation
                                        (element as HTMLElement).tabIndex = 0;
                                        (element as HTMLElement).focus();

                                        // Remove the focus class after animation completes
                                        setTimeout(() => {
                                            element.classList.remove('element-focus');
                                        }, 1000);
                                    } else {
                                        console.warn(`Element not found in DOM: ${targetElementId}`);
                                    }
                                }, isCrossingSlides ? 100 : 10); // Wait longer for slide changes
                            }

                            if (isCrossingSlides) {
                                // Try to find and click the slide in the slidesList
                                setTimeout(() => {
                                    const slideElement = document.querySelector(`[data-slide-id="${targetSlideId}"]`);
                                    if (slideElement && slideElement.parentElement) {
                                        console.log(`Clicking slide in list: ${targetSlideId}`);
                                        (slideElement.parentElement as HTMLElement).click();
                                    }
                                }, 0);
                            }

                            return true;
                        }
                    }

                    return false;
                },

                'ArrowUp': ({ editor }) => {
                    const { selection } = editor.state;
                    const position = selection.$anchor.pos;

                    // Check if cursor is on the first line (approximation)
                    const text = editor.getText();
                    const firstLineEnd = text.indexOf('\n') !== -1 ? text.indexOf('\n') : text.length;

                    // if (position <= firstLineEnd) {
                    // Find the editor element above this one
                    const targetInfo = findNextEditor(
                        presentationId,
                        slideId,
                        layoutId,
                        elementId,
                        'up'
                    );

                    if (targetInfo) {
                        const { targetElementId, targetType, targetSlideId } = targetInfo;
                        console.log(`Navigating up to: ${targetElementId} (${targetType}) in slide ${targetSlideId}`);

                        // Check if we're moving to a different slide
                        const isCrossingSlides = targetSlideId !== slideId;

                        if (targetType === 'editor') {
                            // Focus the target editor
                            setTimeout(() => {
                                const targetEditor = tiptapRefs.current?.editors[targetElementId];
                                if (targetEditor) {
                                    console.log(`Focusing editor: ${targetElementId}`);
                                    // When navigating up, move cursor to the end of the previous editor's content
                                    targetEditor.editor.commands.focus('end');
                                    // targetEditor.focus();
                                } else {
                                    console.warn(`Editor not found in refs: ${targetElementId}`);
                                    // If the editor ref isn't available yet (due to slide change),
                                    // we can try to find it in the DOM and focus it
                                    const editorElement = document.querySelector(`[data-element-id="${targetElementId}"]`);
                                    if (editorElement) {
                                        console.log(`Found editor in DOM: ${targetElementId}`);
                                        (editorElement as HTMLElement).click();
                                    }
                                }
                            }, isCrossingSlides ? 100 : 10); // Wait longer for slide changes
                        } else {
                            // Wait a bit longer for slide changes before focusing non-editor elements
                            setTimeout(() => {
                                // Find and focus the element by its ID
                                const element = document.querySelector(`[data-element-id="${targetElementId}"]`);
                                if (element) {
                                    console.log(`Focusing non-editor element: ${targetElementId}`);
                                    // Add a focus visual indicator class
                                    element.classList.add('element-focus');
                                    // Set focus on the element for keyboard navigation
                                    (element as HTMLElement).tabIndex = 0;
                                    (element as HTMLElement).focus();

                                    // Remove the focus class after animation completes
                                    setTimeout(() => {
                                        element.classList.remove('element-focus');
                                    }, 1000);
                                } else {
                                    console.warn(`Element not found in DOM: ${targetElementId}`);
                                }
                            }, isCrossingSlides ? 100 : 10); // Wait longer for slide changes
                        }

                        if (isCrossingSlides) {
                            // Try to find and click the slide in the slidesList
                            setTimeout(() => {
                                const slideElement = document.querySelector(`[data-slide-id="${targetSlideId}"]`);
                                if (slideElement && slideElement.parentElement) {
                                    console.log(`Clicking slide in list: ${targetSlideId}`);
                                    (slideElement.parentElement as HTMLElement).click();
                                }
                            }, 0);
                        }

                        return true;
                    }
                    // }

                    return false;
                },
            };
        },
    });
};

// Helper function to find the next editor element based on direction
function findNextEditor(
    presentationId: string,
    slideId: string,
    layoutId: string,
    elementId: string,
    direction: 'left' | 'right' | 'up' | 'down'
): { targetElementId: string; targetLayoutId: string; targetCellId: string; targetSlideId: string; targetType: 'editor' | 'video' | 'other' } | null {
    const store = usePresentationStore.getState();
    const presentation = store.getPresentation(presentationId);

    if (!presentation) return null;

    // Find current slide
    const currentSlide = presentation.slides.find(slide => slide.id === slideId);
    if (!currentSlide) return null;

    // Find current layout
    const currentLayout = currentSlide.layouts.find(layout => layout.id === layoutId);
    if (!currentLayout) return null;

    // Find current element
    const currentElement = currentLayout.elements.find(element => element.id === elementId);
    if (!currentElement) return null;

    // Find current cell
    const currentCell = currentLayout.gridStructure.rows[0].cells.find(cell =>
        cell.id === currentElement.cellId
    );
    if (!currentCell) return null;

    // Helper function to determine element type
    const getElementType = (element: any): 'editor' | 'video' | 'other' => {
        if (!element) return 'other';

        switch (element.elementTypeId) {
            case 'editor':
            case 'text':
            case 'heading':
            case 'paragraph':
                return 'editor';
            case 'video':
                return 'video';
            default:
                return 'other';
        }
    };

    // Handle different directions
    if (direction === 'right') {
        // Check if there's an element to the right in the same cell
        const elementsInCell = currentLayout.elements.filter(el => el.cellId === currentElement.cellId);
        const currentElementIndex = elementsInCell.findIndex(el => el.id === elementId);

        if (currentElementIndex < elementsInCell.length - 1) {
            // There's an element to the right in the same cell
            const nextElement = elementsInCell[currentElementIndex + 1];
            return {
                targetElementId: nextElement.id,
                targetLayoutId: layoutId,
                targetCellId: currentElement.cellId,
                targetSlideId: slideId,
                targetType: getElementType(nextElement)
            };
        }

        // Check if there's a cell to the right
        if (currentLayout.gridStructure.rows[0].cells.length > 1) {
            const currentCellIndex = currentLayout.gridStructure.rows[0].cells.findIndex(cell =>
                cell.id === currentElement.cellId
            );

            if (currentCellIndex < currentLayout.gridStructure.rows[0].cells.length - 1) {
                // There's a cell to the right
                const nextCell = currentLayout.gridStructure.rows[0].cells[currentCellIndex + 1];
                const elementsInNextCell = currentLayout.elements.filter(el => el.cellId === nextCell.id);

                if (elementsInNextCell.length > 0) {
                    const firstElementInNextCell = elementsInNextCell[0];
                    return {
                        targetElementId: firstElementInNextCell.id,
                        targetLayoutId: layoutId,
                        targetCellId: nextCell.id,
                        targetSlideId: slideId,
                        targetType: getElementType(firstElementInNextCell)
                    };
                }
            }
        }

        // Check the next layout in the current slide
        const currentLayoutIndex = currentSlide.layouts.findIndex(layout => layout.id === layoutId);

        if (currentLayoutIndex < currentSlide.layouts.length - 1) {
            // There's a layout below
            const nextLayout = currentSlide.layouts[currentLayoutIndex + 1];
            const firstCell = nextLayout.gridStructure.rows[0].cells[0];
            const elementsInFirstCell = nextLayout.elements.filter(el => el.cellId === firstCell.id);

            if (elementsInFirstCell.length > 0) {
                const firstElement = elementsInFirstCell[0];
                return {
                    targetElementId: firstElement.id,
                    targetLayoutId: nextLayout.id,
                    targetCellId: firstCell.id,
                    targetSlideId: slideId,
                    targetType: getElementType(firstElement)
                };
            }
        }

        // Check the next slide
        const currentSlideIndex = presentation.slides.findIndex(slide => slide.id === slideId);

        if (currentSlideIndex < presentation.slides.length - 1) {
            // There's a slide after this one
            const nextSlide = presentation.slides[currentSlideIndex + 1];

            if (nextSlide.layouts.length > 0) {
                const firstLayout = nextSlide.layouts[0];
                const firstCell = firstLayout.gridStructure.rows[0].cells[0];
                const elementsInFirstCell = firstLayout.elements.filter(el => el.cellId === firstCell.id);

                if (elementsInFirstCell.length > 0) {
                    const firstElement = elementsInFirstCell[0];
                    return {
                        targetElementId: firstElement.id,
                        targetLayoutId: firstLayout.id,
                        targetCellId: firstCell.id,
                        targetSlideId: nextSlide.id,
                        targetType: getElementType(firstElement)
                    };
                }
            }
        }
    } else if (direction === 'left') {
        // Check if there's an element to the left in the same cell
        const elementsInCell = currentLayout.elements.filter(el => el.cellId === currentElement.cellId);
        const currentElementIndex = elementsInCell.findIndex(el => el.id === elementId);

        if (currentElementIndex > 0) {
            // There's an element to the left in the same cell
            const prevElement = elementsInCell[currentElementIndex - 1];
            return {
                targetElementId: prevElement.id,
                targetLayoutId: layoutId,
                targetCellId: currentElement.cellId,
                targetSlideId: slideId,
                targetType: getElementType(prevElement)
            };
        }

        // Check if there's a cell to the left
        if (currentLayout.gridStructure.rows[0].cells.length > 1) {
            const currentCellIndex = currentLayout.gridStructure.rows[0].cells.findIndex(cell =>
                cell.id === currentElement.cellId
            );

            if (currentCellIndex > 0) {
                // There's a cell to the left
                const previousCell = currentLayout.gridStructure.rows[0].cells[currentCellIndex - 1];
                const elementsInPreviousCell = currentLayout.elements.filter(el => el.cellId === previousCell.id);

                if (elementsInPreviousCell.length > 0) {
                    // Get the last element in the previous cell
                    const lastElement = elementsInPreviousCell[elementsInPreviousCell.length - 1];
                    return {
                        targetElementId: lastElement.id,
                        targetLayoutId: layoutId,
                        targetCellId: previousCell.id,
                        targetSlideId: slideId,
                        targetType: getElementType(lastElement)
                    };
                }
            }
        }

        // Check the previous layout in the current slide
        const currentLayoutIndex = currentSlide.layouts.findIndex(layout => layout.id === layoutId);

        if (currentLayoutIndex > 0) {
            // There's a layout above
            const previousLayout = currentSlide.layouts[currentLayoutIndex - 1];
            const lastRow = previousLayout.gridStructure.rows[previousLayout.gridStructure.rows.length - 1];
            const lastCell = lastRow.cells[lastRow.cells.length - 1];
            const elementsInLastCell = previousLayout.elements.filter(el => el.cellId === lastCell.id);

            if (elementsInLastCell.length > 0) {
                // Get the last element in the last cell
                const lastElement = elementsInLastCell[elementsInLastCell.length - 1];
                return {
                    targetElementId: lastElement.id,
                    targetLayoutId: previousLayout.id,
                    targetCellId: lastCell.id,
                    targetSlideId: slideId,
                    targetType: getElementType(lastElement)
                };
            }
        }

        // Check the previous slide
        const currentSlideIndex = presentation.slides.findIndex(slide => slide.id === slideId);

        if (currentSlideIndex > 0) {
            // There's a slide before this one
            const previousSlide = presentation.slides[currentSlideIndex - 1];

            if (previousSlide.layouts.length > 0) {
                const lastLayout = previousSlide.layouts[previousSlide.layouts.length - 1];
                const lastRow = lastLayout.gridStructure.rows[lastLayout.gridStructure.rows.length - 1];
                const lastCell = lastRow.cells[lastRow.cells.length - 1];
                const elementsInLastCell = lastLayout.elements.filter(el => el.cellId === lastCell.id);

                if (elementsInLastCell.length > 0) {
                    // Get the last element in the last cell
                    const lastElement = elementsInLastCell[elementsInLastCell.length - 1];
                    return {
                        targetElementId: lastElement.id,
                        targetLayoutId: lastLayout.id,
                        targetCellId: lastCell.id,
                        targetSlideId: previousSlide.id,
                        targetType: getElementType(lastElement)
                    };
                }
            }
        }
    } else if (direction === 'down') {
        // Check if there's an element below in the same cell
        const elementsInCell = currentLayout.elements.filter(el => el.cellId === currentElement.cellId);
        const currentElementIndex = elementsInCell.findIndex(el => el.id === elementId);

        if (currentElementIndex < elementsInCell.length - 1) {
            // There's an element below in the same cell
            const nextElement = elementsInCell[currentElementIndex + 1];
            return {
                targetElementId: nextElement.id,
                targetLayoutId: layoutId,
                targetCellId: currentElement.cellId,
                targetSlideId: slideId,
                targetType: getElementType(nextElement)
            };
        }

        // Check the next layout in the current slide
        const currentLayoutIndex = currentSlide.layouts.findIndex(layout => layout.id === layoutId);

        if (currentLayoutIndex < currentSlide.layouts.length - 1) {
            // There's a layout below
            const nextLayout = currentSlide.layouts[currentLayoutIndex + 1];
            const firstCell = nextLayout.gridStructure.rows[0].cells[0];
            const elementsInFirstCell = nextLayout.elements.filter(el => el.cellId === firstCell.id);

            if (elementsInFirstCell.length > 0) {
                const firstElement = elementsInFirstCell[0];
                return {
                    targetElementId: firstElement.id,
                    targetLayoutId: nextLayout.id,
                    targetCellId: firstCell.id,
                    targetSlideId: slideId,
                    targetType: getElementType(firstElement)
                };
            }
        }

        // Check the next slide
        const currentSlideIndex = presentation.slides.findIndex(slide => slide.id === slideId);

        if (currentSlideIndex < presentation.slides.length - 1) {
            // There's a slide after this one
            const nextSlide = presentation.slides[currentSlideIndex + 1];

            if (nextSlide.layouts.length > 0) {
                const firstLayout = nextSlide.layouts[0];
                const firstCell = firstLayout.gridStructure.rows[0].cells[0];
                const elementsInFirstCell = firstLayout.elements.filter(el => el.cellId === firstCell.id);

                if (elementsInFirstCell.length > 0) {
                    const firstElement = elementsInFirstCell[0];
                    return {
                        targetElementId: firstElement.id,
                        targetLayoutId: firstLayout.id,
                        targetCellId: firstCell.id,
                        targetSlideId: nextSlide.id,
                        targetType: getElementType(firstElement)
                    };
                }
            }
        }
    } else if (direction === 'up') {
        // Check if there's an element above in the same cell
        const elementsInCell = currentLayout.elements.filter(el => el.cellId === currentElement.cellId);
        const currentElementIndex = elementsInCell.findIndex(el => el.id === elementId);

        if (currentElementIndex > 0) {
            // There's an element above in the same cell
            const prevElement = elementsInCell[currentElementIndex - 1];
            return {
                targetElementId: prevElement.id,
                targetLayoutId: layoutId,
                targetCellId: currentElement.cellId,
                targetSlideId: slideId,
                targetType: getElementType(prevElement)
            };
        }

        // Check the previous layout in the current slide
        const currentLayoutIndex = currentSlide.layouts.findIndex(layout => layout.id === layoutId);

        if (currentLayoutIndex > 0) {
            // There's a layout above
            const previousLayout = currentSlide.layouts[currentLayoutIndex - 1];
            const lastRow = previousLayout.gridStructure.rows[previousLayout.gridStructure.rows.length - 1];
            const lastCell = lastRow.cells[lastRow.cells.length - 1];
            const elementsInLastCell = previousLayout.elements.filter(el => el.cellId === lastCell.id);

            if (elementsInLastCell.length > 0) {
                // Get the last element in the last cell
                const lastElement = elementsInLastCell[elementsInLastCell.length - 1];
                return {
                    targetElementId: lastElement.id,
                    targetLayoutId: previousLayout.id,
                    targetCellId: lastCell.id,
                    targetSlideId: slideId,
                    targetType: getElementType(lastElement)
                };
            }
        }

        // Check the previous slide
        const currentSlideIndex = presentation.slides.findIndex(slide => slide.id === slideId);

        if (currentSlideIndex > 0) {
            // There's a slide before this one
            const previousSlide = presentation.slides[currentSlideIndex - 1];

            if (previousSlide.layouts.length > 0) {
                const lastLayout = previousSlide.layouts[previousSlide.layouts.length - 1];
                const lastRow = lastLayout.gridStructure.rows[lastLayout.gridStructure.rows.length - 1];
                const lastCell = lastRow.cells[lastRow.cells.length - 1];
                const elementsInLastCell = lastLayout.elements.filter(el => el.cellId === lastCell.id);

                if (elementsInLastCell.length > 0) {
                    // Get the last element in the last cell
                    const lastElement = elementsInLastCell[elementsInLastCell.length - 1];
                    return {
                        targetElementId: lastElement.id,
                        targetLayoutId: lastLayout.id,
                        targetCellId: lastCell.id,
                        targetSlideId: previousSlide.id,
                        targetType: getElementType(lastElement)
                    };
                }
            }
        }
    }

    return null;
}