import { JSDOM } from 'jsdom';

export const stripHtml = (html: string) => {
    const dom = new JSDOM(html);
    const text = dom.window.document.body.textContent || '';

    // Remove extra whitespace and normalize spaces
    return text.replace(/\s+/g, ' ').trim();
};
