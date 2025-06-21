export default function getImageWidth(imageSize: number) {
    const imageWidthCoof = 14;
    const imageWidth = 30 + imageWidthCoof * (imageSize - 1);
    return imageWidth;
}
