export default function getImagePath(path: string) {
    // If path is already a full URL, return it as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // If path is a data URL, return it as is
    if (path.startsWith('data:')) {
        return path;
    }

    // In production, construct the full URL
    if (process.env.NODE_ENV === 'production') {
        // Ensure path starts with / for proper URL construction
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        return `https://app.slydle.ru${normalizedPath}`;
    }

    // In development, return the path as is (Next.js will handle it)
    return path;
}
