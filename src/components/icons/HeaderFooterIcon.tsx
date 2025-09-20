import React from 'react';

const HeaderFooterIcon: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            {/* Header area */}
            <rect x="5" y="6" width="14" height="2" rx="1" fill="currentColor" />
            {/* Footer area */}
            <rect x="5" y="16" width="14" height="2" rx="1" fill="currentColor" />
            {/* Content area indication */}
            <rect
                x="5"
                y="10"
                width="14"
                height="4"
                rx="1"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
                strokeDasharray="2,2"
            />
        </svg>
    );
};

export default HeaderFooterIcon;
