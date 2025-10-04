// case FONT_SIZE_SMALL_TEXT:
//     className = 'body-text small-text';
//     break;
// case FONT_SIZE_BIG_TEXT:
//     className = 'body-text big-text';

import { TextType } from '@/types';
import { cleanListMarkers } from '@/utils/cleanListMarkers';

// case FONT_SIZE_BIG_HEADING:
//     className = 'heading-text big-heading';
//     break;
// case FONT_SIZE_VERY_BIG_HEADING:
//     className = 'heading-text very-big-heading';
//     break;
// default:
//     className = 'body-text normal-text';
//     break;

export const getTextContent = (textType: TextType, text: string | string[], textAlign?: string) => {
    switch (textType) {
        case TextType.TITLE:
            return `<span class="heading-text title-text">${text}</span>`;
        case TextType.HEADING1:
            return `<span class="heading-text heading-1">${text}</span>`;
        case TextType.HEADING2:
            return `<span class="heading-text heading-2">${text}</span>`;
        case TextType.HEADING3:
            return `<span class="heading-text heading-3">${text}</span>`;
        case TextType.HEADING4:
            return `<span class="heading-text heading-4">${text}</span>`;
        case TextType.QUOTE:
            // Wrap quote content into blockquote tag and ensure string result
            if (Array.isArray(text)) {
                return `<blockquote>${text.join('\n')}</blockquote>`;
            }
            return `<blockquote>${text}</blockquote>`;
        case TextType.BULLET_LIST:
            if (Array.isArray(text)) {
                return `<ul>
    ${text.map(item => `<li><span class="body-text normal-text">${cleanListMarkers(item)}</span></li>`).join('')}
</ul>`;
            }
            return `<ul>
    <li><span class="body-text normal-text">${cleanListMarkers(text)}</span></li>
</ul>`;
        case TextType.NUMERED_LIST:
            if (Array.isArray(text)) {
                return `<ol>
    ${text.map(item => `<li><span class="body-text normal-text">${cleanListMarkers(item)}</span></li>`).join('')}
</ol>`;
            }
            return `<ol>
    <li><span class="body-text normal-text">${cleanListMarkers(text)}</span></li>
</ol>`;
        case TextType.TODO_LIST:
            if (Array.isArray(text)) {
                return `<ul data-type="taskList">
    ${text.map(item => `<li data-type="taskItem" data-checked="false"><span class="body-text normal-text">${cleanListMarkers(item)}</span></li>`).join('')}
</ul>`;
            }
            return `<ul data-type="taskList">
    <li data-type="taskItem" data-checked="false"><span class="body-text normal-text">${cleanListMarkers(text)}</span></li>
</ul>`;

        default:
            // Basic conversion: keep paragraphs and support **Heading** style for simple AI-generated text.
            if (typeof text === 'string') {
                const convertAiTextToHtml = (raw: string): string => {
                    const lines = raw.replace(/\r\n/g, '\n').split('\n');

                    const htmlParts: string[] = [];

                    for (const line of lines) {
                        // const trimmed = line.trim();

                        // if (!trimmed) {
                        //     htmlParts.push('<br />');
                        //     continue;
                        // }

                        const headingMatch = line.match(/^\*\*(.+?)\*\*$/);
                        if (headingMatch) {
                            htmlParts.push(`<span class="heading-text heading-1">${headingMatch[1].trim()}</span>`);
                        } else {
                            htmlParts.push(`<p class="body-text normal-text">${line}</p>`);
                        }
                    }

                    return htmlParts.join('\n');
                };

                return convertAiTextToHtml(text);
            }

            // eslint-disable-next-line no-case-declarations
            const pStyle = textAlign ? `style="text-align: ${textAlign};"` : '';
            // Fallback to simple paragraph handling
            return `<p ${pStyle}>${Array.isArray(text) ? text.join(' ') : text}</p>`;
    }
};

const editorsDefaultContent = {
    title: '<span class="heading-text title-text">Заголовок</span>',
    heading1: '<span class="heading-text heading-1">Подзаголовок 1</span>',
    heading2: '<span class="heading-text heading-2">Подзаголовок 2</span>',
    heading3: '<span class="heading-text heading-3">Подзаголовок 3</span>',
    heading4: '<span class="heading-text heading-4">Подзаголовок 4</span>',
    quote: '<blockquote>Цитата</blockquote>',
    table2x2: `
<table>
    <tbody>
        <tr>
            <td><p>Ячейка 1</p></td>
            <td><p>Ячейка 2</p></td>
        </tr>
        <tr>
            <td><p>Ячейка 3</p></td>
            <td><p>Ячейка 4</p></td>
        </tr>
    </tbody>
</table>`,
    table3x3: `
<table>
    <tbody>
        <tr>
            <td><p>Ячейка 1</p></td>
            <td><p>Ячейка 2</p></td>
            <td><p>Ячейка 3</p></td>
        </tr>
        <tr>
            <td><p>Ячейка 4</p></td>
            <td><p>Ячейка 5</p></td>
            <td><p>Ячейка 6</p></td>
        </tr>
        <tr>
            <td><p>Ячейка 7</p></td>
            <td><p>Ячейка 8</p></td>
            <td><p>Ячейка 9</p></td>
        </tr>
    </tbody>
</table>`,
    table4x4: `
<table>
    <tbody>
        <tr>
            <td><p>Ячейка 1</p></td>
            <td><p>Ячейка 2</p></td>
            <td><p>Ячейка 3</p></td>
            <td><p>Ячейка 4</p></td>
        </tr>
        <tr>
            <td><p>Ячейка 5</p></td>
            <td><p>Ячейка 6</p></td>
            <td><p>Ячейка 7</p></td>
            <td><p>Ячейка 8</p></td>
        </tr>
        <tr>
            <td><p>Ячейка 9</p></td>
            <td><p>Ячейка 10</p></td>
            <td><p>Ячейка 11</p></td>
            <td><p>Ячейка 12</p></td>
        </tr>
        <tr>
            <td><p>Ячейка 13</p></td>
            <td><p>Ячейка 14</p></td>
            <td><p>Ячейка 15</p></td>
            <td><p>Ячейка 16</p></td>
        </tr>
    </tbody>
</table>`,
    lists: `
<ul>
    <li>Элемент списка</li>
    <li>Еще один элемент списка</li>
</ul>`,
    numeredList: `
<ol>
    <li>Первый элемент списка</li>
    <li>Второй элемент списка</li>
</ol>`,
    todoList: `
<ul data-type="taskList">
    <li data-type="taskItem" data-checked="true">Первый элемент списка</li>
    <li data-type="taskItem" data-checked="false">Второй элемент списка</li>
</ul>`,
    box: `<p><span class="body-text normal-text">Простой блок текста</span></p>`,
    noteBox: `<p><span class="body-text normal-text">Важная заметка</span></p>`,
    infoBox: `<p><span class="body-text normal-text">Полезная информация</span></p>`,
    warningBox: `<p><span class="body-text normal-text">Предупреждение</span></p>`,
    cautionBox: `<p><span class="body-text normal-text">Внимание!</span></p>`,
    successBox: `<p><span class="body-text normal-text">Успешно выполнено</span></p>`,
    questionBox: `<p><span class="body-text normal-text">Частый вопрос</span></p>`,
    button: `<button data-type="button">Текст кнопки</button>`,
    toggle: `
      <details>
        <summary>This is a summary</summary>
        <p>Surprise!</p>
      </details>
`,
};

export default editorsDefaultContent;
