import tinycolor from 'tinycolor2';

/**
 * Возвращает hover-цвет на основе переданного HEX.
 * @param {string} hex - Цвет в HEX формате (например, "#4CAF50")
 * @param {number} [darkenPercent=10] - Насколько затемнять цвет (%)
 * @returns {string} - Новый HEX-цвет
 */
export default function getHoverColor(hex: string, diffPercent = 10) {
    const color = tinycolor(hex);
    if (!color.isValid()) {
        throw new Error('Неверный цвет');
    }

    const adjusted = color.isLight() ? color.darken(diffPercent) : color.lighten(diffPercent);

    return adjusted.toHexString();
}
