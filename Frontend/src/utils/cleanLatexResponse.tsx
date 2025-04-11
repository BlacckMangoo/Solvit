


export const cleanGeminiResponse = (response: string): string => {
    // Remove latex code block markers
    let cleaned = response.replace(/```latex|```/g, '');
    
    // Remove dollar sign delimiters (both single $ and double $$)
    cleaned = cleaned.replace(/\${1,2}(.*?)\${1,2}/g, '$1');
    
    // If the entire string is wrapped in dollar signs, remove them
    cleaned = cleaned.replace(/^\$\$(.*)\$\$$/s, '$1');
    cleaned = cleaned.replace(/^\$(.*)\$$/s, '$1');
    
    return cleaned.trim();
  };