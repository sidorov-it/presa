// case FONT_SIZE_SMALL_TEXT:
//     className = 'body-text small-text';
//     break;
// case FONT_SIZE_BIG_TEXT:
//     className = 'body-text big-text';

// case FONT_SIZE_BIG_HEADING:
//     className = 'heading-text big-heading';
//     break;
// case FONT_SIZE_VERY_BIG_HEADING:
//     className = 'heading-text very-big-heading';
//     break;
// default:
//     className = 'body-text normal-text';
//     break;

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
    <li>A list item</li>
    <li>And another one</li>
</ul>`,
    numeredList: `
<ol>
    <li>A list item</li>
    <li>And another one</li>
</ol>`,
    todoList: `
<ul data-type="taskList">
    <li data-type="taskItem" data-checked="true">A list item</li>
    <li data-type="taskItem" data-checked="false">And another one</li>
</ul>`,
    box: `<div data-type="box" class="box"><p>Простой блок текста</p></div>`,
    noteBox: `<div data-type="note-box" class="note-box"><p>📝 Важная заметка</p></div>`,
    infoBox: `<div data-type="info-box" class="info-box"><p>ℹ️ Полезная информация</p></div>`,
    warningBox: `<div data-type="warning-box" class="warning-box"><p>⚠️ Предупреждение</p></div>`,
    cautionBox: `<div data-type="caution-box" class="caution-box"><p>🚨 Внимание!</p></div>`,
    successBox: `<div data-type="success-box" class="success-box"><p>✅ Успешно выполнено</p></div>`,
    questionBox: `<div data-type="question-box" class="question-box"><p>❓ Частый вопрос</p></div>`,
    button: `<button data-type="button">Текст кнопки</button>`,
    toggle: `
      <details>
        <summary>This is a summary</summary>
        <p>Surprise!</p>
      </details>
`,
};

export default editorsDefaultContent;
