// --- START OF FILE server.mjs ---

// orbe-backend/server.mjs (Bun Version with Intent Routing, Caching, Embedding, Download Proxy, and Direct File Bypass)

import { serve } from "bun";

// --- IMPORTS ---
// Import API Client functions (Ensure paths are correct relative to server.mjs)
import { searchNewsApi } from './api_clients/newsApiClient.js';
import { getGeneralSearchResults } from './api_clients/serperClient.js';
import { callOllama } from './api_clients/ollamaClient.js';

// Book API Client (CHOOSE ONE and uncomment the import)
// import { searchGoogleBooks } from './api_clients/googleBooksClient.js';
import { searchOpenLibrary } from './api_clients/openLibraryClient.js';

// Utilities
import { generateCacheKey, setCachedResult, getCachedResult } from './utils/cacheManager.js';
import { processSerperResultsWithEmbeddings } from './utils/contextProcessor.js';
import { IntentType, classifyIntent, extractTopic } from './utils/intentClassifier.js';


// --- Configuration ---
const PORT = process.env.PORT || 3001;
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const NEWSAPI_KEY = Bun.env.NEWSAPI_API_KEY;
const GOOGLE_BOOKS_API_KEY = Bun.env.GOOGLE_BOOKS_API_KEY;
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen3:14b";
const OLLAMA_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";

// --- Personality Mode Prompts ---
const MODE_PROMPTS = {
    // Revised Chat Prompt: Focused on conversational style, clear context handling
    chat: `You are orbe, a friendly and helpful conversational AI assistant.
Engage naturally with the user in a helpful and approachable tone. Make the interaction feel like a pleasant chat, not robotic. Feel free to ask clarifying questions.
Synthesize the provided context (like web search results, news articles, or book snippets) with the user's query to form your response. If the context seems irrelevant or is missing, rely on your general knowledge to answer helpfully.
**Respond ONLY in English.**`, // Added newline before constraint for clarity

    // Revised Coder Prompt: Added persona consistency
    coder: `You are orbe, acting as an "AI coding expert".
Use the provided context (ranked web search results, news articles, or technical documents) and user query to provide accurate, efficient code examples or technical explanations.
Prioritize clarity, correctness, and security. Format code using markdown code blocks.
If context is irrelevant, answer based on your coding knowledge.
**Respond ONLY in English.**`,

    // Revised Business Prompt: Added persona consistency
    business: `You are orbe, acting as an "AI business consultant".
Analyze the provided context (ranked web search results, news articles, market data) and user query to provide actionable business insights, strategy ideas, or feasibility assessments.
Focus on clarity, cost-effectiveness, and market context. If context is irrelevant, rely on general business principles.
**Respond ONLY in English.**`,

    // Revised Creative Prompt: Added persona consistency
    creative: `You are orbe, acting as an "AI creative partner".
Use the provided context (ranked web search results, articles, creative works) and user query to brainstorm innovative ideas, unique perspectives, or creative solutions.
Prioritize originality, imagination, and feasibility. If context is irrelevant, think outside the box using general knowledge.
**Respond ONLY in English.**`,

    // Wizard Prompt: Kept concise focus
    wizard: `WIZARD MODE: You are orbe, operating in high-efficiency mode.
Respond to the user query using context if relevant. BE EXTREMELY CONCISE. Use point form or minimal wording.
OMIT all conversational filler, introductions, summaries, apologies, and self-references.
Provide ONLY the core output (e.g., code block, list, direct answer). Ask questions ONLY if critically necessary for execution.
**Respond ONLY in English.**`,
};


