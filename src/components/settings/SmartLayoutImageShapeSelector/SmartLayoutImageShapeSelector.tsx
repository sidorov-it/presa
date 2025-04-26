'use client';
import React, { useState, useRef, useEffect } from 'react';
import { ImageShape } from '@/types';
import { BsSquare, BsCircle, BsChevronDown } from 'react-icons/bs';
import { CgDisplayFullwidth } from 'react-icons/cg';
import { BiRectangle } from 'react-icons/bi';
import styles from '../../../elements/smartLayout/components/SmartLayoutSettings/SmartLayoutSettings.module.css';

interface SmartLayoutImageShapeSelectorProps {
    imageShape: ImageShape;
    setImageShape: (shape: ImageShape) => void;
}

const SmartLayoutImageShapeSelector: React.FC<SmartLayoutImageShapeSelectorProps> = ({
    imageShape,
    setImageShape,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const shapes = [
        { id: 'square', label: 'Square', icon: BsSquare },
        { id: 'circle', label: 'Circle', icon: BsCircle },
        { id: 'landscape', label: 'Landscape', icon: CgDisplayFullwidth },
        { id: 'portrait', label: 'Portrait', icon: BiRectangle },
    ] as const;

    const currentShape = shapes.find(shape => shape.id === imageShape) || shapes[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (shape: typeof shapes[number]) => {
        setImageShape(shape.id as ImageShape);
        setIsOpen(false);
    };

    return (
        <div className={styles.shapeSelect} ref={dropdownRef}>
            <button
                className={styles.shapeButton}
                onClick={() => setIsOpen(!isOpen)}
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <span className={styles.shapeIcon}>
                    <currentShape.icon size={18} />
                </span>
                <span className={styles.shapeLabel}>{currentShape.label}</span>
                <BsChevronDown className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
            </button>

            {isOpen && (
                <div className={styles.shapeDropdown}>
                    {shapes.map(shape => (
                        <button
                            key={shape.id}
                            className={`${styles.shapeOption} ${imageShape === shape.id ? styles.selected : ''}`}
                            onClick={() => handleSelect(shape)}
                            aria-label={`Select ${shape.label} shape`}
                        >
                            <span className={styles.shapeIcon}>
                                <shape.icon size={18} />
                            </span>
                            <span className={styles.shapeLabel}>{shape.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SmartLayoutImageShapeSelector;
