import React, { useState, useRef, useEffect, useCallback, MutableRefObject, useMemo } from 'react';
import {
    BiBold,
    BiItalic,
    BiUnderline,
    BiX,
    BiArrowToTop,
    BiArrowToBottom,
    BiTrash
} from 'react-icons/bi';
import { useMenuStore } from '@/store/menuStore';
import { TipTapRefs } from '@/types';
import { BaseMenu, MenuItem } from '../BaseMenu';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import HeadingSelector from '@/components/settings/HeadingSelector/HeadingSelector';

interface TableMenuProps {
    slideId?: string;
    layoutId?: string;
    elementId?: string;
    presentationId?: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
    position: { x: number, y: number; rect?: DOMRect };
}

const TableMenu: React.FC<TableMenuProps> = ({
    slideId,
    layoutId,
    presentationId,
    tiptapRefs,
    position
}) => {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);

    const tableFirstElement = useMenuStore.getState().getTableFirstElement();
    const [headingLevelLocal, setHeadingLevelLocal] = useState<number>(
        tableFirstElement?.id ? tiptapRefs.current.editors[tableFirstElement?.id]?.editor.getAttributes('heading').level : 0
    );

    useEffect(() => {
        const editor = tableFirstElement?.id ? tiptapRefs.current.editors[tableFirstElement?.id]?.editor : null;
        if (editor && !editor.isEmpty) {
            setHeadingLevelLocal(editor.getAttributes('heading').level || 0);
        } else {
            setHeadingLevelLocal(0);
        }
    }, [tableFirstElement, tiptapRefs]);

    const isBoldActive = useMemo(() => {
        return tableFirstElement?.id ? tiptapRefs.current.editors[tableFirstElement?.id]?.editor.isActive('bold') : false;
    }, [tableFirstElement]);

    const isItalicActive = useMemo(() => {
        return tableFirstElement?.id ? tiptapRefs.current.editors[tableFirstElement?.id]?.editor.isActive('italic') : false;
    }, [tableFirstElement]);

    const isUnderlineActive = useMemo(() => {
        return tableFirstElement?.id ? tiptapRefs.current.editors[tableFirstElement?.id]?.editor.isActive('underline') : false;
    }, [tableFirstElement]);

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

    const handleToggleBold = useCallback(() => {
        if (tableFirstElement?.id) {
            const editor = tiptapRefs.current.editors[tableFirstElement?.id]?.editor;
            if (editor) {
                editor.chain().focus(null, { scrollIntoView: false }).selectAll().toggleBold().blur().run();
            }
        }
    }, [tableFirstElement, tiptapRefs]);

    const handleToggleItalic = useCallback(() => {
        if (tableFirstElement?.id) {
            const editor = tiptapRefs.current.editors[tableFirstElement?.id]?.editor;
            if (editor) {
                editor.chain().focus(null, { scrollIntoView: false }).selectAll().toggleItalic().blur().run();
            }
        }
    }, [tableFirstElement, tiptapRefs]);

    const handleToggleUnderline = useCallback(() => {
        if (tableFirstElement?.id) {
            const editor = tiptapRefs.current.editors[tableFirstElement?.id]?.editor;
            if (editor) {
                editor.chain().focus(null, { scrollIntoView: false }).selectAll().toggleUnderline().blur().run();
            }
        }
    }, [tableFirstElement, tiptapRefs]);

    const handleClearStyles = useCallback(() => {
        if (tableFirstElement?.id) {
            tiptapRefs.current.editors[tableFirstElement?.id]?.editor.chain().clearNodes().unsetAllMarks().run();
        }
    }, [tableFirstElement, tiptapRefs]);

    return (
        <BaseMenu position={position}>
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
        </BaseMenu>
    );
};

export default TableMenu;
