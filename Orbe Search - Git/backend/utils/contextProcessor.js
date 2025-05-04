// utils/contextProcessor.js (CORRECTED AND REBUILT)

import { getEmbeddings } from '../api_clients/ollamaClient.js'; // Assumes ollamaClient is one level up in api_clients

// --- Configuration ---
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_EMBEDDING_MODEL_NAME = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text"; // Use specific var from .env
const TOP_N_RESULTS = 3; // How many top results to include in the final context

// --- Helper: Cosine Similarity ---
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
        console.warn("Cosine Similarity Error: Invalid vectors", { lenA: vecA?.length, lenB: vecB?.length });
        return 0; // Return 0 if vectors are invalid or different lengths
    }
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    if (denom === 0) return 0; // Handle zero vectors
    return dotProduct / denom;
}

// --- Helper: Format Selected Snippets ---
function formatSelectedSnippets(results) {
     if (!results || results.length === 0) {
        return "No relevant web search results could be selected.";
     }
    let context = "Relevant Web Search Results (Ranked by Similarity):\n\n";
    results.forEach((item, index) => {
        // Ensure item.originalData exists before accessing its properties
        const title = item.originalData?.title || 'N/A';
        const snippet = item.originalData?.snippet || 'N/A';
        const link = item.originalData?.link || 'N/A';

        context += `[Result ${index + 1}]\n`;
        context += `Title: ${title}\n`;
        context += `Snippet: ${snippet}\n`;
        context += `URL: ${link}\n\n`;
    });
    return context.trim();
}


/**
 * Processes raw Serper results using embeddings to find the most relevant snippets.
 * @param {string} query - The original user query.
 * @param {Array<object>} organicResults - The array of organic result objects from Serper.
 * @returns {Promise<{context: string} | {error: string}>} - Object with formatted context string or error.
 */
export async function processSerperResultsWithEmbeddings(query, organicResults) {
    if (!query || !organicResults || organicResults.length === 0) {
        return { context: "No web search results to process." };
    }
    // Use the constant defined at the top
    if (!OLLAMA_EMBEDDING_MODEL_NAME) {
         return { error: "Ollama embedding model not configured."};
    }

    console.log(`Backend (Context Processor): Starting embedding process for ${organicResults.length} snippets using model ${OLLAMA_EMBEDDING_MODEL_NAME}.`);

    try {
        // 1. Get embedding for the query
        const queryEmbeddingResult = await getEmbeddings(OLLAMA_API_URL, OLLAMA_EMBEDDING_MODEL_NAME, query);
        if (queryEmbeddingResult.error || !queryEmbeddingResult.embedding) {
            console.error("Backend (Context Processor): Failed to get query embedding:", queryEmbeddingResult.error);
            return { error: `Failed to process query for similarity search. ${queryEmbeddingResult.error || ''}` };
        }
        const queryVec = queryEmbeddingResult.embedding;

        // 2. Get embeddings for all snippets (concurrently)
        const snippetPromises = organicResults.map(async (item, index) => {
            // Combine title and snippet for better embedding context
            const textToEmbed = `${item.title || ''}\n${item.snippet || ''}`.trim();
            if (!textToEmbed) {
                 return { index, originalData: item, score: -1, error: "Empty snippet text" }; // Score -1 to ignore later
            }
            // Use the configured embedding model name
            const embeddingResult = await getEmbeddings(OLLAMA_API_URL, OLLAMA_EMBEDDING_MODEL_NAME, textToEmbed);
            if (embeddingResult.error || !embeddingResult.embedding) {
                 console.warn(`Backend (Context Processor): Failed to embed snippet ${index}:`, embeddingResult.error);
                 return { index, originalData: item, score: -1, error: embeddingResult.error }; // Score -1
            }
            // Calculate similarity score immediately
            const score = cosineSimilarity(queryVec, embeddingResult.embedding);
            return { index, originalData: item, score };
        });

        const scoredSnippets = await Promise.all(snippetPromises);

        // 3. Filter out snippets that failed embedding/scoring and sort by score
        const validSnippets = scoredSnippets
            .filter(item => typeof item.score === 'number' && item.score > -1) // Check score is a valid number > -1
            .sort((a, b) => b.score - a.score); // Sort descending

        if (validSnippets.length === 0) {
             console.warn("Backend (Context Processor): No snippets could be successfully embedded and scored.");
             return { context: "Could not determine relevance from web search results." };
        }

        console.log(`Backend (Context Processor): Successfully scored ${validSnippets.length} snippets. Highest score: ${validSnippets[0].score.toFixed(4)}`);

        // 4. Select the top N results (using constant defined at top)
        const topSnippets = validSnippets.slice(0, TOP_N_RESULTS);

        // 5. Format the selected snippets into a context string
        const finalContext = formatSelectedSnippets(topSnippets);
        console.log(`Backend (Context Processor): Generated final context from top ${topSnippets.length} results.`);

        return { context: finalContext };

    } catch (error) {
        console.error("Backend (Context Processor): Unexpected error during embedding/ranking:", error);
        return { error: "Internal error processing search results for relevance." };
    }
} // <<< End of the single function definition