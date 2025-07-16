import 'next-auth';

declare module 'next-auth' {
    interface User {
        id: string;
        name: string;
        email: string;
        image?: string;
        role: string;
        emailVerified?: boolean;
    }

    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            image?: string;
            role: string;
            emailVerified?: boolean;
        };
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        role: string;
        emailVerified?: boolean;
    }
}
