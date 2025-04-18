import React, { useState, useRef, useEffect, useCallback, MutableRefObject, useMemo } from 'react';
import { BiBold, BiItalic, BiUnderline, BiX, BiArrowToTop, BiArrowToBottom, BiTrash } from 'react-icons/bi';
import bubbleStyles from '@/components/tiptap/BubbleMenu.module.css';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import HeadingSelector from '@/components/settings/HeadingSelector/HeadingSelector';
import { useMenuStore } from '@/store/menuStore';
import { TipTapRefs } from '@/types';
import { MenuItem } from '../BaseMenu';
import { useShallow } from 'zustand/react/shallow';
import { Level } from '@tiptap/extension-heading';
import isEditorPropertyConsistent from '@/utils/isEditorPropertyConsistent';
interface RowTableMenuProps {
    elementId?: string;
    tableRowIndex?: number;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const RowTableMenu: React.FC<RowTableMenuProps> = ({ tableRowIndex, tiptapRefs }) => {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);

    const tableRowElements = useMenuStore(useShallow(state => state.getTableRowElements()));
    const currentHeadingLevel = useMenuStore(useShallow(state => state.getCommonRowHeadingLevel(tiptapRefs) || 0));

    const [localHeadingLevel, setLocalHeadingLevel] = useState<number>(currentHeadingLevel || 0);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headingMenuRef.current && !headingMenuRef.current.contains(event.target as Node)) {
                setIsHeadingMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const isBoldActive = useMemo(
        () => isEditorPropertyConsistent(tableRowElements, tiptapRefs, 'bold'),
        [tableRowElements, tiptapRefs]
    );
    const isItalicActive = useMemo(
        () => isEditorPropertyConsistent(tableRowElements, tiptapRefs, 'italic'),
        [tableRowElements, tiptapRefs]
    );
    const isUnderlineActive = useMemo(
        () => isEditorPropertyConsistent(tableRowElements, tiptapRefs, 'underline'),
        [tableRowElements, tiptapRefs]
    );

    // Close the heading dropdown menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (headingMenuRef.current && !headingMenuRef.current.contains(event.target as Node)) {
                setIsHeadingMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleHeadingChange = useCallback(
        (level: number) => {
            tableRowElements.forEach(element => {
                tiptapRefs.current.editors[element.id]?.editor
                    .chain()
                    .setHeading({ level: level as Level })
                    .run();
            });
            setLocalHeadingLevel(level);
        },
        [tableRowElements, tiptapRefs]
    );

    const handleToggleBold = useCallback(() => {
        tableRowElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isBoldActive) {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetBold().blur().run();
                } else {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().setBold().blur().run();
                }
            }
        });
    }, [tableRowElements, tiptapRefs, isBoldActive]);

    const handleToggleItalic = useCallback(() => {
        tableRowElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isItalicActive) {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetItalic().blur().run();
                } else {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().setItalic().blur().run();
                }
            }
        });
    }, [tableRowElements, tiptapRefs, isItalicActive]);

    const handleToggleUnderline = useCallback(() => {
        tableRowElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isUnderlineActive) {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetUnderline().blur().run();
                } else {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().setUnderline().blur().run();
                }
            }
        });
    }, [tableRowElements, tiptapRefs, isUnderlineActive]);

    const handleClearStyles = useCallback(() => {
        tableRowElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                editor.chain().clearNodes().unsetAllMarks().run();
            }
        });
    }, [tableRowElements, tiptapRefs]);

    // Table row operations
    const handleAddRowAbove = useCallback(() => {
        if (Number.isInteger(tableRowIndex)) {
            useMenuStore.getState().addRowToTable(tableRowIndex!);
            useMenuStore.getState().closeMenu();
        }
    }, [tableRowIndex]);

    const handleAddRowBelow = useCallback(() => {
        if (Number.isInteger(tableRowIndex)) {
            useMenuStore.getState().addRowToTable(tableRowIndex! + 1);
            useMenuStore.getState().closeMenu();
        }
    }, [tableRowIndex]);

    const handleDeleteRow = useCallback(() => {
        if (Number.isInteger(tableRowIndex)) {
            useMenuStore.getState().deleteRowFromTable(tableRowIndex!);
            useMenuStore.getState().closeMenu();
        }
    }, [tableRowIndex]);

    const handleColorChange = useCallback(
        (color: string) => {
            tableRowElements.forEach(element => {
                tiptapRefs.current.editors[element.id]?.editor
                    .chain()
                    .focus(null, { scrollIntoView: false })
                    .selectAll()
                    .setColor(color)
                    .blur()
                    .run();
            });

            // if (editor) {
            //     editor.chain().focus(null, { scrollIntoView: false }).selectAll().setColor(color).blur().run();
            // } else if (editors) {
            //     editors.forEach(editor => {
            //         editor.chain().focus(null, { scrollIntoView: false }).selectAll().setColor(color).blur().run();
            //     });
            // }
        },
        [tableRowElements, tiptapRefs]
    );

    return (
        <>
            <HeadingSelector
                headingMenuRef={headingMenuRef}
                isHeadingMenuOpen={isHeadingMenuOpen}
                setIsHeadingMenuOpen={setIsHeadingMenuOpen}
                getCurrentHeadingLevel={() => localHeadingLevel || 0}
                handleHeadingChange={handleHeadingChange}
                // lightThemeStyle={lightThemeStyle}
            />
            <ColorPicker onColorChange={handleColorChange} className={bubbleStyles.button} />

            <MenuItem icon={<BiBold />} label="Bold" onClick={handleToggleBold} active={isBoldActive} />
            <MenuItem icon={<BiItalic />} label="Italic" onClick={handleToggleItalic} active={isItalicActive} />
            <MenuItem
                icon={<BiUnderline />}
                label="Underline"
                onClick={handleToggleUnderline}
                active={isUnderlineActive}
            />
            <MenuItem icon={<BiX />} label="Clear formatting" onClick={handleClearStyles} />
            <MenuItem icon={<BiArrowToTop />} label="Add row above" onClick={handleAddRowAbove} />
            <MenuItem icon={<BiArrowToBottom />} label="Add row below" onClick={handleAddRowBelow} />
            <MenuItem icon={<BiTrash />} label="Delete row" onClick={handleDeleteRow} color="#f00" />
        </>
    );
};

export default RowTableMenu;
