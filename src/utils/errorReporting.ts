// Helper function to detect browser from user agent
function getBrowserInfo() {
    if (typeof window === 'undefined') return null;

    const ua = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    // Detect browser
    if (ua.indexOf('Firefox') > -1) {
        browserName = 'Firefox';
        const match = ua.match(/Firefox\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    } else if (ua.indexOf('Edg') > -1) {
        browserName = 'Edge';
        const match = ua.match(/Edg\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    } else if (ua.indexOf('Chrome') > -1) {
        browserName = 'Chrome';
        const match = ua.match(/Chrome\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    } else if (ua.indexOf('Safari') > -1) {
        browserName = 'Safari';
        const match = ua.match(/Version\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    } else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) {
        browserName = 'Opera';
        const match = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/);
        if (match) browserVersion = match[1];
    }

    return {
        name: browserName,
        version: browserVersion,
        userAgent: ua,
    };
}

interface ErrorReportData {
    type: 'javascript' | 'react' | 'promise' | 'network' | 'other';
    message: string;
    stack?: string;
    componentStack?: string;
    additionalInfo?: Record<string, any>;
}

// Helper to check if error should be reported
function shouldReportError(message: string): boolean {
    // Skip common React dev warnings
    if (message.includes('Warning:') || message.includes('ReactDOM.render')) {
        return false;
    }
    return true;
}

// Send error to backend
export async function reportError(errorData: ErrorReportData): Promise<void> {
    // Don't report errors in development to avoid noise
    // if (process.env.NODE_ENV === 'development') {
    
    //     return;
    // }

    if (!shouldReportError(errorData.message)) {
        return;
    }

    try {
        const metadata: Record<string, any> = {
            browser: getBrowserInfo(),
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            language: navigator.language,
            platform: navigator.platform,
            timestamp: new Date().toISOString(),
            ...errorData.additionalInfo,
        };

        if (errorData.componentStack) {
            metadata.componentStack = errorData.componentStack;
        }

        await fetch('/api/errors', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: errorData.type,
                message: errorData.message,
                stack: errorData.stack,
                page: window.location.href,
                metadata,
            }),
        });
    } catch (error) {
        // Silent fail - don't want error reporting to crash the app
        console.error('Failed to report error:', error);
    }
}

// Helper function to log caught errors (for use in catch blocks)
export function logCaughtError(
    error: unknown,
    context?: {
        action?: string;
        component?: string;
        additionalInfo?: Record<string, any>;
    }
): void {
    let message = 'Unknown error';
    let stack: string | undefined;

    if (error instanceof Error) {
        message = error.message;
        stack = error.stack;
    } else if (typeof error === 'string') {
        message = error;
    } else if (error && typeof error === 'object') {
        message = JSON.stringify(error);
    }

    const errorData: ErrorReportData = {
        type: 'javascript',
        message: context?.action ? `${context.action}: ${message}` : message,
        stack,
        additionalInfo: {
            ...context?.additionalInfo,
            caughtInTryCatch: true,
            component: context?.component,
            action: context?.action,
        },
    };

    reportError(errorData);
}

// Helper to extract error message from unknown error type
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (error && typeof error === 'object' && 'message' in error) {
        return String(error.message);
    }
    return 'Unknown error';
}
