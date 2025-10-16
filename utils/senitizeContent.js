export const sanitizeMarkdown = (content) => {
  if (!content) return '';
  
  let sanitized = decodeHtmlEntities(content);
  
  // Fix headings first (from previous fix)
  sanitized = sanitized
    .replace(/^(#{1,6})\s*\*\*(.*?)\*\*\s*$/gm, '$1 $2')
    .replace(/^(#{1,6})([^#\s])/gm, '$1 $2')
    .replace(/^(#{1,6})\s*$/gm, '');
  
  // Fix code blocks
  sanitized = sanitized
    // Standardize code block markers
    .replace(/~~~+/g, '```')
    // Ensure code blocks start and end with newlines
    .replace(/([^\n])\n```/g, '$1\n\n```')
    .replace(/```\n([^\n])/g, '```\n\n$1')
    // Fix language specification
    .replace(/^```\s*(\w+)\s*$/gm, '```$1')
    // Remove extra spaces in code blocks
    .replace(/```(\w+)\n\s+/g, '```$1\n')
    // Ensure code blocks are properly closed
    .split('```')
    .map((segment, index) => {
      if (index % 2 === 1) {
        // This is inside a code block
        const lines = segment.split('\n');
        const language = lines[0].trim();
        const code = lines.slice(1).join('\n').trim();
        return `${language}\n${code}`;
      }
      return segment;
    })
    .join('```');
  
  return sanitized;
};

export const decodeHtmlEntities = (text) => {
    const entities = {
      '&#x20;': ' ',
      '&nbsp;': ' ',
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'"
    };
    return text.replace(/&#x20;|&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/g, match => entities[match]);
  };