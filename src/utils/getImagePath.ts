export default function getImagePath(path: string) {
    if (process.env.NODE_ENV === 'production') {
        return `http://app.slydle.ru${path}`;
    }

    return path;
}
