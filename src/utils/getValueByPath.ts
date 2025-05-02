export default function getValueByPath(obj: any, path: any[]): any {
    if (!path || path.length === 0) return obj;

    let current = obj;

    for (const key of path) {
        if (current === undefined || current === null) {
            return undefined;
        }

        current = current[key];
    }

    return current;
}
