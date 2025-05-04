// serperClient.js (CORRECTED VERSION)

const SERPER_API_KEY = Bun.env.SERPER_API_KEY;
const SERPER_ENDPOINT = "https://google.serper.dev/search";
// Note: We fetch more now, but Serper might limit the returned count itself.
// The main goal is to get whatever it returns (often ~10) for ranking.
const FETCH_COUNT = 10; // Primarily informational now

export async function getGeneralSearchResults(query) {
    if (!SERPER_API_KEY) {
        console.error("Backend (Serper): SERPER_API_KEY is not set in .env");
        return { error: "General web search is unavailable (API key missing)." };
    }

    console.log(`Backend (Serper): Fetching search results for: "${query}"`);

    try { // <<< TRY block starts
        const response = await fetch(SERPER_ENDPOINT, {
            method: "POST",
            headers: {
                "X-API-KEY": SERPER_API_KEY,
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ q: query, num: FETCH_COUNT }), // You can ask for more with 'num'
        });

        if (!response.ok) {
            let errorText = `Serper API error ${response.status}`;
            try {
                 const errorBody = await response.json();
                 errorText = errorBody.message || errorText;
            } catch (e) { /* Ignore if response body isn't JSON */ }
            console.error(`Backend (Serper): API request failed - ${errorText}`);
            return { error: `General web search failed (${response.status}).` };
        }

        const data = await response.json();

        if (data.organic && data.organic.length > 0) {
             // Return the RAW organic results array for embedding/ranking
            console.log(`Backend (Serper): ${data.organic.length} organic results found for processing.`);
            return { organic: data.organic }; // Return the array directly
        } else {
            console.log(`Backend (Serper): No relevant organic web search results found for "${query}".`);
            return { message: "No relevant web search results found." }; // Indicate no results
        }
    } // <<< TRY block ends
    catch (error) { // <<< CATCH block was missing!
        console.error("Backend (Serper): Network or processing error fetching search results:", error);
        return { error: "Error contacting the general web search service." };
    }
} // <<< FUNCTION ends