import { markdownToHtml } from './markdownToHtml';

describe('markdownToHtml', () => {
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
});
