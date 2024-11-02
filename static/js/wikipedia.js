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
    const truncationNotice = document.getElementById("truncationNotice");
    const transformingSpinner = document.getElementById("transformingSpinner");
    const narrativeContent = document.getElementById("narrativeContent");
    
    loading.textContent = "Searching...";
    error.textContent = "";
    suggestion.textContent = "";
    truncationNotice.style.display = "none";
    narrativeContent.textContent = "";
    transformingSpinner.style.display = "none";
    
    try {
        // First, use opensearch to get suggestions
        const searchEndpoint = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${encodeURIComponent(searchTerm)}&limit=1&origin=*`;
        const searchResponse = await fetch(searchEndpoint);
        const [input, titles, descriptions, urls] = await searchResponse.json();
        
        if (titles && titles.length > 0) {
            const suggestedTitle = titles[0];
            
            if (suggestedTitle.toLowerCase() !== searchTerm.toLowerCase()) {
                suggestion.textContent = `Showing results for: ${suggestedTitle}`;
            }
            
            // Updated API call with required parameters
            const fullContentEndpoint = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&titles=${encodeURIComponent(suggestedTitle)}&explaintext=1&origin=*`;
            
            const contentResponse = await fetch(fullContentEndpoint);
            const contentData = await contentResponse.json();
                                
            const pages = contentData.query.pages;
            const pageId = Object.keys(pages)[0];
            let fullContent = pages[pageId].extract;
            
            if (!fullContent) {
                throw new Error("No content received from Wikipedia");
            }
            
            // Check if content needs truncation
            if (fullContent.length > CHARACTER_LIMIT) {
                fullContent = fullContent.substring(0, CHARACTER_LIMIT);
                // Try to end at a complete sentence
                const lastPeriod = fullContent.lastIndexOf('.');
                if (lastPeriod > CHARACTER_LIMIT * 0.9) {
                    fullContent = fullContent.substring(0, lastPeriod + 1);
                }
                truncationNotice.textContent = `Note: This article has been truncated to ${CHARACTER_LIMIT.toLocaleString()} characters for better processing. You can read the full article on Wikipedia.`;
                truncationNotice.style.display = "block";
            }
            
            document.getElementById("articleTitle").textContent = suggestedTitle;
            document.getElementById("articleContent").textContent = fullContent;
            const link = document.getElementById("articleLink");
            link.href = urls[0];
            link.textContent = "Read full article on Wikipedia";
            
            currentArticle.title = suggestedTitle;
            currentArticle.content = fullContent;
                                
            if (fullContent.length > 0) {
                await transformToNarrative();
            } else {
                error.textContent = "Could not retrieve article content.";
            }
        } else {
            error.textContent = "No matching articles found. Please try a different search term.";
        }
    } catch (e) {
        error.textContent = "Error searching Wikipedia. Please try again.";
        console.error("Error:", e);
    } finally {
        loading.textContent = "";
    }
}

export async function transformToNarrative() {
    const error = document.getElementById("error");
    const transformingSpinner = document.getElementById("transformingSpinner");
    const narrativeContent = document.getElementById("narrativeContent");
    
    error.textContent = "";
    transformingSpinner.style.display = "block";
    narrativeContent.textContent = "";
    
    try {
        const response = await fetch('/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                title: currentArticle.title,
                text: currentArticle.content
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            narrativeContent.textContent = data.narrative;
        } else {
            error.textContent = data.error || "Failed to transform text";
        }
    } catch (e) {
        error.textContent = "Error transforming text. Please try again.";
        console.error("Transform error:", e);
    } finally {
        transformingSpinner.style.display = "none";
    }
}

// Add at the bottom of the file
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchButton').addEventListener('click', searchWikipedia);
});
