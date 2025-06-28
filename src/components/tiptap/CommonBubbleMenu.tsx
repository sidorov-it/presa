import { BubbleMenu, Editor } from '@tiptap/react';
import { ColorPicker } from './ColorPicker';
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
import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { EditorView } from '@tiptap/pm/view';
import { EditorState } from '@tiptap/pm/state';
import HeadingSelector from '../settings/HeadingSelector/HeadingSelector';
import { HEADING_LEVELS } from '@/constants/consts';
import getHeadingLevel from '@/utils/getHeadingLevel';

export default function CommonBubbleMenu({ editor }: { editor: Editor }) {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);

    // const isOpen = useMenuIsOpen();

    // Определение текущего уровня заголовка или размера текста
    const getCurrentHeadingLevel = useCallback(() => {
        return getHeadingLevel(editor);
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

    // const handleHeadingChange = useCallback(
    //     (level: number) => {
    //         editor.chain().focus(null, { scrollIntoView: false }).selectAll().setFontSize(level).blur().run();
    //         setIsHeadingMenuOpen(false);
    //     },
    //     [editor]
    // );

    const handleHeadingChange = useCallback(
        (level: number) => {
            // Применяем размер только к текущему выделению
            editor.chain().focus(null, { scrollIntoView: false }).setFontSize(level).blur().run();
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

                {/* <LinkEditor editor={editor} className={styles.button} /> */}

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

// export default memo(CommonBubbleMenu, (prevProps, nextProps) => {
//     return prevProps.editor === nextProps.editor;
// });
