import React, { useState, useEffect, useRef } from 'react';
import { HexAlphaColorPicker } from 'react-colorful';
import { usePresentationStore } from '@/store/presentationStore';
import { useShallow } from 'zustand/react/shallow';
import { ColorPicker } from '@/components/tiptap/ColorPicker';

interface BackgroundSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    presentationId: string;
}

const BackgroundSettingsModal: React.FC<BackgroundSettingsModalProps> = ({ isOpen, onClose, presentationId }) => {
    const initialSettings = usePresentationStore(useShallow(state => state.getBackgroundSettings(presentationId)));

    const [backgroundColor, setBackgroundColor] = useState<string>(initialSettings.backgroundColor || '#ffffff00');
    const [backgroundImage, setBackgroundImage] = useState<string>(initialSettings.backgroundImage || '');

    // Фокус-ловушка
    const modalRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                modalRef.current?.focus();
            }, 0);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setBackgroundColor(initialSettings.backgroundColor || '#ffffff00');
            setBackgroundImage(initialSettings.backgroundImage || '');
        }
    }, [isOpen, initialSettings]);

    const handleSave = () => {
        usePresentationStore.getState().setBackgroundSettings(presentationId, {
            backgroundColor,
            backgroundImage: backgroundImage.trim() || undefined,
        });
        onClose();
    };

    const handleReset = () => {
        setBackgroundColor('#ffffff00');
        setBackgroundImage('');
        usePresentationStore.getState().setBackgroundSettings(presentationId, {
            backgroundColor: undefined,
            backgroundImage: undefined,
        });
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
            tabIndex={-1}
            aria-modal="true"
            role="dialog"
            onKeyDown={handleKeyDown}
        >
            {/* Backdrop */}
            <div className="absolute inset-0" onClick={onClose} aria-label="Закрыть модалку" tabIndex={0} />
            {/* Modal content */}
            <div
                ref={modalRef}
                className="relative z-10 bg-white rounded-xl shadow-xl p-6 w-full max-w-md focus:outline-none"
                tabIndex={0}
                aria-label="Настройки фона презентации"
            >
                <h2 className="text-lg font-semibold mb-4">Настройки фона</h2>
                <div className="flex justify-between items-center mb-6">
                    <label className="block text-sm font-medium mb-2" htmlFor="color-picker">
                        Цвет фона
                    </label>
                    <ColorPicker
                        onColorChange={setBackgroundColor}
                        initialColor={backgroundColor}
                        mode="card"
                        label="Выбрать цвет фона"
                        className="w-full"
                    />
                    {/* <HexAlphaColorPicker
                        color={backgroundColor}
                        onChange={setBackgroundColor}
                        id="color-picker"
                        aria-label="Выбор цвета фона"
                        className="mb-2 w-full h-32"
                    /> */}
                    {/* <input
                        type="text"
                        className="mt-2 w-full border rounded px-2 py-1 text-sm"
                        value={backgroundColor}
                        onChange={e => setBackgroundColor(e.target.value)}
                        aria-label="HEX цвет с alpha"
                    /> */}
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2" htmlFor="bg-image-url">
                        Ссылка на изображение (URL)
                    </label>
                    <input
                        id="bg-image-url"
                        type="url"
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={backgroundImage}
                        onChange={e => setBackgroundImage(e.target.value)}
                        placeholder="https://example.com/image.png"
                        aria-label="Ссылка на изображение для фона"
                    />
                </div>
                <div className="flex justify-between gap-2 mt-6">
                    <button
                        type="button"
                        className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none"
                        onClick={handleReset}
                        aria-label="Сбросить фон"
                    >
                        Сбросить
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 focus:outline-none"
                        onClick={handleSave}
                        aria-label="Сохранить фон"
                    >
                        Сохранить
                    </button>
                </div>
                <button
                    type="button"
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={onClose}
                    aria-label="Закрыть модалку"
                >
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default BackgroundSettingsModal; 