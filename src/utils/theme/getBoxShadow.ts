export default function getBoxShadow(shadow: string, borderColor: string) {
    return shadow.replaceAll('{borderColor}', borderColor);
}
