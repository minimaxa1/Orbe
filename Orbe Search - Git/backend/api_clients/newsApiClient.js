// api_clients/newsApiClient.js
const NEWSAPI_KEY = Bun.env.NEWSAPI_API_KEY;
console.log("Attempting to use NewsAPI Key:", NEWSAPI_KEY);
const NEWSAPI_ENDPOINT = "https://newsapi.org/v2/everything"; // Or /v2/top-headlines

export async function searchNewsApi(query, numArticles = 3) {
    if (!NEWSAPI_KEY) {
        console.error("ERROR: NewsAPI key is missing or undefined!");
        return { error: "NewsAPI key not configured." };
    }

    const params = new URLSearchParams({
        q: query,
        apiKey: NEWSAPI_KEY,
        pageSize: numArticles.toString(),
        language: 'en',
        sortBy: 'relevancy',
    });

    const url = `${NEWSAPI_ENDPOINT}?${params}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            // Attempt to get error message from API response body
            let errorBody = {};
            try {
                errorBody = await response.json();
            } catch (e) { /* ignore parsing error */ }
             console.error(`NewsAPI request failed: ${response.status} ${response.statusText}`, errorBody);
             return { error: `NewsAPI error: ${errorBody.message || response.statusText}` };
        }

        const data = await response.json();

        if (data.status === 'ok' && data.totalResults > 0) {
            // Return structured data for potential further processing by Ollama
            return { articles: data.articles };
        } else if (data.totalResults === 0) {
            return { message: `Sorry, I couldn't find any recent news articles matching '${query}' on NewsAPI.` };
        } else {
            console.error("NewsAPI response error:", data);
            return { error: `NewsAPI error: ${data.code} - ${data.message}` };
        }

    } catch (error) {
        console.error("Failed to fetch from NewsAPI:", error);
        return { error: "Sorry, I encountered an network error trying to reach the news service." };
    }
}

// --- Simple Formatting Function (can be used if not sending to Ollama for summary) ---
export function formatNewsApiResults(data, query) {
     if (data.error) return data.error;
     if (data.message) return data.message;
     if (!data.articles || data.articles.length === 0) {
         return `Sorry, I couldn't find any recent news articles matching '${query}' on NewsAPI.`;
     }

    const formattedResults = data.articles.map(article => {
        const title = article.title || 'No Title';
        const source = article.source?.name || 'Unknown Source';
        const description = article.description || 'No Description';
        const url = article.url || '#';
        // Using markdown-like formatting for clarity
        return `*   **${title}**\n    *Source:* ${source}\n    *Summary:* ${description}\n    *Link:* <${url}>`; // Use angle brackets for URLs in some markdown parsers
    }).join('\n\n'); // Separate articles with double newline

    return `Okay, here's what I found on '${query}':\n\n${formattedResults}`;
}