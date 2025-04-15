import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './SlideEditor/SlideEditor.module.css';
import { useTheme } from '@/components/providers/ThemeProvider';
import SlideTemplateSelector from './SlideTemplateSelector';

interface TemplateButtonProps {
    presentationId: string;
    slideId: string;
    className?: string;
    isHovered: boolean;
    isSelected: boolean;
}

const TemplateButton: React.FC<TemplateButtonProps> = ({
    presentationId,
    slideId,
    className = '',
    isHovered,
    isSelected
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { isDarkMode } = useTheme();
    const popupRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    // Show button animation
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 10);

        return () => clearTimeout(timer);
    }, []);

    // Handle click outside to close popup
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current && 
                buttonRef.current && 
                !popupRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
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

    const buttonStyle: React.CSSProperties = {
        position: 'absolute',
        zIndex: 20,
        borderRadius: '3px',
        width: '25px',
        height: '25px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: isDarkMode ? '1px solid white' : '1px solid #666',
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'white',
        color: isDarkMode ? 'white' : '#333',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
    };

    const popupStyle: React.CSSProperties = {
        position: 'absolute',
        top: '30px',
        left: '0',
        zIndex: 1000,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '12px',
        minWidth: '250px',
        display: isOpen ? 'block' : 'none',
    };

    return (
        <>
            {(isHovered || isSelected || isOpen) && (
                <div
                    ref={buttonRef}
                    className={`${styles.templateButton} ${className}`}
                    style={buttonStyle}
                    onClick={handleClick}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleClick(e as unknown as React.MouseEvent<HTMLDivElement>);
                        }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Template Settings"
                    title="Template Settings"
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
                <div ref={popupRef} style={popupStyle}>
                    <SlideTemplateSelector 
                        presentationId={presentationId} 
                        slideId={slideId} 
                    />
                </div>
            )}
        </>
    );
};

export default TemplateButton; 