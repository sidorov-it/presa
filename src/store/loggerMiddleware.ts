const logger = (config: any) => (set: any, get: any, api: any) => {
    const result = config(set, get, api);
    return Object.fromEntries(
        Object.entries(result).map(([key, value]) => {
            if (typeof value === 'function') {
                return [
                    key,
                    (...args: any[]) => {
                        if (key === 'checkSlideContextMenuIsOpen') {
                            return value(...args);
                        }
                        return value(...args);
                    },
                ];
            }
            return [key, value];
        })
    );
};

export default logger;
