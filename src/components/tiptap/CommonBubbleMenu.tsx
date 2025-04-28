import { BubbleMenu, Editor } from '@tiptap/react';
import { ColorPicker } from './ColorPicker';
import { LinkEditor } from './LinkEditor';
import styles from './BubbleMenu.module.css';
import {
    BiBold,
    BiItalic,
    BiUnderline,
    BiStrikethrough,
    BiListOl,
    BiListUl,
    BiCheckSquare,
    BiAlignLeft,
    BiAlignMiddle,
    BiAlignRight,
    BiAlignJustify,
    BiX,
} from 'react-icons/bi';
import { useState, useRef, useEffect, useCallback } from 'react';
import { EditorView } from '@tiptap/pm/view';
import { EditorState } from '@tiptap/pm/state';
import HeadingSelector from '../settings/HeadingSelector/HeadingSelector';
import {
    HEADING_LEVELS,
    NORMAL_TEXT_LEVEL,
    SMALL_TEXT_LEVEL,
    BIG_TEXT_LEVEL,
    VERY_BIG_HEADING_LEVEL,
    BIG_HEADING_LEVEL,
    TITLE_LEVEL,
    FONT_SIZE_SMALL_TEXT,
    FONT_SIZE_BIG_TEXT,
    FONT_SIZE_TITLE,
    FONT_SIZE_BIG_HEADING,
    FONT_SIZE_VERY_BIG_HEADING,
    FONT_SIZE_HEADING_1,
    FONT_SIZE_HEADING_2,
    FONT_SIZE_HEADING_3,
    FONT_SIZE_HEADING_4,
    HEADING_1_LEVEL,
    HEADING_2_LEVEL,
    HEADING_3_LEVEL,
    HEADING_4_LEVEL,
} from '@/consts';

