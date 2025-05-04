// utils/intentClassifier.js

// --- Define Intent Types (Constants) ---
export const IntentType = {
    NEWS: 'NEWS',
    BOOKS: 'BOOKS',
    WEATHER: 'WEATHER', // Example for a future addition
    GENERAL_INFO: 'GENERAL_INFO', // Default/Fallback
    UNKNOWN: 'UNKNOWN' // If classification fails badly
};

// --- Keyword-Based Intent Detection ---

// Keywords that strongly suggest a specific intent (prioritize these)
// Order matters slightly - more specific might go first if overlaps exist
const KEYWORD_RULES = [
    // Weather Example (Add more specific weather terms)
    { intent: IntentType.WEATHER, keywords: ['weather in', 'forecast for', 'temperature in', 'is it raining'] },
    // News (Keep your existing keywords)
    { intent: IntentType.NEWS, keywords: ['news about', 'latest news on', 'headlines for', 'articles about', 'what is the news on', 'recent developments', 'updates on', 'newsapi', '/v2/'] },
    // Books (Keep your improved keywords)
    { intent: IntentType.BOOKS, keywords: ['book about', 'books about', 'find book', 'find books', 'books on', 'search books for', 'author of book', 'author of the book', 'about the book', 'book title', 'reading list for', 'recommend book', 'recommend books', 'novel about', 'novels about', 'story about', 'stories about', 'sci-fi book', 'science fiction book', 'book called', 'book named'] }
];

function checkKeywords(lowerQuery) {
    for (const rule of KEYWORD_RULES) {
        if (rule.keywords.some(keyword => lowerQuery.includes(keyword))) {
            console.log(`Backend (Intent): Keyword match found for intent: ${rule.intent}`);
            return rule.intent; // Return the first matching intent
        }
    }
    return null; // No keyword match
}

// --- Main Classification Function (Keywords Only - Initially) ---

/**
 * Classifies the user's query intent. Starts with keywords.
 * (Will be enhanced later with LLM fallback).
 * @param {string} query - The user's raw query.
 * @returns {Promise<IntentType>} - The detected intent type.
 */
export async function classifyIntent(query) {
    if (!query) return IntentType.UNKNOWN;
    const lowerQuery = query.toLowerCase().trim();

    // 1. Try fast keyword matching first
    const keywordIntent = checkKeywords(lowerQuery);
    if (keywordIntent) {
        return keywordIntent; // Return immediately if keywords match
    }

    // 2. Keyword check failed - Fallback to General Info for now
    // (Later, we will add an LLM call here for ambiguous cases)
    console.log(`Backend (Intent): No keyword match. Defaulting to GENERAL_INFO.`);
    return IntentType.GENERAL_INFO;

    // --- Placeholder for LLM Classification Fallback ---
    /*
    console.log(`Backend (Intent): No keyword match. Attempting LLM classification...`);
    // TODO: Implement Ollama call here with a classification prompt
    // const llmIntent = await classifyWithLLM(query); // Need to create this function
    // return llmIntent || IntentType.GENERAL_INFO; // Default if LLM fails
    */
}


// --- Topic Extraction Logic (Centralized) ---

// Patterns should be adjusted based on testing
const NEWS_PATTERNS = [/news about\s+/i, /latest news on\s+/i, /headlines for\s+/i, /articles about\s+/i, /what is the news on\s+/i, /recent developments\s+/i, /updates on\s+/i, /newsapi\s+/i, /\/v2\/.*\//i];
const BOOK_PATTERNS = [/^find\s*/i, /^search\s*/i, /^look for\s*/i, /^recommend\s*/i, /^tell me about\s*/i, /^(the\s*)?book(s)?\s+about\s+/i, /^(a\s*)?book(s)?\s+on\s+/i, /^(the\s*)?book(s)?\s+called\s+/i, /^(the\s*)?book(s)?\s+named\s+/i, /^search\s+books\s+for\s+/i, /^(the\s*)?author\s+of\s*/i, /\s+book(s)?$/i, /\s+novel(s)?$/i];
const WEATHER_PATTERNS = [/weather in\s+/i, /forecast for\s+/i, /temperature in\s+/i, /is it raining in\s+/i]; // Example

/**
 * Extracts the core topic/subject from a query based on the detected intent.
 * @param {string} query - The user's raw query.
 * @param {IntentType} intent - The classified intent.
 * @returns {string} The extracted topic or the original query if no specific extraction applies.
 */
export function extractTopic(query, intent) {
    let term = query;
    let patternsToRemove = [];

    switch (intent) {
        case IntentType.NEWS:
            patternsToRemove = NEWS_PATTERNS;
            break;
        case IntentType.BOOKS:
            patternsToRemove = BOOK_PATTERNS;
            break;
        case IntentType.WEATHER:
            patternsToRemove = WEATHER_PATTERNS;
            break;
        case IntentType.GENERAL_INFO:
        default:
            // For general info, usually use the whole query for Serper
            return query.trim();
    }

    patternsToRemove.forEach(pattern => {
        term = term.replace(pattern, '');
    });

    // A final cleanup for generic leading/trailing phrases missed by specific patterns
    term = term.replace(/^(what is|what's|tell me about)\s+/i, '');
    term = term.replace(/\?$/, ''); // Remove trailing question mark

    return term.trim();
}

// --- Placeholder for LLM Classification Function ---
/*
import { callOllama } from '../api_clients/ollamaClient.js'; // Adjust path
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_CLASSIFICATION_MODEL = process.env.OLLAMA_CLASSIFICATION_MODEL || "llama3:latest"; // Maybe use a smaller/faster model?

async function classifyWithLLM(query) {
    const classificationPrompt = `Classify the user's primary intent based on their query. Respond ONLY with one of the following labels: NEWS, BOOKS, WEATHER, GENERAL_INFO. Do not add any explanation. User Query: "${query}"\nIntent Label:`;

    // Note: callOllama currently returns a streaming Response. We need the full text here.
    // We might need to adapt callOllama or use a different non-streaming fetch call.
    // THIS PART NEEDS ADJUSTMENT TO GET FULL RESPONSE TEXT
    const response = await callOllama(OLLAMA_API_URL, OLLAMA_CLASSIFICATION_MODEL, classificationPrompt); // This needs modification

    if (response && response.ok) {
        // TODO: Read the FULL response text from the Ollama call
        const responseText = (await response.text()).trim().toUpperCase(); // Placeholder
         if (Object.values(IntentType).includes(responseText)) {
             console.log(`Backend (Intent): LLM classified intent as: ${responseText}`);
             return responseText;
         } else {
             console.warn(`Backend (Intent): LLM classification returned unexpected label: ${responseText}`);
         }
    } else {
         console.error(`Backend (Intent): LLM classification call failed. Status: ${response?.status}`);
    }
    return null; // Fallback if LLM fails
}
*/