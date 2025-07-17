import { markdownToHtml } from './markdownToHtml';

describe('markdownToHtml', () => {

    it('test', () => {
        const text = '# Заявка на грант Yandex Cloud Boost для AI-конструктора презентаций';
        const html = markdownToHtml(text);
        console.log(html);
    })
    it('converts complex markdown cases', () => {
        const texts = [
            '# Спасибо за внимание!\n\nВаше время ценно, и я рад, что смог поделиться с вами прогнозами и тенденциями в области искусственного интеллекта на ближайшие годы.',
            '### Что делать дальше?\n- Изучите материалы по ИИ и машинному обучению.\n- Подпишитесь на наши обновления, чтобы быть в курсе последних новостей.\n- Присоединяйтесь к нашим семинарам и вебинарам.',
            '### Свяжитесь со мной:\n📧 Email: example@example.com\n📞 Телефон: +123456789\n🌐 Сайт: www.example.com',
            '## Заголовок\n\nТекст параграфа\n\n### Подзаголовок\n\nЕще текст',
            '> Цитата\n\nОбычный текст\n\n**Жирный текст**',
            '1. Первый пункт\n2. Второй пункт\n\nТекст после списка',
            '- Пункт 1\n- Пункт 2\n\n### Заголовок после списка'
        ];

        texts.forEach((text, index) => {
            const html = markdownToHtml(text);
            console.log(`\n=== Test case ${index + 1} ===`);
            console.log('Input:', JSON.stringify(text));
            console.log('Output:', html);
            console.log('---');
        });
    });

    it('converts headings correctly', () => {
        const md = '# Title\n## Subtitle\n### Sub-subtitle';
        const html = markdownToHtml(md);
        expect(html).toContain('<span class="heading-text heading-1">Title</span>');
        expect(html).toContain('<span class="heading-text heading-2">Subtitle</span>');
        expect(html).toContain('<span class="heading-text heading-3">Sub-subtitle</span>');
    });

    it('converts bold and italic formatting', () => {
        const md = 'Normal **bold** and *italic* text';
        const html = markdownToHtml(md);
        expect(html).toContain('<strong>bold</strong>');
        expect(html).toContain('<em>italic</em>');
    });

    it('converts unordered lists', () => {
        const md = '- Item 1\n- Item 2';
        const html = markdownToHtml(md);
        expect(html).toContain('<ul>');
        expect(html).toContain('<li>Item 1</li>');
        expect(html).toContain('<li>Item 2</li>');
        expect(html).toContain('</ul>');
    });

    it('converts ordered lists', () => {
        const md = '1. First\n2. Second';
        const html = markdownToHtml(md);
        expect(html).toContain('<ol>');
        expect(html).toContain('<li>First</li>');
        expect(html).toContain('<li>Second</li>');
        expect(html).toContain('</ol>');
    });

    it('converts block quotes', () => {
        const md = '> A famous quote';
        const html = markdownToHtml(md);
        expect(html).toContain('<blockquote>A famous quote</blockquote>');
    });

    it('handles empty lines correctly', () => {
        const md = 'Line 1\n\nLine 2\n\n\nLine 3';
        const html = markdownToHtml(md);
        console.log('\n=== Empty lines test ===');
        console.log('Input:', JSON.stringify(md));
        console.log('Output:', html);
        // Должно быть: Line 1<br />Line 2<br />Line 3
        expect(html).not.toContain('<br /><br />'); // Не должно быть двойных переносов
    });

    it('handles mixed content correctly', () => {
        const md = '# Title\n\nParagraph with **bold** text.\n\n- List item 1\n- List item 2\n\n> Quote here';
        const html = markdownToHtml(md);
        console.log('\n=== Mixed content test ===');
        console.log('Input:', JSON.stringify(md));
        console.log('Output:', html);
    });
});