export default function CommonBubbleMenu({ editor }: { editor: Editor }) {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);

    // const isOpen = useMenuIsOpen();

    // Определение текущего уровня заголовка или размера текста
    const getCurrentHeadingLevel = useCallback(() => {
        // Определяем текстовые стили для проверки fontSize
        const marks = editor.getAttributes('textStyle');

        // Heading detection is no longer used since we're using the custom font size extension
        // instead of the built-in heading extension

        if (editor.isActive('paragraph')) {
            // Always check fontSize regardless of node type
            if (marks.fontSize) {
                switch (marks.fontSize) {
                    case FONT_SIZE_SMALL_TEXT:
                        return SMALL_TEXT_LEVEL;
                    case FONT_SIZE_BIG_TEXT:
                        return BIG_TEXT_LEVEL;
                    case FONT_SIZE_HEADING_4:
                        return HEADING_4_LEVEL;
                    case FONT_SIZE_HEADING_3:
                        return HEADING_3_LEVEL;
                    case FONT_SIZE_HEADING_2:
                        return HEADING_2_LEVEL;
                    case FONT_SIZE_HEADING_1:
                        return HEADING_1_LEVEL;
                    case FONT_SIZE_TITLE:
                        return TITLE_LEVEL;
                    case FONT_SIZE_BIG_HEADING:
                        return BIG_HEADING_LEVEL;
                    case FONT_SIZE_VERY_BIG_HEADING:
                        return VERY_BIG_HEADING_LEVEL;
                    default:
                        return NORMAL_TEXT_LEVEL;
                }
            }
        }

        return NORMAL_TEXT_LEVEL; // Default to normal text
    }, [editor]);

    // Закрытие выпадающего меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headingMenuRef.current && !headingMenuRef.current.contains(event.target as Node) && isHeadingMenuOpen) {
                setIsHeadingMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isHeadingMenuOpen]);

    const handleHeadingChange = useCallback(
        (level: number) => {
            editor
                .chain()
                .focus()
                // .setParagraph() // Сначала устанавливаем параграф, чтобы сбросить любой заголовок
                .setFontSize(level)
                .run();
            setIsHeadingMenuOpen(false);
        },
        [editor]
    );

    const handleAlignment = useCallback(
        (align: 'left' | 'center' | 'right' | 'justify') => {
            editor.chain().focus().setTextAlign(align).run();
        },
        [editor]
    );

    const handleClearStyles = useCallback(() => {
        editor.chain().focus().clearNodes().unsetAllMarks().run();
    }, [editor]);

    // Force light theme styles for bubble menu
    const lightThemeStyle = {
        backgroundColor: 'white',
        color: '#333',
        borderColor: '#e0e0e0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    };

    const shouldShow = useCallback(
        ({
            editor: _editor,
            view,
            state: _state,
            oldState: _oldState,
            from,
            to,
        }: {
            editor: Editor;
            view: EditorView;
            state: EditorState;
            oldState?: EditorState | null;
            from: number;
            to: number;
        }) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            if (from !== to && view.focused) {
                return true;
            }

            return false;
        },
        []
    );

    const handleColorChange = useCallback(
        (color: string) => {
            editor.commands.setColor(color);
        },
        [editor]
    );

    return (
        <BubbleMenu
            editor={editor}
            tippyOptions={{
                appendTo: window.document.body,
                placement: 'top-start',
                showOnCreate: true,
                interactive: true,
                theme: 'light',
                maxWidth: '100%',
                delay: [0, 0],
                duration: [100, 0],
                popperOptions: {
                    modifiers: [
                        {
                            name: 'flip',
                            options: {
                                fallbackPlacements: ['top-end', 'bottom-start'],
                            },
                        },
                        {
                            name: 'preventOverflow',
                            options: {
                                padding: 8,
                            },
                        },
                    ],
                },
            }}
            updateDelay={50}
            shouldShow={shouldShow}
            data-type="common-bubble-menu"
        >
            <div className={`${styles.bubbleMenu} light-theme-only`} style={lightThemeStyle}>
                <HeadingSelector
                    headingMenuRef={headingMenuRef}
                    isHeadingMenuOpen={isHeadingMenuOpen}
                    setIsHeadingMenuOpen={setIsHeadingMenuOpen}
                    getCurrentHeadingLevel={getCurrentHeadingLevel}
                    handleHeadingChange={handleHeadingChange}
                    headingLevels={HEADING_LEVELS}
                />

                <ColorPicker onColorChange={handleColorChange} className={styles.button} />

                <button
                    onClick={() => {
                        editor.chain().focus().toggleBold().run();
                    }}
                    className={`${styles.button} ${editor.isActive('bold') ? styles.active : ''}`}
                    aria-label="Жирный"
                >
                    <BiBold size={16} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`${styles.button} ${editor.isActive('italic') ? styles.active : ''}`}
                    aria-label="Курсив"
                >
                    <BiItalic size={16} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`${styles.button} ${editor.isActive('underline') ? styles.active : ''}`}
                    aria-label="Подчеркнутый"
                >
                    <BiUnderline size={16} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`${styles.button} ${editor.isActive('strike') ? styles.active : ''}`}
                    aria-label="Зачеркнутый"
                >
                    <BiStrikethrough size={16} />
                </button>

                {/* <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`${styles.button} ${editor.isActive('code') ? styles.active : ''}`}
                    aria-label="Код"
                >
                    <BiCode size={16} />
                </button> */}

                <LinkEditor editor={editor} className={styles.button} />

                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`${styles.button} ${editor.isActive('orderedList') ? styles.active : ''}`}
                    aria-label="Нумерованный список"
                >
                    <BiListOl size={16} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`${styles.button} ${editor.isActive('bulletList') ? styles.active : ''}`}
                    aria-label="Маркированный список"
                >
                    <BiListUl size={16} />
                </button>

                <button
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    className={`${styles.button} ${editor.isActive('taskList') ? styles.active : ''}`}
                    aria-label="Список задач"
                >
                    <BiCheckSquare size={16} />
                </button>

                <div className={styles.alignmentGroup}>
                    <button
                        onClick={() => handleAlignment('left')}
                        className={`${styles.button} ${editor.isActive({ textAlign: 'left' }) ? styles.active : ''}`}
                        aria-label="По левому краю"
                    >
                        <BiAlignLeft size={16} />
                    </button>
                    <button
                        onClick={() => handleAlignment('center')}
                        className={`${styles.button} ${editor.isActive({ textAlign: 'center' }) ? styles.active : ''}`}
                        aria-label="По центру"
                    >
                        <BiAlignMiddle size={16} />
                    </button>
                    <button
                        onClick={() => handleAlignment('right')}
                        className={`${styles.button} ${editor.isActive({ textAlign: 'right' }) ? styles.active : ''}`}
                        aria-label="По правому краю"
                    >
                        <BiAlignRight size={16} />
                    </button>
                    <button
                        onClick={() => handleAlignment('justify')}
                        className={`${styles.button} ${editor.isActive({ textAlign: 'justify' }) ? styles.active : ''}`}
                        aria-label="По ширине"
                    >
                        <BiAlignJustify size={16} />
                    </button>
                </div>

                <button onClick={handleClearStyles} className={styles.button} aria-label="Очистить форматирование">
                    <BiX size={16} />
                </button>
            </div>
        </BubbleMenu>
    );
}
