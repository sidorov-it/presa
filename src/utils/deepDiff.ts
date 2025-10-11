export default function deepDiff(obj1: any, obj2: any) {
    const result = {};

    if (!obj1 && !obj2) {
        return {};
    }

    if (!obj1 || !obj2) {

        return;
    }
    for (const key in obj1) {
        if (!(key in obj2)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error

            result[key] = { onlyInObj1: obj1[key] };
        } else if (
            typeof obj1[key] === 'object' &&
            obj1[key] !== null &&
            typeof obj2[key] === 'object' &&
            obj2[key] !== null
        ) {
            const nestedDiff = deepDiff(obj1[key], obj2[key]);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            if (Object.keys(nestedDiff).length > 0) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                result[key] = nestedDiff;
            }
        } else if (obj1[key] !== obj2[key]) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            result[key] = { obj1: obj1[key], obj2: obj2[key] };
        }
    }

    for (const key in obj2) {
        if (!(key in obj1)) {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            result[key] = { onlyInObj2: obj2[key] };
        }
    }

    return result;
}
