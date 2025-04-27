'use client';
import React from 'react';
import { ImageShape } from '@/types';
import { BsSquare, BsCircle } from 'react-icons/bs';
import { CgDisplayFullwidth } from 'react-icons/cg';
import { BiRectangle } from 'react-icons/bi';
import SettingsSelector from '@/components/ui/SettingsSelector/SettingsSelector';

interface SmartLayoutImageShapeSelectorProps {
    imageShape: ImageShape;
    setImageShape: (shape: ImageShape) => void;
}

const SmartLayoutImageShapeSelector: React.FC<SmartLayoutImageShapeSelectorProps> = ({ imageShape, setImageShape }) => {
    const shapes = [
        { id: 'square', label: 'Square', Icon: BsSquare },
        { id: 'circle', label: 'Circle', Icon: BsCircle },
        { id: 'landscape', label: 'Landscape', Icon: CgDisplayFullwidth },
        { id: 'portrait', label: 'Portrait', Icon: BiRectangle },
    ];

    const handleSelect = (shape: string) => {
        setImageShape(shape as ImageShape);
    };

    return <SettingsSelector value={imageShape} setValue={handleSelect} options={shapes} />;
};

export default SmartLayoutImageShapeSelector;
