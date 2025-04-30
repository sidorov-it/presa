import { Editor } from '@tiptap/react';
import { useState, useRef, useEffect } from 'react';
import { BiLink, BiUnlink } from 'react-icons/bi';
import styles from './LinkEditor.module.css';

export const LinkEditor = ({ editor, className }: { editor: Editor; className?: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState('');
    const linkEditorRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Получаем текущий URL, если ссылка уже существует
    useEffect(() => {
        if (isOpen && editor.isActive('link')) {
            const attrs = editor.getAttributes('link');
            setUrl(attrs.href || '');

            // Фокус на поле ввода и выделение текста для удобства редактирования
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 0);
        }
    }, [isOpen, editor]);

    // Обработчик клика вне компонента
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (linkEditorRef.current && !linkEditorRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Открытие/закрытие редактора ссылок
    const toggleLinkEditor = () => {
        if (!isOpen && !editor.isActive('link')) {
            setUrl(''); // Сбросить URL при открытии, если нет активной ссылки
        }
        setIsOpen(!isOpen);
    };

    // Применение ссылки
    const applyLink = () => {
        if (url.trim()) {
            // Проверяем, есть ли протокол (http:// или https://)
            let formattedUrl = url.trim();
            if (!/^https?:\/\//i.test(formattedUrl) && !/^mailto:/i.test(formattedUrl)) {
                formattedUrl = `https://${formattedUrl}`;
            }

            editor.chain().focus().setLink({ href: formattedUrl }).run();
        }
        setIsOpen(false);
    };

    // Удаление ссылки
    const deleteLink = () => {
        editor.chain().focus().unsetLink().run();
        setIsOpen(false);
    };

    // Обработка нажатия Enter в поле ввода
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            applyLink();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsOpen(false);
        }
    };

    return (
        <div className={`${styles.linkEditorContainer} light-theme-only`} data-type="link-editor" ref={linkEditorRef}>
            <button
                onClick={toggleLinkEditor}
                className={`${className || ''} ${editor.isActive('link') ? styles.active : ''}`}
                aria-label="Вставить ссылку"
                aria-expanded={isOpen}
            >
                <BiLink size={16} />
            </button>

            {isOpen && (
                <div className={`${styles.linkPopover} light-theme-only`}>
                    <div className={styles.linkForm}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Введите URL..."
                            className={styles.linkInput}
                            aria-label="URL ссылки"
                            data-type="link-input"
                        />
                        <div className={styles.linkActions}>
                            <button onClick={applyLink} className={styles.applyButton} disabled={!url.trim()}>
                                Применить
                            </button>
                            {editor.isActive('link') && (
                                <button
                                    onClick={deleteLink}
                                    className={styles.removeButton}
                                    aria-label="Удалить ссылку"
                                >
                                    <BiUnlink size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
