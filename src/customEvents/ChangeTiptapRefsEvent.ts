interface ChangeTiptapRefsEventDetail {
    type: 'add' | 'remove' | 'update';
    elementId: string;
    content?: string;
}

export class ChangeTiptapRefsEvent extends CustomEvent<ChangeTiptapRefsEventDetail> {
    static readonly EVENT_NAME = 'changeTiptapRefs' as const;

    constructor(detail: ChangeTiptapRefsEventDetail) {
        super(ChangeTiptapRefsEvent.EVENT_NAME, {
            detail,
            bubbles: true,
            cancelable: true,
            composed: true, // Allows the event to cross shadow DOM boundaries
        });
    }

    // Helper method to dispatch the event
    static dispatch(detail: ChangeTiptapRefsEventDetail): void {
        document.dispatchEvent(new ChangeTiptapRefsEvent(detail));
    }

    // Helper method to add event listener
    static addEventListener(
        callback: (event: ChangeTiptapRefsEvent) => void,
        options?: boolean | AddEventListenerOptions
    ): void {
        document.addEventListener(ChangeTiptapRefsEvent.EVENT_NAME, callback as EventListener, options);
    }

    // Helper method to remove event listener
    static removeEventListener(
        callback: (event: ChangeTiptapRefsEvent) => void,
        options?: boolean | EventListenerOptions
    ): void {
        document.removeEventListener(ChangeTiptapRefsEvent.EVENT_NAME, callback as EventListener, options);
    }
}

declare global {
    interface WindowEventMap {
        changeTiptapRefs: ChangeTiptapRefsEvent;
    }
}