// --- Helper Formatters ---
function formatNewsForOllama(newsData) {
    if (!newsData || newsData.error || !newsData.articles || newsData.articles.length === 0) { return newsData?.error || "No relevant news articles found or error fetching news."; }
    let context = "Recent News Articles:\n\n"; newsData.articles.forEach((article, index) => { context += `[Article ${index + 1}]\nTitle: ${article.title || 'N/A'}\nSource: ${article.source?.name || 'N/A'}\nSummary: ${article.description || article.content || 'N/A'}\nURL: ${article.url || 'N/A'}\n\n`; }); return context.trim();
}
function formatOpenLibraryForOllama(data, query) {
    if (data.error) return data.error;
    if (data.message) return data.message;
    if (!data.books || data.books.length === 0) { return `Sorry, I couldn't find any books matching the search on Open Library.`; }
    let context = "Open Library Search Results:\n\n"; data.books.forEach((book, index) => { context += `[Book ${index + 1}]\nTitle: ${book.title}${book.subtitle ? `: ${book.subtitle}` : ''}\nAuthors: ${book.authors.join(', ')}\nFirst Published: ${book.firstPublishedYear}\n`; if (book.subjects && book.subjects.length > 0) { context += `Subjects: ${book.subjects.slice(0, 3).join(', ')}${book.subjects.length > 3 ? '...' : ''}\n`; } context += `More Info URL: ${book.infoLink || 'N/A'}\n\n`; }); return context.trim();
}
function formatGoogleBooksForOllama(data, query) {
     if (data.error) return data.error;
     if (data.message) return data.message;
     if (!data.books || data.books.length === 0) { return `Sorry, I couldn't find any books matching the search on Google Books.`; }
     let context = "Google Books Search Results:\n\n"; data.books.forEach((book, index) => { context += `[Book ${index + 1}]\nTitle: ${book.title}\nAuthors: ${book.authors.join(', ')}\nDescription: ${book.description.substring(0, 250)}${book.description.length > 250 ? '...' : ''}\nPublished: ${book.publishedDate} by ${book.publisher}\nMore Info URL: ${book.infoLink || 'N/A'}\n\n`; }); return context.trim();
}

// --- Regex for identifying file extensions ---
const fileExtensionsRegex = /\.(pdf|docx?|xlsx?|pptx?|zip|rar|tar\.gz|jpg|jpeg|png|gif|mp3|mp4|txt|csv|md|json|xml|yaml|sql|py|js|html|css)$/i;

// --- Helper: Format potential files for context ---
function formatPotentialFilesForContext(resultsArray, resultType = "Web") {
    if (!resultsArray || resultsArray.length === 0) {
        return "";
    }
    let fileContext = ""; // Start empty, add header only if files found
    let filesFound = 0;
    resultsArray.forEach(item => {
        if (item.url && typeof item.url === 'string' && fileExtensionsRegex.test(item.url)) {
            try {
                const urlPath = new URL(item.url).pathname;
                let filename = urlPath.substring(urlPath.lastIndexOf('/') + 1);
                if (!filename && item.url.includes('.')) { filename = item.url.substring(item.url.lastIndexOf('/') + 1); }
                if (!filename) filename = item.title || item.url;
                filename = decodeURIComponent(filename);
                const proxyUrl = `/api/download-proxy?url=${encodeURIComponent(item.url)}`;
                if (filesFound === 0) { // Add header only before the first file
                    fileContext += `\n\n[Potential Downloadable ${resultType} Files Found]:\n`;
                }
                fileContext += `- [${filename.substring(0, 80)}](${proxyUrl})\n`;
                filesFound++;
            } catch (e) {
                console.warn(`Skipping potential file due to URL parse error: ${item.url}`, e);
            }
        }
    });
    return fileContext; // Return the generated string (empty if no files)
}

