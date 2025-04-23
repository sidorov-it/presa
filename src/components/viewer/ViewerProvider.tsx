import React from 'react';
import './ViewerStyles.css';

interface ViewerProviderProps {
    children: React.ReactNode;
}

/**
 * ViewerProvider component that loads required styles and provides context
 * for viewer components. Wrap your viewer components with this provider
 * to ensure all styles are properly applied.
 */
const ViewerProvider: React.FC<ViewerProviderProps> = ({ children }) => {
    return <div className="presentation-viewer-provider">{children}</div>;
};

export default ViewerProvider;
