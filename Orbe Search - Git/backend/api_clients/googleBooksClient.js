// googleBooksClient.js

const GOOGLE_BOOKS_API_KEY = Bun.env.GOOGLE_BOOKS_API_KEY;
const GOOGLE_BOOKS_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";

export async function searchGoogleBooks(query, maxResults = 3) {
    if (!GOOGLE_BOOKS_API_KEY) {
        console.error("Google Books API key not configured in .env");
        return { error: "Google Books API key not configured." };
    }

    const params = new URLSearchParams({
        q: query,
        key: GOOGLE_BOOKS_API_KEY,
        maxResults: Math.min(maxResults, 10).toString(), // Google API maxResults often capped lower
        projection: 'lite', // 'lite' returns essential fields, 'full' returns more
        orderBy: 'relevance' // 'newest' is also an option
    });

    const url = `${GOOGLE_BOOKS_ENDPOINT}?${params}`;
    console.log(`Backend (Google Books): Requesting URL: ${url}`); // Log URL without key for security if needed

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            let errorBody = {}; try { errorBody = await response.json(); } catch (e) { /* ignore */ }
            console.error(`Backend (Google Books): API error ${response.status}`, errorBody);
            return { error: `Google Books API error: ${errorBody?.error?.message || response.statusText}` };
        }

        const data = await response.json();

        if (data.totalItems > 0 && data.items) {
            const books = data.items.map(item => ({
                id: item.id,
                title: item.volumeInfo?.title || 'No Title',
                authors: item.volumeInfo?.authors || ['Unknown Author'], // Array
                description: item.volumeInfo?.description || 'No description available.',
                publisher: item.volumeInfo?.publisher || 'N/A',
                publishedDate: item.volumeInfo?.publishedDate || 'N/A',
                thumbnail: item.volumeInfo?.imageLinks?.thumbnail || item.volumeInfo?.imageLinks?.smallThumbnail || null,
                infoLink: item.volumeInfo?.infoLink || null
            }));
            console.log(`Backend (Google Books): Found ${books.length} results.`);
            return { books: books };
        } else {
            console.log(`Backend (Google Books): No results found for "${query}".`);
            return { message: `Sorry, I couldn't find any books matching '${query}' on Google Books.` };
        }

    } catch (error) {
        console.error("Backend (Google Books): Failed to fetch:", error);
        return { error: "Sorry, I encountered a network error trying to reach the Google Books service." };
    }
}

// --- Formatting Function for Google Books ---
export function formatGoogleBooksForOllama(data, query) {
    if (data.error) return data.error;
    if (data.message) return data.message;
    if (!data.books || data.books.length === 0) {
        return `Sorry, I couldn't find any books matching '${query}' on Google Books.`;
    }

    let context = "Google Books Search Results:\n\n";
    data.books.forEach((book, index) => {
        context += `[Book ${index + 1}]\n`;
        context += `Title: ${book.title}\n`;
        context += `Authors: ${book.authors.join(', ')}\n`;
        // Limit description length for context
        context += `Description: ${book.description.substring(0, 250)}${book.description.length > 250 ? '...' : ''}\n`;
        context += `Published: ${book.publishedDate} by ${book.publisher}\n`;
        context += `More Info URL: ${book.infoLink || 'N/A'}\n\n`;
        // Note: We don't include the thumbnail URL in the text context for Ollama
    });
    return context.trim();
}