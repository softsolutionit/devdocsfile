export function readTime(content) {
    const countMin = Math.ceil(content.split(/\s+/).length / 200);
    return countMin;
}