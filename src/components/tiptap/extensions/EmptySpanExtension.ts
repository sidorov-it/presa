import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import {
    FONT_SIZE_BIG_TEXT,
    FONT_SIZE_TITLE,
    FONT_SIZE_VERY_BIG_HEADING,
    FONT_SIZE_BIG_HEADING,
    HEADING_4_LEVEL,
    BIG_HEADING_LEVEL,
    BIG_TEXT_LEVEL,
    HEADING_1_LEVEL,
    HEADING_2_LEVEL,
    HEADING_3_LEVEL,
    NORMAL_TEXT_LEVEL,
    SMALL_TEXT_LEVEL,
    TITLE_LEVEL,
    VERY_BIG_HEADING_LEVEL,
    FONT_SIZE_HEADING_4,
    FONT_SIZE_HEADING_3,
    FONT_SIZE_HEADING_1,
    FONT_SIZE_HEADING_2,
    FONT_SIZE_SMALL_TEXT,
} from '@/constants/consts';

// Helper function to get fontSize and className from level
const getFontSizeFromLevel = (level: number) => {
    switch (level) {
        case SMALL_TEXT_LEVEL:
            return { fontSize: FONT_SIZE_SMALL_TEXT, className: 'body-text small-text' };
        case BIG_TEXT_LEVEL:
            return { fontSize: FONT_SIZE_BIG_TEXT, className: 'body-text big-text' };
        case HEADING_4_LEVEL:
            return { fontSize: FONT_SIZE_HEADING_4, className: 'heading-text heading-4' };
        case HEADING_3_LEVEL:
            return { fontSize: FONT_SIZE_HEADING_3, className: 'heading-text heading-3' };
        case HEADING_2_LEVEL:
            return { fontSize: FONT_SIZE_HEADING_2, className: 'heading-text heading-2' };
        case HEADING_1_LEVEL:
            return { fontSize: FONT_SIZE_HEADING_1, className: 'heading-text heading-1' };
        case TITLE_LEVEL:
            return { fontSize: FONT_SIZE_TITLE, className: 'heading-text title-text' };
        case BIG_HEADING_LEVEL:
            return { fontSize: FONT_SIZE_BIG_HEADING, className: 'heading-text big-heading' };
        case VERY_BIG_HEADING_LEVEL:
            return { fontSize: FONT_SIZE_VERY_BIG_HEADING, className: 'heading-text very-big-heading' };
        case NORMAL_TEXT_LEVEL:
        default:
            return { fontSize: null, className: 'body-text normal-text' };
    }
};

export const EmptySpanExtension = Extension.create({
    name: 'emptySpan',

    addProseMirrorPlugins() {
        return [
            new Plugin({
                key: new PluginKey('emptySpan'),
                props: {
                    handleTextInput: (view, from, to, text) => {
                        const { state } = view;
                        const { doc } = state;

                        // Проверяем, заменяем ли мы неразрывный пробел
                        const $from = doc.resolve(from);

                        // Получаем текст, который будет заменен
                        const textToReplace = doc.textBetween(from, to);

                        // Если заменяем неразрывный пробел (&nbsp; или \u00A0)
                        if (textToReplace === '\u00A0' || textToReplace === ' ') {
                            const marks = $from.marks();

                            // Ищем textStyle mark с классами body-text normal-text
                            const textStyleMark = marks.find(
                                mark =>
                                    mark.type.name === 'textStyle' &&
                                    mark.attrs.class &&
                                    mark.attrs.class.includes('body-text normal-text')
                            );

                            if (textStyleMark) {
                                // Заменяем неразрывный пробел на обычный текст с сохранением марки
                                const tr = state.tr;
                                tr.insertText(text, from, to);

                                // Применяем mark к новому тексту
                                tr.addMark(from, from + text.length, textStyleMark);

                                view.dispatch(tr);
                                return true;
                            }
                        }

                        // Проверяем, вводим ли мы текст в пустой редактор
                        const isEmpty = doc.textContent.trim() === '';
                        const isEmptyParagraph = doc.textContent === '' || doc.textContent === '\u00A0';

                        if (isEmpty || isEmptyParagraph) {
                            const marks = $from.marks();

                            // Проверяем, есть ли уже textStyle mark
                            const hasTextStyleMark = marks.some(mark => mark.type.name === 'textStyle');

                            if (!hasTextStyleMark) {
                                // Получаем сохраненные стили из CustomPlaceholderExtension
                                const storedStyle = this.editor.storage.customPlaceholder?.storedStyle || {
                                    level: NORMAL_TEXT_LEVEL,
                                    color: null,
                                    bold: false,
                                    italic: false,
                                    underline: false,
                                    strike: false,
                                };

                                // Убираем классы размера у родительского элемента чтобы избежать дублирования
                                const editorElement = this.editor.view.dom as HTMLElement;
                                if (editorElement) {
                                    // Сохраняем базовые классы, убираем только классы размера
                                    const currentClasses = editorElement.className.split(' ');
                                    const baseClasses = currentClasses.filter(cls => 
                                        !cls.includes('heading-text') && 
                                        !cls.includes('body-text') && 
                                        !cls.includes('title-text') &&
                                        !cls.includes('big-heading') &&
                                        !cls.includes('very-big-heading') &&
                                        !cls.includes('heading-1') &&
                                        !cls.includes('heading-2') &&
                                        !cls.includes('heading-3') &&
                                        !cls.includes('heading-4') &&
                                        !cls.includes('big-text') &&
                                        !cls.includes('small-text') &&
                                        !cls.includes('normal-text')
                                    ).join(' ');
                                    editorElement.className = baseClasses;
                                }

                                // Вставляем текст
                                const tr = state.tr;
                                tr.insertText(text, from, to);
                                view.dispatch(tr);

                                // Применяем стили через команды после вставки текста
                                setTimeout(() => {
                                    if (this.editor) {
                                        const chain = this.editor.chain();

                                        // Выделяем только что вставленный текст
                                        chain.setTextSelection({ from, to: from + text.length });

                                        // Применяем размер шрифта
                                        chain.setFontSize(storedStyle.level);

                                        // Применяем цвет если есть
                                        if (storedStyle.color) {
                                            chain.setColor(storedStyle.color);
                                        }

                                        // Применяем дополнительные стили
                                        if (storedStyle.bold) chain.setBold();
                                        if (storedStyle.italic) chain.setItalic();
                                        if (storedStyle.underline) chain.setUnderline();
                                        if (storedStyle.strike) chain.setStrike();

                                        // Убираем выделение и ставим курсор в конец
                                        chain.setTextSelection(from + text.length);

                                        chain.run();
                                    }
                                }, 0);

                                return true;
                            }
                        }

                        return false;
                    },
                },
            }),
        ];
    },
});
