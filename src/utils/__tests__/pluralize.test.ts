import { pluralize, pluralizeSlide, pluralizePresentation, pluralizeElement } from '../pluralize';

describe('pluralize', () => {
    describe('общая функция pluralize', () => {
        it('правильно склоняет слова для числа 1', () => {
            expect(pluralize(1, 'слайд', 'слайда', 'слайдов')).toBe('слайд');
            expect(pluralize(1, 'презентация', 'презентации', 'презентаций')).toBe('презентация');
        });

        it('правильно склоняет слова для чисел 2-4', () => {
            expect(pluralize(2, 'слайд', 'слайда', 'слайдов')).toBe('слайда');
            expect(pluralize(3, 'слайд', 'слайда', 'слайдов')).toBe('слайда');
            expect(pluralize(4, 'слайд', 'слайда', 'слайдов')).toBe('слайда');
        });

        it('правильно склоняет слова для чисел 5+', () => {
            expect(pluralize(5, 'слайд', 'слайда', 'слайдов')).toBe('слайдов');
            expect(pluralize(10, 'слайд', 'слайда', 'слайдов')).toBe('слайдов');
            expect(pluralize(20, 'слайд', 'слайда', 'слайдов')).toBe('слайдов');
        });

        it('правильно обрабатывает числа 11-14', () => {
            expect(pluralize(11, 'слайд', 'слайда', 'слайдов')).toBe('слайдов');
            expect(pluralize(12, 'слайд', 'слайда', 'слайдов')).toBe('слайдов');
            expect(pluralize(13, 'слайд', 'слайда', 'слайдов')).toBe('слайдов');
            expect(pluralize(14, 'слайд', 'слайда', 'слайдов')).toBe('слайдов');
        });

        it('правильно обрабатывает числа 21-24', () => {
            expect(pluralize(21, 'слайд', 'слайда', 'слайдов')).toBe('слайд');
            expect(pluralize(22, 'слайд', 'слайда', 'слайдов')).toBe('слайда');
            expect(pluralize(23, 'слайд', 'слайда', 'слайдов')).toBe('слайда');
            expect(pluralize(24, 'слайд', 'слайда', 'слайдов')).toBe('слайда');
        });

        it('работает с отрицательными числами', () => {
            expect(pluralize(-1, 'слайд', 'слайда', 'слайдов')).toBe('слайд');
            expect(pluralize(-5, 'слайд', 'слайда', 'слайдов')).toBe('слайдов');
        });
    });

    describe('pluralizeSlide', () => {
        it('правильно склоняет слово "слайд"', () => {
            expect(pluralizeSlide(1)).toBe('слайд');
            expect(pluralizeSlide(2)).toBe('слайда');
            expect(pluralizeSlide(5)).toBe('слайдов');
            expect(pluralizeSlide(11)).toBe('слайдов');
            expect(pluralizeSlide(21)).toBe('слайд');
        });
    });

    describe('pluralizePresentation', () => {
        it('правильно склоняет слово "презентация"', () => {
            expect(pluralizePresentation(1)).toBe('презентация');
            expect(pluralizePresentation(2)).toBe('презентации');
            expect(pluralizePresentation(5)).toBe('презентаций');
            expect(pluralizePresentation(11)).toBe('презентаций');
            expect(pluralizePresentation(21)).toBe('презентация');
        });
    });

    describe('pluralizeElement', () => {
        it('правильно склоняет слово "элемент"', () => {
            expect(pluralizeElement(1)).toBe('элемент');
            expect(pluralizeElement(2)).toBe('элемента');
            expect(pluralizeElement(5)).toBe('элементов');
            expect(pluralizeElement(11)).toBe('элементов');
            expect(pluralizeElement(21)).toBe('элемент');
        });
    });
});
