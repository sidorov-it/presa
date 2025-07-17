import path from 'path';

/**
 * Получает путь для загрузки файлов
 * Если установлена переменная окружения UPLOAD_PATH - использует её
 * Иначе использует стандартный путь public/uploads
 */
export const getUploadPath = (): string => {
    const customPath = process.env.UPLOAD_PATH;

    if (customPath) {
        return customPath;
    }

    return path.join(process.cwd(), 'public', 'uploads');
};
