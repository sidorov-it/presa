import React, { useState, useRef, useEffect, useCallback, MutableRefObject, useMemo } from 'react';
import { BiBold, BiItalic, BiUnderline, BiX, BiArrowToTop, BiArrowToBottom } from 'react-icons/bi';
import bubbleStyles from '@/components/tiptap/BubbleMenu.module.css';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import HeadingSelector from '@/components/settings/HeadingSelector/HeadingSelector';
import { useUIStateStore } from '@/store/uiStateStore';
import { TipTapRefs } from '@/types';
import { MenuItem } from '../BaseMenu';
import { useShallow } from 'zustand/react/shallow';
import isEditorPropertyConsistent from '@/utils/isEditorPropertyConsistent';
import DeleteIcon from '@/components/icons/DeleteIcon';
import { useHistoryStore } from '@/store/historyStore';
interface RowTableMenuProps {
    elementId?: string;
    tableRowIndex?: number;
    tiptapRefs: MutableRefObject<TipTapRefs>;
    presentationId: string;
}

const RowTableMenu: React.FC<RowTableMenuProps> = ({ tableRowIndex, presentationId, tiptapRefs }) => {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);

    const tableRowElements = useUIStateStore(useShallow(state => state.getTableRowElements()));
    const currentHeadingLevel = useUIStateStore(useShallow(state => state.getCommonRowHeadingLevel(tiptapRefs) || 0));

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
            useHistoryStore.getState().beginTransaction(presentationId, 'Change font size');

            tableRowElements.forEach(element => {
                tiptapRefs.current.editors[element.id]?.editor
                    .chain()
                    .setMeta('transaction', true)
                    .focus(null, { scrollIntoView: false })
                    .selectAll()
                    .setFontSize(level)
                    .blur()
                    .run();
            });
            useHistoryStore.getState().commitTransaction(presentationId);
            setLocalHeadingLevel(level);
        },
        [tableRowElements, tiptapRefs, presentationId]
    );

    const handleToggleBold = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Toggle bold');

        tableRowElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isBoldActive) {
                    editor
                        .chain()
                        .setMeta('transaction', true)
                        .focus(null, { scrollIntoView: false })
                        .selectAll()
                        .unsetBold()
                        .blur()
                        .run();
                } else {
                    editor
                        .chain()
                        .setMeta('transaction', true)
                        .focus(null, { scrollIntoView: false })
                        .selectAll()
                        .setBold()
                        .blur()
                        .run();
                }
            }
        });
        useHistoryStore.getState().commitTransaction(presentationId);
    }, [tableRowElements, tiptapRefs, isBoldActive, presentationId]);

    const handleToggleItalic = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Toggle italic');

        tableRowElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isItalicActive) {
                    editor
                        .chain()
                        .setMeta('transaction', true)
                        .focus(null, { scrollIntoView: false })
                        .selectAll()
                        .unsetItalic()
                        .blur()
                        .run();
                } else {
                    editor
                        .chain()
                        .setMeta('transaction', true)
                        .focus(null, { scrollIntoView: false })
                        .selectAll()
                        .setItalic()
                        .blur()
                        .run();
                }
            }
        });
        useHistoryStore.getState().commitTransaction(presentationId);
    }, [tableRowElements, tiptapRefs, isItalicActive, presentationId]);

    const handleToggleUnderline = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Toggle underline');

        tableRowElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                if (isUnderlineActive) {
                    editor
                        .chain()
                        .setMeta('transaction', true)
                        .focus(null, { scrollIntoView: false })
                        .selectAll()
                        .unsetUnderline()
                        .blur()
                        .run();
                } else {
                    editor
                        .chain()
                        .setMeta('transaction', true)
                        .focus(null, { scrollIntoView: false })
                        .selectAll()
                        .setUnderline()
                        .blur()
                        .run();
                }
            }
        });
        useHistoryStore.getState().commitTransaction(presentationId);
    }, [tableRowElements, tiptapRefs, isUnderlineActive, presentationId]);

    const handleClearStyles = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Clear styles');

        tableRowElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                editor.chain().setMeta('transaction', true).clearNodes().unsetAllMarks().run();
            }
        });
        useHistoryStore.getState().commitTransaction(presentationId);
    }, [tableRowElements, tiptapRefs, presentationId]);

    // Table row operations
    const handleAddRowAbove = useCallback(() => {
        if (Number.isInteger(tableRowIndex)) {
            useUIStateStore.getState().addRowToTable(tableRowIndex!);
            useUIStateStore.getState().closeContextMenu();
        }
    }, [tableRowIndex]);

    const handleAddRowBelow = useCallback(() => {
        if (Number.isInteger(tableRowIndex)) {
            useUIStateStore.getState().addRowToTable(tableRowIndex! + 1);
            useUIStateStore.getState().closeContextMenu();
        }
    }, [tableRowIndex]);

    const handleDeleteRow = useCallback(() => {
        if (Number.isInteger(tableRowIndex)) {
            useUIStateStore.getState().deleteRowFromTable(tableRowIndex!);
            useUIStateStore.getState().closeContextMenu();
        }
    }, [tableRowIndex]);

    const handleColorReset = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Reset color');

        tableRowElements.forEach(element => {
            tiptapRefs.current.editors[element.id]?.editor
                .chain()
                .setMeta('transaction', true)
                .focus(null, { scrollIntoView: false })
                .selectAll()
                .unsetColor()
                .blur()
                .run();
        });
        useHistoryStore.getState().commitTransaction(presentationId);
    }, [tableRowElements, tiptapRefs, presentationId]);

    const handleColorChange = useCallback(
        (color: string) => {
            useHistoryStore.getState().beginTransaction(presentationId, 'Change color');
            tableRowElements.forEach(element => {
                tiptapRefs.current.editors[element.id]?.editor
                    .chain()
                    .setMeta('transaction', true)
                    .focus(null, { scrollIntoView: false })
                    .selectAll()
                    .setColor(color)
                    .blur()
                    .run();
            });
            useHistoryStore.getState().commitTransaction(presentationId);
        },
        [presentationId, tableRowElements, tiptapRefs]
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
            <ColorPicker
                onColorChange={handleColorChange}
                className={bubbleStyles.button}
                isShowResetColor={true}
                onColorReset={handleColorReset}
            />

            <MenuItem icon={<BiBold />} label="Жирный" onClick={handleToggleBold} active={isBoldActive} />
            <MenuItem icon={<BiItalic />} label="Курсив" onClick={handleToggleItalic} active={isItalicActive} />
            <MenuItem
                icon={<BiUnderline />}
                label="Подчеркнутый"
                onClick={handleToggleUnderline}
                active={isUnderlineActive}
            />
            <MenuItem icon={<BiX />} label="Очистить форматирование" onClick={handleClearStyles} />
            <MenuItem icon={<BiArrowToTop />} label="Добавить строку выше" onClick={handleAddRowAbove} />
            <MenuItem icon={<BiArrowToBottom />} label="Добавить строку ниже" onClick={handleAddRowBelow} />
            <MenuItem icon={<DeleteIcon />} label="Удалить строку" onClick={handleDeleteRow} color="#f00" />
        </>
    );
};

export default RowTableMenu;
