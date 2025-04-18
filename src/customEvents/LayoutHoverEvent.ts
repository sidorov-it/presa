interface LayoutHoverEventDetail {
    layoutId: string;
    isHovered: boolean;
}

export class LayoutHoverEvent extends CustomEvent<LayoutHoverEventDetail> {
    constructor(detail: LayoutHoverEventDetail) {
        super('layoutHover', { detail, bubbles: true });
    }
}

// Augment the global WindowEventMap to include our custom event
declare global {
    interface WindowEventMap {
        'layoutHover': LayoutHoverEvent;
    }
} 