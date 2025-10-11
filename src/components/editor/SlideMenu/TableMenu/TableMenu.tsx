import React, { useState, useRef, useEffect, useCallback, MutableRefObject } from 'react';
import { BiBold, BiItalic, BiUnderline, BiX } from 'react-icons/bi';
import { PiEquals } from 'react-icons/pi';

import { useSelectedState, useUIStateStore } from '@/store/uiStateStore';
import { TipTapRefs } from '@/types';
import { BaseMenu, MenuItem } from '../BaseMenu';
import { ColorPicker } from '@/components/tiptap/ColorPicker';
import HeadingSelector from '@/components/settings/HeadingSelector/HeadingSelector';
import { useShallow } from 'zustand/react/shallow';
import isEditorPropertyConsistent from '@/utils/isEditorPropertyConsistent';

import bubbleStyles from '@/components/tiptap/BubbleMenu.module.css';
import { DeleteIcon } from '@/components/icons';
import { useHistoryStore } from '@/store/historyStore';
import { usePresentationStore } from '@/store/presentationStore';
import { NORMAL_TEXT_LEVEL } from '@/constants/consts';

interface TableMenuProps {
    presentationId: string;
    tiptapRefs: MutableRefObject<TipTapRefs>;
    position: { x: number; y: number; rect?: DOMRect };
}

const TableMenu: React.FC<TableMenuProps> = ({ tiptapRefs, presentationId, position }) => {
    const [isHeadingMenuOpen, setIsHeadingMenuOpen] = useState(false);
    const headingMenuRef = useRef<HTMLDivElement>(null);

    const selectedState = useSelectedState();
    const tableElements = usePresentationStore(
        useShallow(state =>
            state.getTableElements(
                selectedState.presentationId!,
                selectedState.selectedSlideId!,
                selectedState.selectedLayoutId!
            )
        )
    );
    const currentHeadingLevel = usePresentationStore(
        useShallow(
            state =>
                state.getCommonTableHeadingLevel(
                    tiptapRefs,
                    selectedState.presentationId!,
                    selectedState.selectedSlideId!,
                    selectedState.selectedLayoutId!
                ) || 0
        )
    );

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

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            // Don't hide if clicking on the editor or the bubble menu itself
            const target = e.target as HTMLElement;
            if (target.closest('.layout-menu')) {
                return;
            }
            useUIStateStore.getState().closeContextMenu();
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

    const handleHeadingChange = useCallback(
        (level: number) => {
            useHistoryStore.getState().beginTransaction(presentationId, 'Change font size');
            tableElements.forEach(element => {
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
        [tableElements, tiptapRefs, presentationId]
    );

    const handleToggleBold = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Toggle bold');
        tableElements.forEach(element => {
            if (isBoldActive) {
                tiptapRefs.current.editors[element.id]?.editor
                    .chain()
                    .setMeta('transaction', true)
                    .focus(null, { scrollIntoView: false })
                    .selectAll()
                    .unsetBold()
                    .blur()
                    .run();
            } else {
                tiptapRefs.current.editors[element.id]?.editor
                    .chain()
                    .focus(null, { scrollIntoView: false })
                    .selectAll()
                    .setBold()
                    .blur()
                    .run();
            }
        });
        useHistoryStore.getState().commitTransaction(presentationId);
    }, [tableElements, tiptapRefs, isBoldActive, presentationId]);

    const handleToggleItalic = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Toggle italic');
        tableElements.forEach(element => {
            if (isItalicActive) {
                tiptapRefs.current.editors[element.id]?.editor
                    .chain()
                    .setMeta('transaction', true)
                    .focus(null, { scrollIntoView: false })
                    .selectAll()
                    .unsetItalic()
                    .blur()
                    .run();
            } else {
                tiptapRefs.current.editors[element.id]?.editor
                    .chain()
                    .setMeta('transaction', true)
                    .focus(null, { scrollIntoView: false })
                    .selectAll()
                    .setItalic()
                    .blur()
                    .run();
            }
        });
        useHistoryStore.getState().commitTransaction(presentationId);
    }, [tableElements, tiptapRefs, isItalicActive, presentationId]);

    const handleToggleUnderline = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Toggle underline');
        tableElements.forEach(element => {
            if (isUnderlineActive) {
                tiptapRefs.current.editors[element.id]?.editor
                    .chain()
                    .setMeta('transaction', true)
                    .focus(null, { scrollIntoView: false })
                    .selectAll()
                    .unsetUnderline()
                    .blur()
                    .run();
            } else {
                tiptapRefs.current.editors[element.id]?.editor
                    .chain()
                    .setMeta('transaction', true)
                    .focus(null, { scrollIntoView: false })
                    .selectAll()
                    .setUnderline()
                    .blur()
                    .run();
            }
        });
        useHistoryStore.getState().commitTransaction(presentationId);
    }, [tableElements, tiptapRefs, isUnderlineActive, presentationId]);

    const handleClearStyles = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Clear styles');
        tableElements.forEach(element => {
            tiptapRefs.current.editors[element.id]?.editor
                .chain()
                .setMeta('transaction', true)
                .focus(null, { scrollIntoView: false })
                .selectAll()
                .unsetAllMarks()
                .setFontSize(NORMAL_TEXT_LEVEL)
                .run();
        });
        useHistoryStore.getState().commitTransaction(presentationId);
    }, [tableElements, tiptapRefs, presentationId]);

    const handleEqualize = useCallback(() => {
        usePresentationStore
            .getState()
            .equalizeTable(
                selectedState.presentationId!,
                selectedState.selectedSlideId!,
                selectedState.selectedLayoutId!
            );
    }, [selectedState.presentationId, selectedState.selectedSlideId, selectedState.selectedLayoutId]);

    const handleDelete = useCallback(() => {
        usePresentationStore
            .getState()
            .deleteLayout(
                selectedState.presentationId!,
                selectedState.selectedSlideId!,
                selectedState.selectedLayoutId!
            );
    }, [selectedState.presentationId, selectedState.selectedSlideId, selectedState.selectedLayoutId]);

    const handleColorReset = useCallback(() => {
        useHistoryStore.getState().beginTransaction(presentationId, 'Reset color');
        tableElements.forEach(element => {
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
    }, [tableElements, tiptapRefs, presentationId]);

    const handleColorChange = useCallback(
        (color: string) => {
            useHistoryStore.getState().beginTransaction(presentationId, 'Change color');
            tableElements.forEach(element => {
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
        [tableElements, tiptapRefs, presentationId]
    );

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

            <MenuItem icon={<PiEquals />} label="Выровнять" active={false} onClick={handleEqualize} />

            <MenuItem icon={<DeleteIcon />} label="Удалить" onClick={handleDelete} color="#f00" />
        </BaseMenu>
    );
};

export default TableMenu;
