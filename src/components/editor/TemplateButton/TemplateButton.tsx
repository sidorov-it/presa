import React, { useState, useRef, useEffect, useCallback, MutableRefObject } from 'react';
import SlideTemplateSelector from '../SlideTemplateSelector/SlideTemplateSelector';
import styles from './TemplateButton.module.css';
import { TipTapRefs } from '@/types';

interface TemplateButtonProps {
    presentationId: string;
    slideId: string;
    className?: string;
    isShowed: boolean;
    tiptapRefs: MutableRefObject<TipTapRefs>;
}

const TemplateButton: React.FC<TemplateButtonProps> = ({
    presentationId,
    slideId,
    className = '',
    tiptapRefs,
    isShowed,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close popup
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                buttonRef.current &&
                !popupRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node) &&
                !(event.target as HTMLElement)?.closest('[data-scope="popover"]')
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        setIsOpen(prev => !prev);
    }, []);

    return (
        <>
            {(isShowed || isOpen) && (
                <div
                    ref={buttonRef}
                    className={`${styles.templateButton} ${isOpen ? styles.templateButtonOpen : ''} ${className}`}
                    onClick={handleClick}
                    onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Настройки шаблона"
                    title="Настройки шаблона"
                    data-template-button={slideId}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="9" y1="21" x2="9" y2="9"></line>
                    </svg>
                </div>
            )}

            {isOpen && (
                <div ref={popupRef} style={{ display: isOpen ? 'block' : 'none' }} className={styles.popup}>
                    <SlideTemplateSelector presentationId={presentationId} slideId={slideId} tiptapRefs={tiptapRefs} />
                </div>
            )}
        </>
    );
};

export default TemplateButton;
