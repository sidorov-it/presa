'use client'
import { useState, useEffect } from 'react'
import FillIcon from './FillIcon'
import BorderedIcon from './BorderedIcon'
import { usePresentationStore } from '@/store/presentationStore'
import { ElementMenuProps } from '@/types'
import { RefObject } from 'react'

interface ButtonMenuProps extends Omit<ElementMenuProps, 'columnId'> {
    columnId?: string;
    onUpdate: (key: string, value: any) => void;
    onDelete: () => void;
    nodeAttributes: Record<string, any>;
    ref?: RefObject<HTMLDivElement>;
}

export default function ButtonMenu({
    slideId,
    layoutId,
    elementId,
    presentationId,
    columnId,
    onUpdate,
    onDelete,
    nodeAttributes,
    ref
}: ButtonMenuProps) {
    const [color, setColor] = useState(nodeAttributes.color || '#3C3939')
    const { updateElement } = usePresentationStore()

    // Log important information on mount
    useEffect(() => {
        console.log('ButtonMenu mounted with ID:', {
            elementId,
            nodeElementId: nodeAttributes.elementId,
            slideId,
            layoutId,
            presentationId
        });
    }, [elementId, nodeAttributes.elementId, slideId, layoutId, presentationId]);

    // Используем локальное состояние для мгновенной обратной связи
    const handleChange = (key: string, value: any) => {
        if (key === 'color') {
            setColor(value);
        }
        
        // Обновляем атрибуты ноды через NodeView
        onUpdate(key, value);
        
        // Use the element ID from props or from node attributes as fallback
        const targetElementId = elementId || nodeAttributes.elementId;
        
        if (!targetElementId) {
            console.error('No element ID available for update in ButtonMenu');
            return;
        }
        
        // Обновляем состояние в store
        updateElement(presentationId, slideId, layoutId, targetElementId, { [key]: value });
    }

    const handleDelete = () => {
        onDelete();
    }

    // Для тестирования
    const handleTestClick = () => {
        // Use the element ID from props or from node attributes as fallback
        const targetElementId = elementId || nodeAttributes.elementId;
        
        console.log('Button Menu - Element Info:', {
            elementId,
            nodeElementId: nodeAttributes.elementId,
            targetElementId,
            slideId,
            layoutId,
            presentationId,
            nodeAttributes,
            storeElement: usePresentationStore.getState().getElement(presentationId, slideId, layoutId, targetElementId),
            allAttributes: nodeAttributes,
            color
        });
    }

    return (
        <div className="flex flex-col gap-4 p-3 w-[300px] bg-white rounded-md shadow-md border border-gray-200" ref={ref}>
            {/* Link Input */}
            <div className="w-full">
                <input
                    type="text"
                    value={nodeAttributes.link || ''}
                    onChange={(e) => handleChange('link', e.target.value)}
                    placeholder="Paste a link or search for a page"
                    className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm"
                />
            </div>

            {/* Test button */}
            <button
                data-element-id={elementId || nodeAttributes.elementId}
                onClick={handleTestClick}
                className="px-3 py-2 bg-gray-100 rounded"
            >
                Тест ({elementId || nodeAttributes.elementId || 'no-id'})
            </button>

            {/* Style Toggle */}
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-700">Стиль кнопки</span>
                <div className="flex bg-gray-100 rounded-md p-1 gap-1">
                    <button
                        onClick={() => handleChange('buttonStyle', 'filled')}
                        className={`px-3 py-1 rounded ${
                            nodeAttributes.buttonStyle === 'filled' ? 'bg-purple-100' : ''
                        }`}
                        aria-label="Стиль кнопки"
                    >
                        <FillIcon />
                    </button>
                    <button
                        onClick={() => handleChange('buttonStyle', 'outlined')}
                        className={`px-3 py-1 rounded ${
                            nodeAttributes.buttonStyle === 'outlined' ? 'bg-purple-100' : ''
                        }`}
                        aria-label="Стиль кнопки"
                    >
                        <BorderedIcon />
                    </button>
                </div>
            </div>

            {/* Horizontal Alignment */}
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-700">Выравнивание</span>
                <div className="flex bg-gray-100 rounded-md p-1 gap-1">
                    <button
                        onClick={() => handleChange('alignment', 'left')}
                        className={`px-3 py-1 rounded ${
                            nodeAttributes.alignment === 'left' ? 'bg-purple-100' : ''
                        }`}
                        aria-label="Выравнивание"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3h18v2H3V3zm0 8h12v2H3v-2zm0 8h18v2H3v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleChange('alignment', 'center')}
                        className={`px-3 py-1 rounded ${
                            nodeAttributes.alignment === 'center' ? 'bg-purple-100' : ''
                        }`}
                        aria-label="Выравнивание"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3h18v2H3V3zm3 8h12v2H6v-2zm-3 8h18v2H3v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleChange('alignment', 'right')}
                        className={`px-3 py-1 rounded ${
                            nodeAttributes.alignment === 'right' ? 'bg-purple-100' : ''
                        }`}
                        aria-label="Выравнивание"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M3 3h18v2H3V3zm6 8h12v2H9v-2zm-6 8h18v2H3v-2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Color Picker */}
            <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-700">Цвет</span>
                <div className="flex items-center bg-gray-100 rounded-md px-2 py-1">
                    <div
                        className="w-5 h-5 rounded mr-2"
                        style={{ backgroundColor: color }}
                    />
                    <input
                        type="text"
                        value={color}
                        onChange={(e) => handleChange('color', e.target.value)}
                        className="bg-transparent border-none text-sm w-20"
                        aria-label="Цвет"
                    />
                </div>
            </div>

            {/* Delete Button */}
            <button
                onClick={handleDelete}
                className="flex items-center justify-center w-full py-2 mt-2 text-red-500 hover:bg-red-50 rounded-md transition-colors text-red-600"
                aria-label="Удалить"
            >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                Удалить
            </button>
        </div>
    )
}