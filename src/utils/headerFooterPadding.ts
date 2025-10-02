import { HeaderFooterConfig, HeaderFooterLogoSize, HeaderFooterPosition } from '@/types';

const LOGO_SIZE_ORDER: HeaderFooterLogoSize[] = ['S', 'M', 'L', 'XL'];

const LOGO_PADDING_BY_SIZE: Partial<Record<HeaderFooterLogoSize, string>> = {
    L: 'calc(4.31em / 1)',
    XL: 'calc(5.5em / 1)',
};

const LEGACY_SIZE_MAP: Record<string, HeaderFooterLogoSize> = {
    small: 'S',
    medium: 'M',
    large: 'L',
};

const isLogoPosition = (position?: HeaderFooterPosition) =>
    position?.type === 'logo' || position?.type === 'theme-logo';

const getSizeWeight = (size: HeaderFooterLogoSize) => LOGO_SIZE_ORDER.indexOf(size);

export const normalizeLogoSize = (size?: HeaderFooterLogoSize | string): HeaderFooterLogoSize => {
    if (!size) {
        return 'M';
    }

    if (LOGO_SIZE_ORDER.includes(size as HeaderFooterLogoSize)) {
        return size as HeaderFooterLogoSize;
    }

    return LEGACY_SIZE_MAP[String(size).toLowerCase()] || 'M';
};

export const getLargestLogoSize = (config?: HeaderFooterConfig): HeaderFooterLogoSize | undefined => {
    if (!config?.enabled) {
        return undefined;
    }

    const positions = [config.left, config.center, config.right];

    let largest: HeaderFooterLogoSize | undefined;

    positions.forEach(position => {
        if (!isLogoPosition(position)) {
            return;
        }

        const normalized = normalizeLogoSize(position?.logoSize);

        if (!largest || getSizeWeight(normalized) > getSizeWeight(largest)) {
            largest = normalized;
        }
    });

    return largest;
};

export const getHeaderFooterLogoPadding = (config?: HeaderFooterConfig): string | undefined => {
    const largest = getLargestLogoSize(config);

    if (!largest) {
        return undefined;
    }

    return LOGO_PADDING_BY_SIZE[largest];
};
