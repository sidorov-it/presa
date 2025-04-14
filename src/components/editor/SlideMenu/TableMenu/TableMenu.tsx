import React, { useState, useRef, useEffect, useCallback, MutableRefObject, useMemo } from 'react';
import {
    BiBold,
    BiItalic,
    BiUnderline,
    BiX,
} from 'react-icons/bi';
import { PiEquals } from "react-icons/pi";

import { useMenuStore } from '@/store/menuStore';
import { TipTapRefs } from '@/types';
import { BaseMenu, MenuItem } from '../BaseMenu';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import HeadingSelector from '@/components/settings/HeadingSelector/HeadingSelector';
import { useShallow } from 'zustand/react/shallow';
import isEditorPropertyConsistent from '@/utils/isEditorPropertyConsistent';

import bubbleStyles from '@/components/tiptap/BubbleMenu.module.css';
import { Level } from '@tiptap/extension-heading';
import { DeleteIcon } from 'lucide-react';

interface TableMenuProps {
    presentationId?: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
    position: { x: number, y: number; rect?: DOMRect };
}

const TableMenu: React.FC<TableMenuProps> = ({
    tiptapRefs,
    position
}) => {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);

    const tableElements = useMenuStore(useShallow(state => state.getTableElements()));
    const currentHeadingLevel = useMenuStore(useShallow(state => state.getCommonTableHeadingLevel(tiptapRefs) || 0));

    const [localHeadingLevel, setLocalHeadingLevel] = useState<number>(currentHeadingLevel || 0);

    // useEffect(() => {
    //     const handleClickOutside = (event: MouseEvent) => {
    //         if (headingMenuRef.current && !headingMenuRef.current.contains(event.target as Node)) {
    //             setIsHeadingMenuOpen(false);
    //         }
    //     };

    //     document.addEventListener('mousedown', handleClickOutside);
    //     return () => {
    //         document.removeEventListener('mousedown', handleClickOutside);
    //     };
    // }, []);

    const isBoldActive = isEditorPropertyConsistent(tableElements, tiptapRefs, 'bold');
    const isItalicActive = isEditorPropertyConsistent(tableElements, tiptapRefs, 'italic');
    const isUnderlineActive = isEditorPropertyConsistent(tableElements, tiptapRefs, 'underline');

    console.log('table menu render', tableElements);
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Don't hide if clicking on the editor or the bubble menu itself
            const target = e.target as HTMLElement;
            if (target.closest('.layout-menu')) {
                return;
            }
            useMenuStore.getState().closeMenu();
        };

        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

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

    const handleHeadingChange = useCallback((level: number) => {
        tableElements.forEach(element => {
            tiptapRefs.current.editors[element.id]?.editor.chain().setHeading({ level: level as Level }).run();
        });
        setLocalHeadingLevel(level);
    }, [tableElements, tiptapRefs]);

    const handleToggleBold = useCallback(() => {
        tableElements.forEach(element => {
            if (isBoldActive) {
                tiptapRefs.current.editors[element.id]?.editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetBold().blur().run();
            } else {
                tiptapRefs.current.editors[element.id]?.editor.chain().focus(null, { scrollIntoView: false }).selectAll().setBold().blur().run();
            }
        });
    }, [tableElements, tiptapRefs, isBoldActive]);

    const handleToggleItalic = useCallback(() => {
        tableElements.forEach(element => {
            if (isItalicActive) {
                tiptapRefs.current.editors[element.id]?.editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetItalic().blur().run();
            } else {
                tiptapRefs.current.editors[element.id]?.editor.chain().focus(null, { scrollIntoView: false }).selectAll().setItalic().blur().run();
            }
        });
    }, [tableElements, tiptapRefs, isItalicActive]);

    const handleToggleUnderline = useCallback(() => {
        tableElements.forEach(element => {
            if (isUnderlineActive) {
                tiptapRefs.current.editors[element.id]?.editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetUnderline().blur().run();
            } else {
                tiptapRefs.current.editors[element.id]?.editor.chain().focus(null, { scrollIntoView: false }).selectAll().setUnderline().blur().run();
            }
        });
    }, [tableElements, tiptapRefs, isUnderlineActive]);

    const handleClearStyles = useCallback(() => {
        tableElements.forEach(element => {
            tiptapRefs.current.editors[element.id]?.editor.chain().focus(null, { scrollIntoView: false }).selectAll().unsetAllMarks().run();
        });
    }, [tableElements, tiptapRefs]);

    const handleEqualize = useCallback(() => {
        useMenuStore.getState().equalizeTable();
    }, []);

    const handleDelete = useCallback(() => {
        useMenuStore.getState().deleteLayout();
    }, []);

    return (
        <BaseMenu position={position} className={'layout-menu'}>
            <HeadingSelector
                headingMenuRef={headingMenuRef}
                isHeadingMenuOpen={isHeadingMenuOpen}
                setIsHeadingMenuOpen={setIsHeadingMenuOpen}
                getCurrentHeadingLevel={() => localHeadingLevel || 0}
                handleHeadingChange={handleHeadingChange}
            // lightThemeStyle={lightThemeStyle}
            />
            <ColorPicker
                editors={tableElements.map(element => tiptapRefs.current.editors[element.id]?.editor)}
                className={bubbleStyles.button}
            />

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
                icon={<PiEquals />}
                label="Equalize"
                active={false}
                onClick={handleEqualize}
            />

            <MenuItem
                icon={<DeleteIcon />}
                label="Delete"
                onClick={handleDelete}
                color="#f00"
            />
        </BaseMenu>
    );
};

export default TableMenu;
