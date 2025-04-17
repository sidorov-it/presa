import { FaRegImage } from "react-icons/fa6";
import { FiUpload, FiLink2, FiZap, FiX, FiCheck } from "react-icons/fi";
import React, { ChangeEvent, useRef, useState, useEffect } from "react";

export type ImagePlaceholderProps = {
    onUpload: (file: File) => void;
    onLink: (url: string) => void;
    onGenerate: () => void;
};

export const ImagePlaceholder = ({ onUpload, onLink, onGenerate }: ImagePlaceholderProps) => {
    const [showLinkPopup, setShowLinkPopup] = useState(false);
    const [linkValue, setLinkValue] = useState("");
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const linkBtnRef = useRef<HTMLButtonElement>(null);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onUpload(event.target.files[0]);
        }
    };

    const handleKeyDown = (callback: () => void) => (event: React.KeyboardEvent<HTMLButtonElement | HTMLLabelElement>) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            callback();
        }
    };

    // Открыть попап и сфокусировать инпут
    const handleOpenLinkPopup = () => {
        setShowLinkPopup(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    // Закрыть попап
    const handleClosePopup = () => {
        setShowLinkPopup(false);
        setLinkValue("");
        setError("");
    };

    // Клик вне попапа
    useEffect(() => {
        if (!showLinkPopup) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(e.target as Node) &&
                linkBtnRef.current &&
                !linkBtnRef.current.contains(e.target as Node)
            ) {
                handleClosePopup();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showLinkPopup]);

    // Esc для закрытия
    useEffect(() => {
        if (!showLinkPopup) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClosePopup();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [showLinkPopup]);

    // Вставить ссылку
    const handleInsertLink = () => {
        if (!linkValue.trim()) {
            setError("Введите ссылку");
            return;
        }
        if (!/^https?:\/\//.test(linkValue.trim())) {
            setError("Ссылка должна начинаться с http:// или https://");
            return;
        }
        onLink(linkValue.trim());
        handleClosePopup();
    };

    // Enter в инпуте
    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleInsertLink();
        }
        if (e.key === "Escape") {
            handleClosePopup();
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 relative">
            <FaRegImage className="text-6xl text-gray-300 mb-6" aria-label="Пустое изображение" />
            <div className="flex gap-4 relative">
                {/* Загрузить */}
                <label
                    tabIndex={0}
                    aria-label="Загрузить изображение"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 cursor-pointer transition hover:bg-blue-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onKeyDown={handleKeyDown(() => document.getElementById('image-upload-input')?.click())}
                >
                    <FiUpload className="text-xl text-gray-500" />
                    <input
                        id="image-upload-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                        tabIndex={-1}
                    />
                </label>
                {/* Вставить ссылку */}
                <button
                    type="button"
                    tabIndex={0}
                    aria-label="Вставить ссылку на изображение"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 transition hover:bg-green-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-green-400"
                    onClick={handleOpenLinkPopup}
                    onKeyDown={handleKeyDown(handleOpenLinkPopup)}
                    ref={linkBtnRef}
                >
                    <FiLink2 className="text-xl text-gray-500" />
                </button>
                {/* Сгенерировать */}
                <button
                    type="button"
                    tabIndex={0}
                    aria-label="Сгенерировать изображение"
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm border border-gray-200 transition hover:bg-purple-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-purple-400"
                    onClick={onGenerate}
                    onKeyDown={handleKeyDown(onGenerate)}
                >
                    <FiZap className="text-xl text-gray-500" />
                </button>
                {/* Dropdown-попап для ссылки */}
                {showLinkPopup && (
                    <div
                        ref={popupRef}
                        className="absolute left-1/2 top-12 -translate-x-1/2 z-20 bg-white rounded-xl shadow-xl p-4 flex flex-col gap-3 min-w-[260px] border border-gray-200"
                        style={{ minWidth: 260 }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <button
                            type="button"
                            aria-label="Закрыть"
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            onClick={handleClosePopup}
                        >
                            <FiX className="text-lg text-gray-400" />
                        </button>
                        <div className="text-gray-700 font-medium mb-1">Вставьте ссылку на изображение</div>
                        <input
                            ref={inputRef}
                            type="url"
                            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            placeholder="https://example.com/image.png"
                            value={linkValue}
                            onChange={e => { setLinkValue(e.target.value); setError(""); }}
                            onKeyDown={handleInputKeyDown}
                            aria-label="Ссылка на изображение"
                        />
                        {error && <div className="text-red-500 text-sm -mt-2">{error}</div>}
                        <button
                            type="button"
                            className="mt-1 w-full flex items-center justify-center gap-2 bg-blue-500 text-white rounded py-2 font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                            onClick={handleInsertLink}
                            disabled={!linkValue.trim()}
                        >
                            <FiCheck className="text-lg" />
                            Вставить
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};