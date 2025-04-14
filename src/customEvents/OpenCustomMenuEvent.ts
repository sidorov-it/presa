interface OpenCustomMenuEventDetail {
    elementId: string;
    elementType: string;
}

export class OpenCustomMenuEvent extends CustomEvent<OpenCustomMenuEventDetail> {
    static readonly EVENT_NAME = 'open-custom-menu' as const;

    constructor(detail: OpenCustomMenuEventDetail) {
        super(OpenCustomMenuEvent.EVENT_NAME, {
            detail,
            bubbles: true,
            cancelable: true,
            composed: true, // Allows the event to cross shadow DOM boundaries
        });
    }

    // Helper method to dispatch the event
    static dispatch(detail: OpenCustomMenuEventDetail): void {
        document.dispatchEvent(new OpenCustomMenuEvent(detail));
    }

    // Helper method to add event listener
    static addEventListener(
        callback: (event: OpenCustomMenuEvent) => void,
        options?: boolean | AddEventListenerOptions
    ): void {
        document.addEventListener(OpenCustomMenuEvent.EVENT_NAME, callback as EventListener, options);
    }

    // Helper method to remove event listener
    static removeEventListener(
        callback: (event: OpenCustomMenuEvent) => void,
        options?: boolean | EventListenerOptions
    ): void {
        document.removeEventListener(OpenCustomMenuEvent.EVENT_NAME, callback as EventListener, options);
    }
}
