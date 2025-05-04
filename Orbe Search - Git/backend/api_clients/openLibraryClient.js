// openLibraryClient.js

const OPEN_LIBRARY_ENDPOINT = "https://openlibrary.org/search.json";

export async function searchOpenLibrary(query, maxResults = 3) {
    // No API key usually needed for search

    // Request specific fields to keep response size down
    const fields = 'key,title,author_name,first_publish_year,cover_i,isbn,subject,subtitle';

    const params = new URLSearchParams({
        q: query,
        limit: maxResults.toString(),
        fields: fields
        // Other options: 'author', 'title', 'subject' for more specific searches
    });

    const url = `${OPEN_LIBRARY_ENDPOINT}?${params}`;
    console.log(`Backend (Open Library): Requesting URL: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            let errorBody = {}; try { errorBody = await response.json(); } catch (e) { /* ignore */ }
            console.error(`Backend (Open Library): API error ${response.status}`, errorBody);
            return { error: `Open Library API error: ${errorBody?.error || response.statusText}` };
        }

        const data = await response.json();

        if (data.numFound > 0 && data.docs) {
            const books = data.docs.map(doc => ({
                key: doc.key,
                title: doc.title || 'No Title',
                subtitle: doc.subtitle || null,
                authors: doc.author_name || ['Unknown Author'], // Array
                firstPublishedYear: doc.first_publish_year || 'N/A',
                subjects: doc.subject || [], // Array of subjects
                // Construct cover image URL (M for Medium size)
                coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
                // Provide Open Library link
                infoLink: `https://openlibrary.org${doc.key}`
            }));
            console.log(`Backend (Open Library): Found ${books.length} results.`);
            return { books: books };
        } else {
            console.log(`Backend (Open Library): No results found for "${query}".`);
            return { message: `Sorry, I couldn't find any books matching '${query}' on Open Library.` };
        }

    } catch (error) {
        console.error("Backend (Open Library): Failed to fetch:", error);
        return { error: "Sorry, I encountered a network error trying to reach the Open Library service." };
    }
}

// --- Formatting Function for Open Library ---
export function formatOpenLibraryForOllama(data, query) {
    if (data.error) return data.error;
    if (data.message) return data.message;
    if (!data.books || data.books.length === 0) {
        return `Sorry, I couldn't find any books matching '${query}' on Open Library.`;
    }

    let context = "Open Library Search Results:\n\n";
    data.books.forEach((book, index) => {
        context += `[Book ${index + 1}]\n`;
        context += `Title: ${book.title}${book.subtitle ? `: ${book.subtitle}` : ''}\n`;
        context += `Authors: ${book.authors.join(', ')}\n`;
        context += `First Published: ${book.firstPublishedYear}\n`;
        // Maybe include a few subjects
        if (book.subjects && book.subjects.length > 0) {
             context += `Subjects: ${book.subjects.slice(0, 3).join(', ')}${book.subjects.length > 3 ? '...' : ''}\n`;
        }
        context += `More Info URL: ${book.infoLink || 'N/A'}\n\n`;
         // Note: We don't include the cover URL in the text context for Ollama
    });
    return context.trim();
}