import { describe, it, expect, vi } from 'vitest';
import { EnterHandlerExtension } from './EnterHandlerExtension';

describe('EnterHandlerExtension', () => {
    it('should handle Enter with selection correctly', () => {
        const onEnterPressed = vi.fn();
        const onBackspacePressed = vi.fn();
        const onDeletePressed = vi.fn();
        
        const extension = EnterHandlerExtension(
            (contentBeforeCursor, contentAfterCursor, preservedStyles) => onEnterPressed(contentBeforeCursor, contentAfterCursor),
            onBackspacePressed,
            onDeletePressed,
            false
        );

        // Mock editor with selection
        const mockEditor = {
            state: {
                selection: {
                    empty: false,
                    $head: { pos: 10 },
                    $anchor: { pos: 5 }
                },
                doc: {
                    cut: vi.fn((from: number, to?: number) => ({
                        toJSON: () => ({
                            content: to ? [{ type: 'paragraph', content: [{ text: 'test' }] }] : []
                        })
                    }))
                }
            },
            chain: vi.fn(() => ({
                setMeta: vi.fn().mockReturnThis(),
                focus: vi.fn().mockReturnThis(),
                deleteRange: vi.fn().mockReturnThis(),
                run: vi.fn()
            }))
        };

        // Mock keyboard shortcut handler
        const keyboardShortcuts = extension.addKeyboardShortcuts();
        const enterHandler = keyboardShortcuts.Enter;

        // Test Enter with selection
        const result = enterHandler({ editor: mockEditor });

        expect(result).toBe(true);
        expect(mockEditor.chain).toHaveBeenCalled();
        expect(onEnterPressed).toHaveBeenCalledWith(
            { content: [{ type: 'paragraph', content: [{ text: 'test' }] }] },
            { content: [{ type: 'paragraph', content: [{ text: 'test' }] }] }
        );
    });

    it('should handle Enter without selection correctly', () => {
        const onEnterPressed = vi.fn();
        const onBackspacePressed = vi.fn();
        const onDeletePressed = vi.fn();
        
        const extension = EnterHandlerExtension(
            (contentBeforeCursor, contentAfterCursor, preservedStyles) => onEnterPressed(contentBeforeCursor, contentAfterCursor),
            onBackspacePressed,
            onDeletePressed,
            false
        );

        // Mock editor without selection
        const mockEditor = {
            state: {
                selection: {
                    empty: true,
                    $head: { pos: 5 },
                    $anchor: { pos: 5 }
                },
                doc: {
                    cut: vi.fn((from: number, to?: number) => ({
                        toJSON: () => ({
                            content: to ? [{ type: 'paragraph', content: [{ text: 'test' }] }] : []
                        })
                    }))
                }
            },
            chain: vi.fn(() => ({
                setMeta: vi.fn().mockReturnThis(),
                focus: vi.fn().mockReturnThis(),
                deleteRange: vi.fn().mockReturnThis(),
                run: vi.fn()
            }))
        };

        // Mock keyboard shortcut handler
        const keyboardShortcuts = extension.addKeyboardShortcuts();
        const enterHandler = keyboardShortcuts.Enter;

        // Test Enter without selection
        const result = enterHandler({ editor: mockEditor });

        expect(result).toBe(true);
        expect(mockEditor.chain).not.toHaveBeenCalled(); // No deletion needed
        expect(onEnterPressed).toHaveBeenCalledWith(
            undefined,
            { content: [{ type: 'paragraph', content: [{ text: 'test' }] }] }
        );
    });

    it('should handle Enter at end of line correctly', () => {
        const onEnterPressed = vi.fn();
        const onBackspacePressed = vi.fn();
        const onDeletePressed = vi.fn();
        
        const extension = EnterHandlerExtension(
            (contentBeforeCursor, contentAfterCursor, preservedStyles) => onEnterPressed(contentBeforeCursor, contentAfterCursor),
            onBackspacePressed,
            onDeletePressed,
            false
        );

        // Mock editor at end of line
        const mockEditor = {
            state: {
                selection: {
                    empty: true,
                    $head: { pos: 10 },
                    $anchor: { pos: 10 }
                },
                doc: {
                    cut: vi.fn((from: number, to?: number) => ({
                        toJSON: () => ({
                            content: []
                        })
                    }))
                }
            },
            chain: vi.fn(() => ({
                setMeta: vi.fn().mockReturnThis(),
                focus: vi.fn().mockReturnThis(),
                deleteRange: vi.fn().mockReturnThis(),
                run: vi.fn()
            }))
        };

        // Mock keyboard shortcut handler
        const keyboardShortcuts = extension.addKeyboardShortcuts();
        const enterHandler = keyboardShortcuts.Enter;

        // Test Enter at end of line
        const result = enterHandler({ editor: mockEditor });

        expect(result).toBe(true);
        expect(mockEditor.chain).not.toHaveBeenCalled(); // No deletion needed
        expect(onEnterPressed).toHaveBeenCalledWith(); // No content to pass
    });
}); 