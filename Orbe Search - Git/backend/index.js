// index.js (Bun backend server)
import { searchNewsApi, formatNewsApiResults } from './api_clients/newsApiClient.js';
import { callOllama } from './api_clients/ollamaClient.js'; // Assume this exists
import { searchSerper } from './api_clients/serperClient.js'; // Assume this exists

console.log("Starting orbe Bun server...");

const server = Bun.serve({
    port: 3000, // Or your preferred port
    async fetch(req) {
        const url = new URL(req.url);

        // Endpoint for chat requests from frontend
        if (url.pathname === '/api/chat' && req.method === 'POST') {
            try {
                const body = await req.json();
                const userMessage = body.message;

                if (!userMessage) {
                    return new Response(JSON.stringify({ error: 'No message provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
                }

                console.log("Received message:", userMessage);

                // 1. Determine Intent using Ollama
                const intentPrompt = `Analyze the user query: "${userMessage}". Does the user specifically want recent news articles/headlines? Respond ONLY with NEWS or GENERAL_INFO.`;
                const intentResponse = await callOllama(intentPrompt); // Assuming callOllama returns the text response
                const intent = intentResponse?.trim().toUpperCase() || 'GENERAL_INFO'; // Default to general if Ollama fails

                console.log("Determined intent:", intent);

                let orbeResponse = "Sorry, I had trouble processing that.";

                // 2. Decision Branch
                if (intent === 'NEWS') {
                    // Could ask Ollama to extract keywords here too
                    const keywords = userMessage.replace(/news about|latest on|headlines for/i, '').trim(); // Simple keyword extraction
                    const newsData = await searchNewsApi(keywords);

                    // Option A: Simple formatting
                    // orbeResponse = formatNewsApiResults(newsData, keywords);

                    // Option B: Use Ollama to summarize/format newsData
                     if (newsData.articles) {
                         const newsSummaryPrompt = `You are orbe. The user asked: "${userMessage}". You found these news articles: ${JSON.stringify(newsData.articles)}. Present these findings conversationally.`;
                         orbeResponse = await callOllama(newsSummaryPrompt);
                     } else {
                         orbeResponse = newsData.error || newsData.message || "Couldn't fetch news.";
                     }

                } else { // GENERAL_INFO
                    const serperData = await searchSerper(userMessage);
                    // Assuming serperData has relevant snippets/links
                    const synthesisPrompt = `You are orbe. The user asked: "${userMessage}". Based on this web search context: ${JSON.stringify(serperData)}, provide a comprehensive answer.`;
                    orbeResponse = await callOllama(synthesisPrompt);
                }

                // 3. Send Response to Frontend
                return new Response(JSON.stringify({ reply: orbeResponse }), {
                    headers: { 'Content-Type': 'application/json' },
                });

            } catch (error) {
                console.error("Chat API Error:", error);
                return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
            }
        }

        // Serve static files (HTML, frontend JS) - Basic example
        const filePath = './public' + (url.pathname === '/' ? '/index.html' : url.pathname);
        const file = Bun.file(filePath);
        if (await file.exists()) {
            return new Response(file);
        }

        // Handle other routes or return 404
        return new Response("Not Found", { status: 404 });
    },
    error(error) {
        console.error("Server Error:", error);
        return new Response("Internal Server Error", { status: 500 });
    },
});

console.log(`orbe listening on http://localhost:${server.port}`);