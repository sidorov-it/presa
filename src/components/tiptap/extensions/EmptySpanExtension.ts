import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

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
                                // Создаем mark с дефолтными классами
                                const textStyleMarkType = this.editor.schema.marks.textStyle;
                                if (textStyleMarkType) {
                                    const defaultMark = textStyleMarkType.create({
                                        class: 'body-text normal-text',
                                        fontSize: null,
                                    });

                                    const tr = state.tr;
                                    tr.insertText(text, from, to);

                                    // Применяем дефолтный mark к новому тексту
                                    tr.addMark(from, from + text.length, defaultMark);

                                    view.dispatch(tr);
                                    return true;
                                }
                            }
                        }

                        return false;
                    },
                },
            }),
        ];
    },
});
