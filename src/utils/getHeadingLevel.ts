import { Editor } from '@tiptap/react';

import {
    NORMAL_TEXT_LEVEL,
    SMALL_TEXT_LEVEL,
    BIG_TEXT_LEVEL,
    VERY_BIG_HEADING_LEVEL,
    BIG_HEADING_LEVEL,
    TITLE_LEVEL,
    FONT_SIZE_SMALL_TEXT,
    FONT_SIZE_BIG_TEXT,
    FONT_SIZE_TITLE,
    FONT_SIZE_BIG_HEADING,
    FONT_SIZE_VERY_BIG_HEADING,
    FONT_SIZE_HEADING_1,
    FONT_SIZE_HEADING_2,
    FONT_SIZE_HEADING_3,
    FONT_SIZE_HEADING_4,
    HEADING_1_LEVEL,
    HEADING_2_LEVEL,
    HEADING_3_LEVEL,
    HEADING_4_LEVEL,
} from '@/constants/consts';

export default function getHeadingLevel(editor: Editor) {
    // Определяем текстовые стили для проверки fontSize
    const marks = editor.getAttributes('textStyle');

    // Heading detection is no longer used since we're using the custom font size extension
    // instead of the built-in heading extension

    if (editor.isActive('paragraph')) {
        // Always check fontSize regardless of node type
        if (marks.fontSize) {
            const fontSize = marks.fontSize?.fontSize || marks.fontSize;
            switch (fontSize) {
                case FONT_SIZE_SMALL_TEXT:
                    return SMALL_TEXT_LEVEL;
                case FONT_SIZE_BIG_TEXT:
                    return BIG_TEXT_LEVEL;
                case FONT_SIZE_HEADING_4:
                    return HEADING_4_LEVEL;
                case FONT_SIZE_HEADING_3:
                    return HEADING_3_LEVEL;
                case FONT_SIZE_HEADING_2:
                    return HEADING_2_LEVEL;
                case FONT_SIZE_HEADING_1:
                    return HEADING_1_LEVEL;
                case FONT_SIZE_TITLE:
                    return TITLE_LEVEL;
                case FONT_SIZE_BIG_HEADING:
                    return BIG_HEADING_LEVEL;
                case FONT_SIZE_VERY_BIG_HEADING:
                    return VERY_BIG_HEADING_LEVEL;
                default:
                    return NORMAL_TEXT_LEVEL;
            }
        }
    }

    return NORMAL_TEXT_LEVEL;
}
