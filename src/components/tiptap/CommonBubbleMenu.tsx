import { BubbleMenu, Editor } from "@tiptap/react";
import { ColorPicker } from "./ColorPicker";
import { LinkEditor } from "./LinkEditor";
import styles from "./BubbleMenu.module.css";
import {
    BiBold,
    BiItalic,
    BiUnderline,
    BiStrikethrough,
    BiCode,
    BiListOl,
    BiListUl,
    BiCheckSquare,
    BiAlignLeft,
    BiAlignMiddle,
    BiAlignRight,
    BiAlignJustify,
    BiX,
    BiChevronDown,
} from "react-icons/bi";
import { Level } from "@tiptap/extension-heading";
import { useState, useRef, useEffect, useCallback } from "react";
import { useSlideMenu } from "@/contexts/SlideMenuContext";
import { EditorView } from "@tiptap/pm/view";
import { EditorState } from "@tiptap/pm/state";

export default function CommonBubbleMenu({
    editor,
}: {
    editor: Editor;
}) {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);
    const { closeMenu, state: { isOpen } } = useSlideMenu();

    const headingLevels = [
        { label: "Текст", level: 0 },
        { label: "Заголовок 1", level: 1 },
        { label: "Заголовок 2", level: 2 },
        { label: "Заголовок 3", level: 3 },
        { label: "Заголовок 4", level: 4 },
        { label: "Заголовок 5", level: 5 },
        { label: "Дисплей", level: 6 },
        { label: "Монстр", level: 7 },
    ];

    // Определение текущего уровня заголовка
    const getCurrentHeadingLevel = useCallback(() => {
        for (let i = 1; i <= 5; i++) {
            if (editor.isActive('heading', { level: i })) {
                return i;
            }
        }
        return 0; // Параграф (обычный текст)
    }, [editor]);

    // Закрытие выпадающего меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headingMenuRef.current && !headingMenuRef.current.contains(event.target as Node)) {
                setIsHeadingMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleHeadingChange = useCallback((level: number) => {
        if (level === 0) {
            editor.chain().focus().setParagraph().run();
            // } else if (level === 6) {
            //   editor.chain().focus().setDisplay().run();
            // } else if (level === 7) {
            //   editor.chain().focus().setMonster().run();
        } else {
            editor.chain().focus().setHeading({ level: level as Level }).run();
        }
        setIsHeadingMenuOpen(false);
    }, [editor]);

    const handleAlignment = useCallback((align: 'left' | 'center' | 'right' | 'justify') => {
        editor.chain().focus().setTextAlign(align).run();
    }, [editor]);

    const handleClearStyles = useCallback(() => {
        editor.chain().focus().clearNodes().unsetAllMarks().run();
    }, [editor]);

    // Force light theme styles for bubble menu
    const lightThemeStyle = {
        backgroundColor: 'white',
        color: '#333',
        borderColor: '#e0e0e0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    };


    const shouldShow = useCallback(({ editor: _editor, view, state: _state, oldState: _oldState, from, to }: { editor: Editor; view: EditorView; state: EditorState; oldState?: EditorState | null; from: number; to: number }) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        if (from !== to && view.focused) {
            return true;
        }

        if (isOpen) {
            closeMenu();
        }

        return false;
    }, [isOpen, closeMenu]);

    return (
        <BubbleMenu
            editor={editor}
            tippyOptions={{
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
            updateDelay={0}
            shouldShow={shouldShow}
        >
            <div className={`${styles.bubbleMenu} light-theme-only`} style={lightThemeStyle}>
                <div className={styles.headingSelector} ref={headingMenuRef}>
                    <button
                        className={`${styles.button} ${styles.headingButton}`}
                        onClick={() => setIsHeadingMenuOpen(!isHeadingMenuOpen)}
                        aria-label="Выбрать тип текста"
                        aria-expanded={isHeadingMenuOpen}
                    >
                        <span className={styles.selectText}>{headingLevels[getCurrentHeadingLevel()].label}</span>
                        <BiChevronDown size={14} className={styles.chevron} />
                    </button>

                    {isHeadingMenuOpen && (
                        <div className={styles.headingDropdown} style={lightThemeStyle}>
                            {headingLevels.map((item) => (
                                <button
                                    key={item.level}
                                    onClick={() => handleHeadingChange(item.level)}
                                    className={`${styles.headingOption} ${getCurrentHeadingLevel() === item.level ? styles.activeHeading : ''}`}
                                    style={{ color: '#333' }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <ColorPicker
                    editor={editor}
                    className={styles.button}
                />

                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
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

                <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`${styles.button} ${editor.isActive('code') ? styles.active : ''}`}
                    aria-label="Код"
                >
                    <BiCode size={16} />
                </button>

                <LinkEditor
                    editor={editor}
                    className={styles.button}
                />

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

                <button
                    onClick={handleClearStyles}
                    className={styles.button}
                    aria-label="Очистить форматирование"
                >
                    <BiX size={16} />
                </button>
            </div>
        </BubbleMenu>
    );
}