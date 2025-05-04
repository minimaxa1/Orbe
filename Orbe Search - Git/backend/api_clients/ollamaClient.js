// ollamaClient.js (CORRECTED VERSION)

/**
 * Sends a generation prompt to the Ollama API and returns the raw Response object for streaming.
 * @param {string} apiUrl - The base URL of the Ollama API endpoint (e.g., "http://localhost:11434").
 * @param {string} modelName - The name of the Ollama model to use (e.g., "llama3:latest").
 * @param {string} prompt - The full prompt string to send to the model.
 * @returns {Promise<Response | { error: string, status?: number }>} - Returns the Fetch Response object on success or error status,
 * or an object with an error message and status code on network failure.
 */
export async function callOllama(apiUrl, modelName, prompt) { // <<< Ensure 'export' is present
    const endpoint = `${apiUrl}/api/generate`;

    console.log(`Backend (Ollama Client): Sending generation request to ${endpoint} for model ${modelName}`);
    // console.log(`Backend (Ollama Client): Prompt starts with: ${prompt.substring(0, 100)}...`); // Optional debug

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: modelName,
                prompt: prompt,
                stream: true,
                // options: { temperature: 0.7 } // Example options if needed
            }),
        });
        // Return the response object directly (caller checks response.ok)
        return response;

    } catch (error) {
        console.error("Backend (Ollama Client): Network or fetch error calling Ollama generate:", error);
        return {
            error: `Network error connecting to Ollama at ${apiUrl}. Is it running? Details: ${error.message}`,
            status: 503 // Service Unavailable
        };
    }
}

/**
 * Gets embeddings for a given text using the Ollama API.
 * @param {string} apiUrl - The base URL of the Ollama API endpoint.
 * @param {string} modelName - The name of the embedding model to use.
 * @param {string} textToEmbed - The text content to embed.
 * @returns {Promise<{ embedding: number[] } | { error: string }>} - Returns object with embedding array on success, or error object.
 */
export async function getEmbeddings(apiUrl, modelName, textToEmbed) { // <<< Ensure 'export' is present
    const endpoint = `${apiUrl}/api/embeddings`;

    if (!textToEmbed || textToEmbed.trim() === "") {
        console.warn(`Backend (Ollama Embed): Attempted to embed empty text.`);
        return { error: "Cannot embed empty text." };
    }
    // console.log(`Backend (Ollama Embed): Requesting embedding using model ${modelName}`); // Optional debug

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: modelName,
                prompt: textToEmbed,
            }),
        });

        if (!response.ok) {
            let errorText = `Ollama embedding API error ${response.status}`;
            try { errorText = (await response.json())?.error || errorText; } catch {}
            console.error(`Backend (Ollama Embed): API Error - ${errorText}`);
            return { error: `Ollama embedding request failed: ${errorText}` };
        }

        const data = await response.json();

        if (data.embedding && Array.isArray(data.embedding)) {
            return { embedding: data.embedding }; // Success
        } else {
            console.error("Backend (Ollama Embed): Invalid response format from Ollama.", data);
            return { error: "Ollama returned an invalid embedding format." };
        }

    } catch (error) {
        console.error("Backend (Ollama Embed): Network or fetch error calling Ollama embeddings:", error);
        return { error: `Network error connecting to Ollama embeddings. Details: ${error.message}` };
    }
}