// --- Helper: Construct Ollama Prompt (V3 - Focus on Direct Link Task) ---
function constructPrompt(query, context, mode = 'default') {
    let systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS['default'];
    let contextType = "Web Search Results"; // Default
    let filesPresent = context.includes("[Potential Downloadable"); // Simple check

    // Determine context type
    if (context.includes("Recent News Articles:")) contextType = "News Articles";
    else if (context.includes("Google Books Search Results:") || context.includes("Open Library Search Results:")) contextType = "Book Search Results";
    else if (context.includes("Relevant Web Search Results (Ranked")) contextType = "Ranked Web Search Results";
    else if (filesPresent) contextType += " (with Files)";
    else if (context.includes("No relevant") || context.includes("No context") || context.includes("unavailable") || context.includes("error")) contextType = "Issue Report";

    const contextContent = context || "No context provided.";

    // Modify System Prompt based on filesPresent
    if (filesPresent) {
        // VERY DIRECT INSTRUCTION FOCUSED ON THE DOWNLOAD TASK
        systemPrompt = `**USER TASK: Provide a direct download link.**

CONTEXT ANALYSIS: The user query is '${query}'. The provided context includes a section '[Potential Downloadable ... Files Found]' listing relevant files with prepared download links (starting with '/api/download-proxy').

YOUR PRIMARY GOAL: If a file listed in the '[Potential Downloadable ... Files Found]' section directly matches the user's request (e.g., a specific PDF, datasheet, image), your *main response* MUST be that specific '/api/download-proxy' link, presented clearly using Markdown: \`[filename](link)\`.

SECONDARY GOAL: Briefly mention the source or provide context if helpful, but ONLY AFTER providing the mandatory direct download link if a match was found. Do NOT prioritize website links over the prepared '/api/download-proxy' link for the requested file.

EXAMPLE (if user asks for 'datasheet.pdf' and it's in the file list):
\`\`\`
Here is the direct download link for the datasheet:
[datasheet.pdf](/api/download-proxy?url=...)

It was found on the official website.
\`\`\`
`;
    } else {
        // Standard instruction if no files were prepared
        systemPrompt = MODE_PROMPTS[mode] || MODE_PROMPTS['default']; // Use original mode prompt
         systemPrompt += "\nSynthesize the provided context and user query to answer concisely. If context is irrelevant or missing, rely on general knowledge.";
    }

    // Append language instruction regardless
    systemPrompt += " **Respond ONLY in English.**";


    return `${systemPrompt}\n\n--- Context (${contextType}) ---\n${contextContent}\n--- End Context ---\n\nUser Query:\n${query}\n\nAnswer:`;
}

// --- Helper: Simple Keyword Matcher for Direct File Bypass ---
function queryMatchesFile(query, filename) {
    if (!query || !filename) return false;
    try {
        const queryLower = query.toLowerCase();
        // Normalize filename: lowercase, replace separators with spaces, remove extension
        const filenameLowerBase = filename.toLowerCase().replace(/[\-_]/g, ' ').replace(/\.[^/.]+$/, '').trim();

        // Simple stopword removal and punctuation cleanup for query
        const queryTokens = queryLower.split(' ')
            .map(t => t.replace(/[^\w\s]/gi, '')) // Remove punctuation
            .filter(t => t.length > 2 && !['download', 'find', 'get', 'for', 'the', 'and', 'with', 'pdf', 'zip', 'doc', 'file'].includes(t)) // Remove common words and file types
            .filter(Boolean); // Remove empty strings resulting from punctuation removal

        if (queryTokens.length === 0) {
            // If query was only stopwords/types, check if filename *contains* original query terms (like 'pdf')
            return queryLower.split(' ').some(origToken => filename.toLowerCase().includes(origToken));
        };

        // Check if most significant query tokens are present in the normalized filename
        let matchCount = 0;
        for (const qt of queryTokens) {
            if (filenameLowerBase.includes(qt)) {
                matchCount++;
            }
        }

        // Heuristic: If filename contains more than half the significant query terms, consider it a match.
        const matchThreshold = 0.5;
        const isMatch = (matchCount / queryTokens.length) > matchThreshold;

        // console.log(`[queryMatchesFile] Query: "${query}", Filename: "${filename}", Base: "${filenameLowerBase}", Tokens: ${queryTokens}, MatchCount: ${matchCount}, Match: ${isMatch}`);
        return isMatch;
    } catch (e) {
        console.error("[queryMatchesFile] Error:", e, "Query:", query, "Filename:", filename);
        return false; // Fail safe
    }
}


