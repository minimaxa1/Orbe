# Orbe - Ai Web Search Edition

An enhanced Orbe web interface for interacting with local Ollama language models and featuring built-in AI web search capabilities.

It features two primary modes:
1.  **Direct Ollama:** Chat directly with any locally installed Ollama model, utilizing configurable generation parameters and personality modes.
2.  **Orbe Web Search:** Leverages a custom Bun backend (`Orbe-backend/server.mjs`) to perform real-time web searches (via Serper API), processes the results (including embedding-based ranking and file identification), combines this context with your query and selected personality mode, and then queries Ollama for a synthesized, context-aware answer.

![image](https://github.com/user-attachments/assets/6bcfcd46-0f7a-422c-ad35-f8c1608ddd07)


## Features

*   **Dual Modes:**
    *   **Direct Ollama:** Chat directly with local Ollama models. Supports parameters (Temperature, Top P, Top K, Repeat Penalty, Seed, Context Window, Stop Sequences) and personality modes (Default, Coder, Business, Creative, Wizard) applied directly to the Ollama request.
    *   **Orbe Web Search:** Queries the Bun backend which:
        *   Performs web search (Serper).
        *   *(Optional: Ranks results using embeddings via `nomic-embed-text` or configured model).*
        *   Identifies potential downloadable file links.
        *   Constructs context including search results and potential download links (formatted for proxy download).
        *   Sends the context, query, and mode-specific system prompt to the specified backend Ollama model.
        *   *(Current Limitation: Generation parameters like Temperature/TopP are generally **not** passed to the backend in this mode).*
        *   Features a **Direct File Match Bypass:** If the backend identifies a file link that closely matches the user's query intent (e.g., asking for "X pdf" and finding "X.pdf"), it will immediately return the direct download proxy link, skipping the Ollama generation step for faster downloads.
*   **Local First:** Primarily relies on your local Ollama instance for LLM inference.
*   **Simple Bun Backend:** Uses a lightweight backend (`Orbe-backend/server.mjs`) powered by Bun for web search orchestration.
*   **Configurable Backend:** Uses an `.env` file within the `Orbe-backend` directory for API keys, Ollama URL/model, and port settings.
*   **Streaming Responses:** Supports streaming responses from both Direct Ollama and the Web Search backend.
*   **Voice Interaction:**
    *   **Speech-to-Text:** Click the microphone button to dictate your query or commands.
    *   **Text-to-Speech (TTS):** Enable optional voice output for Orbe's responses, with selectable voices and speed control.
    *   **Voice Commands:** Basic commands like "save last response" are recognized.
*   **Orbe UI Features:**
    *   Visual orb animation reacting to state (thinking, speaking, relaxed).
    *   Background particle effects.
    *   Code block rendering (PrismJS) & actions (Copy, Use, Save Snippet, Play TTS, Edit).
    *   Inline code editing.
    *   Chat history import/export (JSON).
    *   Preset saving/loading for Ollama parameters and source selection.
    *   Text file attachments (appends content to the prompt).
    *   Music player panel (load local audio files).
    *   Movable panels (Music Player).
    *   Snippets manager.

## Prerequisites

*   **Ollama:** Must be installed and running locally. Get it from [ollama.com](https://ollama.com/).
*   **Ollama Model(s):**
    *   At least one **generation model** needs to be pulled (e.g., `ollama pull qwen3:14b`). The model specified in the backend's `.env` (`OLLAMA_MODEL`) **MUST** be available.
    *   *(Optional but Recommended for Web Search Ranking)* An **embedding model** like `nomic-embed-text` should be pulled (`ollama pull nomic-embed-text`) and specified in the backend `.env` (`OLLAMA_EMBEDDING_MODEL`).
*   **Bun:** Required to run the custom backend server. Install from [bun.sh](https://bun.sh/). Verify with `bun --version`.
*   **Serper API Key:** Required for the web search functionality. Get a free key from [serper.dev](https://serper.dev/).
*   **Modern Web Browser:** Chrome, Edge recommended for best Web Speech API support. Firefox may work.
*   **(Optional) NewsAPI Key:** If using the news intent feature (requires code modifications in `server.mjs`). Get from [newsapi.org](https://newsapi.org/).
*   **(Optional) Book API Key:** If enabling the Google Books client (requires code uncommenting/modification in `server.mjs`).

## Setup

1.  **Get the Code:**
    *   Clone the repository:
        ```sh
        git clone https://github.com/minimaxa1/Orbe.git
        cd Orbe
        ```


2.  **Configure Backend (`.env`):**
    *   Navigate to the `Orbe-backend` directory: `cd Orbe-backend`
    *   Create a file named `.env`.
    *   Add the following content, replacing placeholders with your actual values:
        ```dotenv
        # --- Orbe Backend Configuration ---

        # Port for this backend server to listen on (default: 3001)
        PORT=3001

        # Serper API Key for web search (REQUIRED - Get from serper.dev)
        SERPER_API_KEY=YOUR_SERPER_API_KEY_HERE

        # URL of your running Ollama instance (usually localhost if backend runs on the same machine)
        OLLAMA_API_URL=http://localhost:11434

        # Ollama model the BACKEND uses for web search synthesis & intent classification
        # Make sure this model is pulled in Ollama (e.g., ollama pull qwen3:14b)
        OLLAMA_MODEL=qwen3:14b

        # Ollama model for embeddings (REQUIRED for contextProcessor.js ranking)
        # Make sure this model is pulled (e.g., ollama pull nomic-embed-text)
        OLLAMA_EMBEDDING_MODEL=nomic-embed-text

        # (Optional) NewsAPI Key if using the news feature
        # NEWSAPI_API_KEY=YOUR_NEWSAPI_KEY_HERE

        # (Optional) Google Books API Key if using that client
        # GOOGLE_BOOKS_API_KEY=YOUR_GOOGLE_BOOKS_KEY_HERE
        ```

3.  **(Optional but Recommended) Configure Ollama CORS:**
    *   Needed for the Orbe frontend to directly list your installed Ollama models and potentially connect directly.
    *   Stop Ollama if it's running.
    *   Restart it using **one** of the following commands in your terminal:
        *   **CMD (Windows):** `set OLLAMA_ORIGINS=* && ollama serve`
        *   **PowerShell (Windows):** `$env:OLLAMA_ORIGINS='*'; ollama serve`
        *   **macOS/Linux:** `OLLAMA_ORIGINS='*' ollama serve`
    *   Keep the terminal where Ollama is running open.
    *   *(Security Note: `*` allows any origin. For better security, restrict to `http://localhost:3001` or the specific origin serving your frontend).*

## Running the Application

You need two components running simultaneously:

1.  **Start the Backend Server:**
    *   Open a terminal window.
    *   Navigate to the `Orbe-backend` directory.
    *   Run the server:
        ```sh
        bun run server.mjs
        ```
    *   Keep this terminal open. Watch for the "listening on http://localhost:3001..." message and any potential errors.

2.  **Open the Orbe Frontend:**
    *   Open your web browser and navigate to `http://localhost:3001` (or the port specified in your `.env`). The Bun backend should serve the main HTML file.

## Usage

1.  **Select Source:**
    *   `"Orbe Web Search"`: Uses the Bun backend for context-aware responses via Serper and Ollama. Features direct file link bypass. *(Generation parameters like Temp/TopP are generally ignored).*
    *   `Ollama Model Name` (e.g., `"qwen3:14b"`): Connects directly to Ollama. All parameters and modes apply. *(Requires Ollama CORS enabled for the list to populate).*
2.  **Select Mode (Optional):** Choose a personality (Default, Coder, etc.). Affects prompts in both modes.
3.  **Chat:** Type your query or click the **Microphone Button** <kbd><i data-feather="mic"></i></kbd> to use voice input.
4.  **File Downloads:** When using "Orbe Web Search":
    *   If your query directly matches a file found (e.g., "download datasheet pdf"), Orbe should respond immediately with a link like `[filename](/api/download-proxy?url=...)`.
    *   If Ollama generates the response, it *may* include relevant proxy download links based on the context provided by the backend.
    *   Clicking these `/api/download-proxy/...` links triggers the download via the backend.

## Troubleshooting

*   **UI Issues (Blank Page, Missing Buttons/Particles):**
    *   Check the browser's Developer Console (**F12** -> **Console**) for JavaScript errors *first*. Address any errors shown there.
    *   Ensure the `htmlFilePath` variable in `server.mjs` correctly points to your main HTML file (`../Orbi.html` or similar).
    *   Verify external scripts (Howler, Prism, Feather) are loading in the Network tab (F12).
*   **"Error fetching models" / Dropdown Missing Ollama Models:**
    *   Ollama needs CORS configured. Restart Ollama using `OLLAMA_ORIGINS='*'` (see Setup Step 3).
    *   Ensure Ollama is running.
*   **Errors Using "Orbe Web Search":**
    *   `Failed to fetch` / `Could not reach the Orbi Backend`: The Bun backend (`server.mjs`) isn't running or is blocked. Check the backend terminal. Verify the `PORT` in `.env`.
    *   `502 Bad Gateway` / `Ollama Interaction Failed`: Backend reached, but couldn't talk to Ollama. Check backend logs. Verify Ollama is running, `OLLAMA_API_URL` is correct, and the `OLLAMA_MODEL` in `.env` is pulled (`ollama list`).
    *   `Search failed` / `API key missing/invalid`: Check `SERPER_API_KEY` in `.env`. Verify it's correct and active on serper.dev. Check backend logs.
*   **Errors Using Direct Ollama Mode:**
    *   Ensure Ollama is running at `http://localhost:11434` (or the URL in Orbe's *frontend* settings if modified there).
    *   Check browser console (F12) for CORS errors if the model list populated but requests *to Ollama* fail.
*   **Voice Input Not Working:**
    *   Grant microphone permission when prompted.
    *   Use Chrome/Edge for best compatibility.
    *   Ensure page is served via `http://localhost` (not `file:///`).
    *   Check browser console (F12) for "Speech recognition error" messages.

## License

This project is licensed under the GPL License - see the `LICENSE` file for details (if one exists in the repo).

## Acknowledgements

*   Ollama Team ([ollama.com](https://ollama.com/))
*   Bun Team ([bun.sh](https://bun.sh/))
*   Serper ([serper.dev](https://serper.dev/))
*   PrismJS ([prismjs.com](https://prismjs.com/))
*   Feather Icons ([feathericons.com](https://feathericons.com/))
*   Howler.js ([howlerjs.com](https://howlerjs.com/))
*   Particles lots of particles

Enjoy the freedom of open search and prompt!

Bohemai
