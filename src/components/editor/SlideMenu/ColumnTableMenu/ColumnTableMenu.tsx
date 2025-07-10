import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { BiBold, BiItalic, BiUnderline, BiX, BiArrowToLeft, BiArrowToRight } from 'react-icons/bi';
import { useUIStateStore } from '@/store/uiStateStore';
import { TipTapRefs } from '@/types';
import { MutableRefObject } from 'react';
import { MenuItem } from '../BaseMenu';
import HeadingSelector from '@/components/settings/HeadingSelector/HeadingSelector';
import { useShallow } from 'zustand/react/shallow';
import isEditorPropertyConsistent from '@/utils/isEditorPropertyConsistent';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import bubbleStyles from '@/components/tiptap/BubbleMenu.module.css';
import DeleteIcon from '@/components/icons/DeleteIcon';
import { useHistoryStore } from '@/store/historyStore';
interface ColumnTableMenuProps {
    elementId?: string;
    presentationId: string;
    tableColumnIndex?: number;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const ColumnTableMenu: React.FC<ColumnTableMenuProps> = ({ tableColumnIndex, presentationId, tiptapRefs }) => {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);

    const tableColumnElements = useUIStateStore(useShallow(state => state.getTableColumnElements()));
    const currentHeadingLevel = useUIStateStore(state => state.getCommonColumnHeadingLevel(tiptapRefs));

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
        () => isEditorPropertyConsistent(tableColumnElements, tiptapRefs, 'bold'),
        [tableColumnElements, tiptapRefs]
    );
    const isItalicActive = useMemo(
        () => isEditorPropertyConsistent(tableColumnElements, tiptapRefs, 'italic'),
        [tableColumnElements, tiptapRefs]
    );
    const isUnderlineActive = useMemo(
        () => isEditorPropertyConsistent(tableColumnElements, tiptapRefs, 'underline'),
        [tableColumnElements, tiptapRefs]
    );

    const handleToggleBold = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Toggle bold');

        tableColumnElements.forEach(element => {
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
    }, [tableColumnElements, tiptapRefs, isBoldActive, presentationId]);

    const handleToggleItalic = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Toggle italic');

        tableColumnElements.forEach(element => {
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
    }, [tableColumnElements, tiptapRefs, isItalicActive, presentationId]);

    const handleToggleUnderline = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Toggle underline');

        tableColumnElements.forEach(element => {
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
    }, [tableColumnElements, tiptapRefs, isUnderlineActive, presentationId]);

    const handleClearStyles = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Clear styles');

        tableColumnElements.forEach(element => {
            const editor = tiptapRefs.current.editors[element.id]?.editor;
            if (editor) {
                editor.chain().setMeta('transaction', true).clearNodes().unsetAllMarks().run();
            }
        });
        useHistoryStore.getState().commitTransaction(presentationId);
    }, [tableColumnElements, tiptapRefs, presentationId]);

    const handleAddColumnLeft = useCallback(() => {
        if (Number.isInteger(tableColumnIndex)) {
            useUIStateStore.getState().addColumnToTable(tableColumnIndex!);
            useUIStateStore.getState().closeContextMenu();
        }
    }, [tableColumnIndex]);

    const handleAddColumnRight = useCallback(() => {
        if (Number.isInteger(tableColumnIndex)) {
            useUIStateStore.getState().addColumnToTable(tableColumnIndex! + 1);
            useUIStateStore.getState().closeContextMenu();
        }
    }, [tableColumnIndex]);

    const handleDeleteColumn = useCallback(() => {
        if (Number.isInteger(tableColumnIndex)) {
            useUIStateStore.getState().deleteColumnFromTable(tableColumnIndex!);
            useUIStateStore.getState().closeContextMenu();
        }
    }, [tableColumnIndex]);

    const handleColorReset = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Reset color');

        tableColumnElements.forEach(element => {
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
    }, [tableColumnElements, tiptapRefs, presentationId]);

    const handleColorChange = useCallback(
        (color: string) => {
            useHistoryStore.getState().beginTransaction(presentationId, 'Change font size');

            tableColumnElements.forEach(element => {
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
        [tableColumnElements, tiptapRefs, presentationId]
    );

    const handleHeadingChange = useCallback(
        (level: number) => {
            useHistoryStore.getState().beginTransaction(presentationId, 'Change font size');

            tableColumnElements.forEach(element => {
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
        [tableColumnElements, tiptapRefs, presentationId]
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

            {/* <ColorPicker
                editors={tableColumnElements.map(element => tiptapRefs.current.editors[element.id]?.editor)}
                className={bubbleStyles.button}
            /> */}
            <MenuItem icon={<BiBold />} label="Жирный" onClick={handleToggleBold} active={isBoldActive} />
            <MenuItem icon={<BiItalic />} label="Курсив" onClick={handleToggleItalic} active={isItalicActive} />
            <MenuItem
                icon={<BiUnderline />}
                label="Подчеркнутый"
                onClick={handleToggleUnderline}
                active={isUnderlineActive}
            />
            <MenuItem icon={<BiX />} label="Очистить форматирование" onClick={handleClearStyles} />
            <MenuItem icon={<BiArrowToLeft />} label="Добавить столбец слева" onClick={handleAddColumnLeft} />
            <MenuItem icon={<BiArrowToRight />} label="Добавить столбец справа" onClick={handleAddColumnRight} />
            <MenuItem icon={<DeleteIcon />} label="Удалить столбец" onClick={handleDeleteColumn} color="#f00" />
        </>
    );
};

export default ColumnTableMenu;