// --- Main Server Logic ---
console.log(`Starting orbe backend (Bun) on port ${PORT}...`);
console.log(`Backend using Ollama endpoint: ${OLLAMA_API_URL}`);
console.log(`Backend using Ollama generation model: ${OLLAMA_MODEL}`);
console.log(`Backend using Ollama embedding model: ${OLLAMA_EMBEDDING_MODEL || '(Not Set!)'}`);
// Warnings for missing keys
if (!SERPER_API_KEY) { console.warn("Backend WARNING: SERPER_API_KEY environment variable not set. General web search will fail."); }
if (!NEWSAPI_KEY) { console.warn("Backend WARNING: NEWSAPI_API_KEY environment variable not set. News search will fail."); }
if (!OLLAMA_EMBEDDING_MODEL) { console.warn("Backend WARNING: OLLAMA_EMBEDDING_MODEL environment variable not set. Embedding/Ranking will fail.");}
// Check Google key only if Google function is potentially imported
let usingGoogleBooks = false;
try { if (typeof searchGoogleBooks === 'function') { usingGoogleBooks = true; if (!GOOGLE_BOOKS_API_KEY) console.warn("Backend WARNING: GOOGLE_BOOKS_API_KEY not set; Google Books search will fail if used."); } } catch {}


serve({
    port: PORT,
    async fetch(req) {
        const url = new URL(req.url);

        // --- CORS Headers Definition (centralized) ---
        const corsHeaders = {
            "Access-Control-Allow-Origin": "*", // Adjust for production
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        // CORS Preflight
        if (req.method === "OPTIONS") {
            return new Response(null, { headers: corsHeaders });
        }

        // --- Handle API Chat Request ---
        if (req.method === "POST" && url.pathname === "/api/search-and-chat") {
            console.log("Backend: Received POST request to /api/search-and-chat");
            try {
                // --- Initial setup: get query, mode, intent, topic ---
                const requestBody = await req.json();
                const query = requestBody.query;
                const mode = requestBody.mode || 'default';
                console.log(`Backend: Query="${query}", Mode="${mode}"`);
                if (!query) { return new Response(JSON.stringify({ error: "Missing 'query' in request body" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders }, }); }
                const intent = await classifyIntent(query);
                console.log(`Backend: Classified Intent: ${intent}`);
                const topic = extractTopic(query, intent);
                console.log(`Backend: Extracted Topic/Term: "${topic}"`);
                // --- End initial setup ---

                let contextForOllama = "No context available.";
                let apiResult = null; // Holds raw results from API clients
                let fileContextString = ""; // To hold formatted file links
                let potentialFilesList = []; // <-- Store parsed files {filename, proxyUrl}

                // <<< --- Decision Logic based on Classified Intent --- >>>
                switch (intent) {
                    case IntentType.NEWS:
                        console.log("Backend: Routing to NewsAPI.");
                        const newsCacheKey = generateCacheKey('news', topic);
                        apiResult = getCachedResult(newsCacheKey);
                        if (!apiResult) {
                           // ... (Fetch News logic) ...
                           if (typeof searchNewsApi === 'function'){
                                apiResult = await searchNewsApi(topic);
                                // ... (Cache result or error) ...
                           } // ... else handle missing key/client ...
                        }
                        if (typeof formatNewsForOllama === 'function') {
                            contextForOllama = formatNewsForOllama(apiResult);
                            if (apiResult?.articles) { // Check if files are present in news
                                fileContextString = formatPotentialFilesForContext(apiResult.articles, "News");
                                // Parse files if needed for direct match (less likely for news)
                                if (fileContextString) { /* ... parse into potentialFilesList ... */ }
                            }
                        } else { /* ... error handling ... */ }
                        break;

                    case IntentType.BOOKS:
                         console.log("Backend: Routing to Book API.");
                         // ... (Existing book logic - unlikely to yield direct files) ...
                         if (activeBookFormatterFn) { contextForOllama = activeBookFormatterFn(apiResult, topic); }
                         else { /* ... error handling ... */ }
                         break;

                    case IntentType.GENERAL_INFO:
                    default: // Fallback to general search
                        console.log("Backend: Routing to General Search (Serper + Embedding).");
                        const serperCacheKey = generateCacheKey('serper-raw', query);
                        let rawSerperResult = getCachedResult(serperCacheKey);
                        let organicResultsArray = null;
                        let fetchErrorContext = null; // To store errors from the fetch attempt

                        if (rawSerperResult) { /* ... handle cache ... */
                            if(rawSerperResult.error) { fetchErrorContext = rawSerperResult.error; }
                            else { organicResultsArray = rawSerperResult.organic || null; }
                        } else { /* ... fetch from serper ... */
                            if (typeof getGeneralSearchResults === 'function' && SERPER_API_KEY){
                                rawSerperResult = await getGeneralSearchResults(query);
                                if (rawSerperResult && !rawSerperResult.error) {
                                    setCachedResult(serperCacheKey, rawSerperResult);
                                    organicResultsArray = rawSerperResult.organic || null;
                                } else {
                                    fetchErrorContext = rawSerperResult?.error || "Error performing web search.";
                                    setCachedResult(serperCacheKey, { error: fetchErrorContext });
                                }
                            } else { /* ... handle missing key/client ... */
                                fetchErrorContext = SERPER_API_KEY ? "General search client config error." : "General web search unavailable (API key missing).";
                                setCachedResult(serperCacheKey, { error: fetchErrorContext });
                            }
                        } // End cache/fetch logic

                        // --- Process results (Files and Embeddings) ---
                        if (organicResultsArray && organicResultsArray.length > 0) {
                            console.log(`Backend: Processing ${organicResultsArray.length} organic results.`);
                            // 1. Generate file context AND parse file list
                            fileContextString = formatPotentialFilesForContext(organicResultsArray, "Web");
                            if (fileContextString) {
                                const linkRegex = /-\s*\[([^\]]+)\]\(([^)]+)\)/g;
                                let match;
                                while ((match = linkRegex.exec(fileContextString)) !== null) {
                                    if (match[2] && match[2].startsWith('/api/download-proxy?url=')) {
                                         potentialFilesList.push({ filename: match[1], proxyUrl: match[2] });
                                    }
                                }
                                console.log(`Backend: Parsed ${potentialFilesList.length} potential file links.`);
                            }

                            // 2. Generate ranked context using embeddings (only needed if NOT bypassing later)
                            if (typeof processSerperResultsWithEmbeddings === 'function' && OLLAMA_EMBEDDING_MODEL) {
                                const processedResult = await processSerperResultsWithEmbeddings(query, organicResultsArray);
                                contextForOllama = processedResult.context || processedResult.error || "Failed to process search results with embeddings.";
                            } else { /* ... embedding error handling ... */
                                 contextForOllama = OLLAMA_EMBEDDING_MODEL ? "Context processing client config error." : "Ranking unavailable (Embedding model not set).";
                            }

                        } else {
                            // No organic results OR there was an error during fetch/cache check
                            contextForOllama = fetchErrorContext || "No relevant web search results found."; // Use captured error or default
                            console.log(`Backend: No organic results to process, using context: "${contextForOllama}"`);
                        }
                        break; // End default case
                } // End switch(intent)
                // <<< --- END: Decision Logic --- >>>


                // --- Check for Direct File Match & Bypass Ollama ---
                let directFileMatch = null;
                if (potentialFilesList.length > 0) {
                    directFileMatch = potentialFilesList.find(file => queryMatchesFile(query, file.filename));
                }

                if (directFileMatch) {
                    // --- BYPASS OLLAMA - Send Direct Link Response ---
                    console.log(`Backend: Found direct file match: "${directFileMatch.filename}". Bypassing Ollama.`);
                    const directResponseText = `Based on your query, this direct download link was found:\n[${directFileMatch.filename}](${directFileMatch.proxyUrl})`;

                    // Simulate the ndjson stream format
                    const responsePayload = {
                        model: "orbe-backend-direct", // Indicate source
                        created_at: new Date().toISOString(),
                        response: directResponseText,
                        done: true, // Single chunk response
                        context: [], total_duration: 50000000, load_duration: 0, prompt_eval_count: 0, prompt_eval_duration: 0, eval_count: 1, eval_duration: 50000000, // Dummy stats
                    };

                    const streamHeaders = new Headers(corsHeaders);
                    streamHeaders.set("Content-Type", "application/x-ndjson");

                    // Create a simple stream for the single JSON payload
                    const stream = new ReadableStream({
                        start(controller) {
                            try {
                                controller.enqueue(new TextEncoder().encode(JSON.stringify(responsePayload) + '\n'));
                                controller.close();
                            } catch (e) {
                                console.error("Error enqueueing direct response:", e);
                                controller.error(e);
                            }
                        }
                    });
                    return new Response(stream, { status: 200, headers: streamHeaders });
                    // --- END Direct Link Response ---

                } else {
                    // --- NO Direct Match - Proceed with Ollama Generation ---
                    console.log("Backend: No direct file match found, proceeding with Ollama generation.");

                    // Combine main context and file context (if files were found)
                    if (fileContextString) {
                        // Add clear markers for the V3 prompt
                        contextForOllama += "\n\n" +
                                            "--- START POTENTIAL DOWNLOADABLE FILES ---" +
                                            fileContextString.replace("[Potential Downloadable", "[Files Found") +
                                            "--- END POTENTIAL DOWNLOADABLE FILES ---";
                    }

                    // Construct Prompt (Use the V3 Prompt focused on links)
                    const ollamaPrompt = constructPrompt(query, contextForOllama, mode);

                    // Optional: Log context/prompt before Ollama call for debugging this path
                    // console.log("--- DEBUG: Final Context Being Sent to Ollama (Fallback Path) ---");
                    // console.log(contextForOllama); // Log combined context
                    // console.log("--- Prompt for Ollama ---");
                    // console.log(ollamaPrompt);
                    // console.log("-------------------------------------------------------------");

                    // Call Ollama
                    console.log(`Backend: Sending prompt to Ollama generation model: ${OLLAMA_MODEL}`);
                    if (typeof callOllama !== 'function') { /* ... error ... */ return new Response(JSON.stringify({ error: "Internal processing error: Ollama client missing." }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }, }); }
                    const ollamaResponse = await callOllama(OLLAMA_API_URL, OLLAMA_MODEL, ollamaPrompt);

                    // Handle/Stream Ollama Response (keep existing robust logic)
                    if (!ollamaResponse || !(ollamaResponse instanceof Response) || !ollamaResponse.ok) { /* ... error handling ... */
                        let errorStatus = 502; let errorMessage = "Ollama communication error.";
                        if (ollamaResponse instanceof Response) { errorStatus = ollamaResponse.status; try { errorMessage = await ollamaResponse.text(); } catch {} }
                        else if (ollamaResponse?.error) { errorMessage = ollamaResponse.error; }
                        console.error(`Backend: Ollama Interaction Failed. Status: ${errorStatus}, Message: ${errorMessage}`);
                        return new Response(JSON.stringify({ error: `Ollama Interaction Failed. Details: ${errorMessage.substring(0, 200)}` }), { status: errorStatus, headers: { "Content-Type": "application/json", ...corsHeaders }, });
                    }
                    console.log("Backend: Streaming Ollama response to client...");
                    const streamHeaders = new Headers(corsHeaders);
                    streamHeaders.set("Content-Type", "application/x-ndjson");
                    return new Response(ollamaResponse.body, { status: ollamaResponse.status, headers: streamHeaders });
                    // --- END Ollama Fallback ---
                }

            } catch (error) {
                 console.error("Backend: Unhandled Error processing /api/search-and-chat:", error);
                 return new Response(JSON.stringify({ error: "Internal Server Error processing request." }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders }, });
            }
        } // End /api/search-and-chat


        // --- Download Proxy Endpoint ---
        if (req.method === "GET" && url.pathname === "/api/download-proxy") {
            const externalUrl = url.searchParams.get('url');
            if (!externalUrl) { return new Response('Missing url parameter', { status: 400, headers: corsHeaders }); }
            try {
                console.log(`Backend: Proxying download for: ${externalUrl}`);
                const fetchOptions = { method: 'GET', redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36', 'Accept': '*/*', 'Accept-Language': 'en-US,en;q=0.9', 'Connection': 'keep-alive'} };
                const externalResponse = await fetch(externalUrl, fetchOptions);
                if (!externalResponse.ok) { console.warn(`Backend: Proxy failed to fetch ${externalUrl} - Status: ${externalResponse.status} ${externalResponse.statusText}`); return new Response(`Failed to fetch external file. Status: ${externalResponse.status}`, { status: externalResponse.status, headers: corsHeaders }); }

                // Determine filename (Robust parsing)
                let filename = "downloaded_file";
                const disposition = externalResponse.headers.get('content-disposition');
                if (disposition) {
                    let match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
                    if (match?.[1]) { try { filename = decodeURIComponent(match[1]); } catch (e) {} }
                    else {
                        match = disposition.match(/filename="([^"]+)"/i);
                        if (match?.[1]) { try { filename = decodeURIComponent(match[1]); } catch (e) {} }
                         else {
                            match = disposition.match(/filename=([^;]+)/i);
                             if (match?.[1]) { try { filename = decodeURIComponent(match[1]); } catch (e) {} }
                        }
                    }
                    filename = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').substring(0, 200).trim() || "downloaded_file";
                } else {
                     try { // Fallback to URL path/param
                        const urlObject = new URL(externalUrl); const path = urlObject.pathname; const urlFilename = urlObject.searchParams.get('filename') || urlObject.searchParams.get('file');
                        if (urlFilename) { filename = urlFilename; }
                        else if (path) { const lastSegment = path.substring(path.lastIndexOf('/') + 1); if (lastSegment) { filename = lastSegment; } }
                        if (filename !== "downloaded_file") { try { filename = decodeURIComponent(filename); } catch (e) {} filename = filename.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').substring(0, 200).trim() || "downloaded_file"; }
                    } catch (urlError) { console.warn("Could not parse filename from URL path:", externalUrl); }
                } // End Filename Determination

                const downloadHeaders = new Headers(corsHeaders);
                downloadHeaders.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename).replace(/%20/g, '+')}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
                downloadHeaders.set('Content-Type', externalResponse.headers.get('content-type') || 'application/octet-stream');
                const contentLength = externalResponse.headers.get('content-length');
                if (contentLength !== null) { downloadHeaders.set('Content-Length', contentLength); }
                console.log(`Backend: Streaming proxied file "${filename}" (Content-Type: ${downloadHeaders.get('Content-Type')}) to client.`);
                return new Response(externalResponse.body, { status: 200, headers: downloadHeaders });
            } catch (error) {
                console.error('Backend: Error in /api/download-proxy:', error);
                let clientErrorMessage = "Proxy error fetching file.";
                if (error instanceof TypeError && error.message.includes('fetch')) { clientErrorMessage = "Proxy error: Could not connect to the external file source."; }
                else if (error instanceof Error && error.message.includes('Invalid URL')) { clientErrorMessage = "Proxy error: Invalid external file URL provided."; }
                return new Response(clientErrorMessage, { status: 502, headers: corsHeaders });
            }
        } // End /api/download-proxy

        // --- Static File Serving Logic ---
        if (url.pathname === '/') {
            // *** MAKE SURE THIS PATH IS CORRECT ***
            const htmlFilePath = '../orbe.html'; // Assumes orbe.html is one level UP from ./backend/
            console.log(`[Static] Root path requested. Trying path: ${htmlFilePath}`);
            try {
                const file = Bun.file(htmlFilePath);
                const fileExists = await file.exists();
                if (fileExists) {
                    console.log(`[Static] Serving main HTML file: ${htmlFilePath}`);
                    return new Response(file, { headers: { "Content-Type": "text/html; charset=utf-8" } });
                } else {
                    console.error(`[Static] FAILED: Main HTML file not found at expected path: ${htmlFilePath}`);
                    return new Response(`Application entry point (${htmlFilePath}) not found. Check backend configuration.`, { status: 404, headers: corsHeaders });
                }
            } catch (e) {
                console.error(`[Static] FAILED: Error reading file ${htmlFilePath}:`, e);
                return new Response("Error serving application file.", { status: 500, headers: corsHeaders });
            }
        } // End Static File Serving

        // --- Fallback Route ---
        console.log(`Backend: Path not handled: ${req.method} ${url.pathname}`);
        return new Response("Not Found", { status: 404, headers: corsHeaders });

    }, // End fetch handler

    // --- Server Error Handler ---
    error(error) {
        console.error("Backend Server Error (Bun.serve):", error);
        return new Response("Internal Server Error", { status: 500, headers: { "Access-Control-Allow-Origin": "*" } });
    },
});

console.log(`orbe Backend (v-FINAL w/ Proxy & Direct Link Bypass) listening on http://localhost:${PORT}`);

// --- END OF FILE server.mjs ---