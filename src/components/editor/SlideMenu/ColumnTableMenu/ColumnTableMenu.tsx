import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    BiBold,
    BiItalic,
    BiUnderline,
    BiX,
    BiArrowToLeft,
    BiArrowToRight,
    BiTrash
} from 'react-icons/bi';
import { useMenuStore } from '@/store/menuStore';
import { TipTapRefs } from '@/types';
import { MutableRefObject } from 'react';
import { MenuItem } from '../BaseMenu';
import HeadingSelector from '@/components/settings/HeadingSelector/HeadingSelector';
import { Level } from '@tiptap/extension-heading';
import { useShallow } from 'zustand/react/shallow';
interface ColumnTableMenuProps {
    elementId?: string;
    presentationId?: string;
    tableColumnIndex?: number;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const ColumnTableMenu: React.FC<ColumnTableMenuProps> = ({
    tableColumnIndex,
    tiptapRefs
}) => {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);

    const tableColumnElements = useMenuStore(useShallow(state => state.getTableColumnElements()));
    const currentHeadingLevel = useMenuStore(state => state.getCommonColumnHeadingLevel(tiptapRefs));

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

    const isBoldActive = useMemo(() => {
        return !tableColumnElements.some(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                return !editor.isActive('bold') && !editor.isEmpty;
            }
            return false;
        });
    }, [tableColumnElements]);

    const isItalicActive = useMemo(() => {
        return !tableColumnElements.some(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                return !editor.isActive('italic') && !editor.isEmpty;
            }
            return true;
        });
    }, [tableColumnElements]);

    const isUnderlineActive = useMemo(() => {
        return !tableColumnElements.some(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                return !editor.isActive('underline') && !editor.isEmpty;
            }
            return true;
        });
    }, [tableColumnElements]);

    const handleToggleBold = useCallback(() => {
        tableColumnElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isBoldActive) {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetBold().blur().run();
                } else {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().setBold().blur().run();
                }
            }
        });
    }, [tableColumnElements, tiptapRefs, isBoldActive]);

    const handleToggleItalic = useCallback(() => {
        tableColumnElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isItalicActive) {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetItalic().blur().run();
                } else {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().setItalic().blur().run();
                }
            }
        });
    }, [tableColumnElements, tiptapRefs, isItalicActive]);

    const handleToggleUnderline = useCallback(() => {
        tableColumnElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isUnderlineActive) {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetUnderline().blur().run();
                } else {
                    editor.chain().focus(null, { scrollIntoView: false }).selectAll().setUnderline().blur().run();
                }
            }
        });
    }, [tableColumnElements, tiptapRefs, isUnderlineActive]);

    const handleClearStyles = useCallback(() => {
        tableColumnElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                editor.chain().clearNodes().unsetAllMarks().run();
            }
        });
    }, [tableColumnElements, tiptapRefs]);

    const handleAddColumnLeft = useCallback(() => {
        if (Number.isInteger(tableColumnIndex)) {
            useMenuStore.getState().addColumnToTable(tableColumnIndex!);
            useMenuStore.getState().closeMenu();
        }
    }, [tableColumnIndex]);

    const handleAddColumnRight = useCallback(() => {
        if (Number.isInteger(tableColumnIndex)) {
            useMenuStore.getState().addColumnToTable(tableColumnIndex! + 1);
            useMenuStore.getState().closeMenu();
        }
    }, [tableColumnIndex]);

    const handleDeleteColumn = useCallback(() => {
        if (Number.isInteger(tableColumnIndex)) {
            useMenuStore.getState().deleteColumnFromTable(tableColumnIndex!);
            useMenuStore.getState().closeMenu();
        }
    }, [tableColumnIndex]);

    const handleHeadingChange = useCallback((level: number) => {
        tableColumnElements.forEach(element => {
            tiptapRefs.current.editors[element.id]?.editor.chain().setHeading({ level: level as Level }).run();
        });
        setLocalHeadingLevel(level);
    }, [tableColumnElements, tiptapRefs]);

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

            {/* <ColorPicker
                editors={tableColumnElements.map(element => tiptapRefs.current.editors[element.id]?.editor)}
                className={bubbleStyles.button}
            /> */}
            <MenuItem
                icon={<BiBold />}
                label="Bold"
                onClick={handleToggleBold}
                active={isBoldActive}
            />
            <MenuItem
                icon={<BiItalic />}
                label="Italic"
                onClick={handleToggleItalic}
                active={isItalicActive}
            />
            <MenuItem
                icon={<BiUnderline />}
                label="Underline"
                onClick={handleToggleUnderline}
                active={isUnderlineActive}
            />
            <MenuItem
                icon={<BiX />}
                label="Clear formatting"
                onClick={handleClearStyles}
            />
            <MenuItem
                icon={<BiArrowToLeft />}
                label="Add column left"
                onClick={handleAddColumnLeft}
            />
            <MenuItem
                icon={<BiArrowToRight />}
                label="Add column right"
                onClick={handleAddColumnRight}
            />
            <MenuItem
                icon={<BiTrash />}
                label="Delete column"
                onClick={handleDeleteColumn}
                color="#f00"
            />
        </>
    );
};

export default ColumnTableMenu;
