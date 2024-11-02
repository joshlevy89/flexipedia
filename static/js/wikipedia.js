const CHARACTER_LIMIT = 50000;
let currentArticle = {
    title: '',
    content: ''
};

export async function searchWikipedia() {
    const searchTerm = document.getElementById("inputText").value.trim();
    const loading = document.getElementById("loading");
    const error = document.getElementById("error");
    const suggestion = document.getElementById("suggestion");
    // const truncationNotice = document.getElementById("truncationNotice");
    const transformingSpinner = document.getElementById("transformingSpinner");
    const transformedContent = document.getElementById("transformedContent");
    
    loading.textContent = "Searching...";
    error.textContent = "";
    suggestion.textContent = "";
    // truncationNotice.classList.add("hidden");
    transformedContent.textContent = "";
    transformingSpinner.classList.add("hidden");
    
    try {
        const searchEndpoint = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(searchTerm)}&limit=1&origin=*`;
        const searchResponse = await fetch(searchEndpoint);
        const [input, titles, descriptions, urls] = await searchResponse.json();
        
        if (titles && titles.length > 0) {
            const suggestedTitle = titles[0];
            
            // from searching to showing results...
            suggestion.textContent = `Showing results for: ${suggestedTitle}`;
            loading.textContent = "";
            
            const fullContentEndpoint = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodeURIComponent(suggestedTitle)}&explaintext=1&origin=*`;
            
            const contentResponse = await fetch(fullContentEndpoint);
            const contentData = await contentResponse.json();
                                
            const pages = contentData.query.pages;
            const pageId = Object.keys(pages)[0];
            let fullContent = pages[pageId].extract;
            
            if (!fullContent) {
                throw new Error("No content received from Wikipedia");
            }
            
            if (fullContent.length > CHARACTER_LIMIT) {
                fullContent = fullContent.substring(0, CHARACTER_LIMIT);
                const lastPeriod = fullContent.lastIndexOf('.');
                if (lastPeriod > CHARACTER_LIMIT * 0.9) {
                    fullContent = fullContent.substring(0, lastPeriod + 1);
                }
                // truncationNotice.textContent = `Note: This article has been truncated to ${CHARACTER_LIMIT.toLocaleString()} characters for better processing. You can read the full article on Wikipedia.`;
                // truncationNotice.classList.remove("hidden");
            }
            
            document.getElementById("articleContent").textContent = fullContent;
            const link = document.getElementById("articleLink");
            link.href = urls[0];
            link.textContent = "Read full article on Wikipedia";
            
            currentArticle.title = suggestedTitle;
            currentArticle.content = fullContent;
                                
            if (fullContent.length > 0) {
                await transformText();
            } else {
                error.textContent = "Could not retrieve article content.";
            }
        } else {
            error.textContent = "No matching articles found. Please try a different search term.";
        }
    } catch (e) {
        error.textContent = "Error searching Wikipedia. Please try again.";
        console.error("Error:", e);
    } 
}

export async function transformText() {
    const error = document.getElementById("error");
    const transformingSpinner = document.getElementById("transformingSpinner");
    const transformedContent = document.getElementById("transformedContent");
    const transformType = document.querySelector('input[name="transformType"]:checked').value;
    
    error.textContent = "";
    transformingSpinner.classList.remove("hidden");
    transformedContent.textContent = "";
    
    try {
        const response = await fetch('/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: currentArticle.title,
                text: currentArticle.content,
                transformType: transformType
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Remove any introductory text, like "Here's a ...:" or "Here is the..."
            let transformed = data.transformed;
            const introRegex = /^([^:]*:)\s*/;
            const match = transformed.match(introRegex);
            if (match && match[1].length < 100) {
                transformed = transformed.replace(introRegex, '');
            }
            transformed = transformed.replace(introRegex, '');
            data.transformed = transformed;
            
            renderTransformedContent(data.transformed, transformType);
        } else {
            error.textContent = data.error || "Failed to transform text";
        }
    } catch (e) {
        error.textContent = "Error transforming text. Please try again.";
        console.error("Transform error:", e);
    } finally {
        transformingSpinner.classList.add("hidden");
    }
}

function renderTransformedContent(content, transformType) {
    const transformedContent = document.getElementById("transformedContent");
    
    if (transformType === 'highlights') {
        // Split into lines and create bullet points
        const lines = content.split('\n').filter(line => line.trim());
        const bulletList = document.createElement('ul');
        bulletList.className = 'list-disc pl-6 space-y-2';
        
        lines.forEach(line => {
            const li = document.createElement('li');
            // Remove leading "- " or "• " if present
            li.textContent = line.replace(/^[-•]\s+/, '');
            bulletList.appendChild(li);
        });
        
        transformedContent.innerHTML = '';
        transformedContent.appendChild(bulletList);
    } else {
        transformedContent.textContent = content;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchButton').addEventListener('click', searchWikipedia);
    document.querySelectorAll('input[name="transformType"]').forEach(radio => {
        radio.addEventListener('change', () => {
            if (currentArticle.content) {
                transformText();
            }
        });
    });
});