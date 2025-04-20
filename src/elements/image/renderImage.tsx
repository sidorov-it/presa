import React from 'react';
import { Image } from './index';
import { ImageElement } from '@/types';

export const renderImageElement = (element: ImageElement, props: any = {}) => {
    return <Image element={element} {...props} alt={element.alt || ''} />;
};

export default renderImageElement;
