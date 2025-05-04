# Orbe - AI Web Search Edition

An enhanced web interface for interacting with local Ollama language models and integrated AI web search.

It features two modes: direct interaction with Ollama and a web-augmented mode that uses a custom Bun backend to fetch real-time web search results (via Serper API) before querying Ollama.

Orbe v1.14 version simplifies the setup with a straightforward Bun process and .html file



https://github.com/user-attachments/assets/7fbb7e6a-f363-43c2-ac0f-f37ea3ef5c32



## Features

*   **Dual Modes:**
    *   **Direct Ollama:** Chat directly with any locally installed Ollama model. Supports configurable parameters (Temperature, Top P, etc.) and personality modes (Chat, Coder, Wizard, etc.) applied directly to the Ollama request.
    *   **Orbe Web Search:** Queries are sent to the custom Bun backend. The backend performs a web search (Serper), combines results with the query *and the selected personality mode's system prompt*, and then asks Ollama for a synthesized answer. (Note: Generation parameters like Temperature are *not* passed to the backend in this mode currently).
*   **Local First:** Relies on your local Ollama instance for LLM inference.
*   **Simple Bun Backend:** Uses a lightweight backend (`Orbe-backend/server.mjs`) powered by Bun.
*   **Configurable Backend:** Uses an `.env` file within the `Orbe-backend` directory for API keys, Ollama URL, and the default model used *by the backend*.
*   **Streaming Responses:** Supports streaming responses from both direct Ollama and the web search backend.
*   **Speech Capabilities:**
    *   **Speech-to-Text (STT):** Use the microphone button for voice input (requires browser permission).
    *   **Text-to-Speech (TTS):** Enable spoken responses with voice selection and rate control.
*   **Orbe UI Features:** Retains core features:
    *   Visual orb animation
    *   Code block rendering & actions (Copy, Use, Save Snippet)
    *   Inline code editing
    *   Chat history import/export
    *   Preset saving/loading (saves selected source and Ollama-specific settings)
    *   File attachments (appends text content to prompt)
    *   Music Player Panel

## Prerequisites

*   **[Ollama](https://ollama.com/)**: Must be installed and running locally.
*   **Ollama Model(s)**: At least one model needs to be pulled (e.g., `ollama pull qwen3:14b`). The model specified in the backend's `.env` (`OLLAMA_MODEL`) MUST be available.
*   **[Bun](https://bun.sh/)**: Required to run the custom backend server. Install from the official website (`curl -fsSL https://bun.sh/install | bash` or check Windows instructions). Verify with `bun --version`.
*   **[Serper API Key](https://serper.dev/)**: Required for the web search functionality. Sign up for a free API key.
*   **Modern Web Browser**: Chrome, Firefox, Edge recommended for best Web Speech API support.
*   **Microphone**: Required for Speech-to-Text input.

## Setup

1.  **Get the Code & Executable:**
    *   Clone the repository: `git clone <repository-url>` (Replace with your repo URL if applicable)
      
2.  **Configure Backend (`Orbe-backend/.env`):**
    *   Navigate into the `Orbe-backend` directory within the cloned repository.
    *   Create a file named `.env`.
    *   Add the following content, replacing placeholders:

    ```dotenv
    # --- Orbe Backend Configuration ---

    # Port for this backend server to listen on (default: 3001)
    PORT=3001

    # Serper API Key for web search (REQUIRED - Get from serper.dev)
    SERPER_API_KEY=YOUR_SERPER_API_KEY_HERE

    # URL of your running Ollama instance (use localhost, backend runs on host)
    OLLAMA_API_URL=http://localhost:11434

    # Ollama model the BACKEND should use for generating web search responses
    # Make sure this model is pulled in Ollama (e.g., ollama pull qwen3:14b)
    OLLAMA_MODEL=qwen3:14b
    ```
3.  **(Optional but Recommended) Configure Ollama CORS:** For the Orbe frontend (`Orbe.exe`) to list your installed Ollama models in the "Source" dropdown and connect directly, restart your Ollama server with CORS enabled:
    *   Stop Ollama if running.
    *   Start using **one** of these commands in your terminal:
        *   Command Prompt (CMD): `set OLLAMA_ORIGINS=*` then `ollama serve`
        *   PowerShell: `$env:OLLAMA_ORIGINS='*'` then `ollama serve`
        *   macOS/Linux: `OLLAMA_ORIGINS='*' ollama serve`
    *   Keep the Ollama terminal running.

## Running the Application

You need **two** components running simultaneously:

1.  **Start the Backend Server:**
    *   Open a terminal/command prompt.
    *   Navigate to the `Orbe-backend` directory (where the `.env` file and `server.mjs` are).
    *   Run: `bun run server.mjs` (or just `bun server.mjs`)
    *   Keep this terminal open. Look for the "Starting Orbe backend (Bun)..." message.

2.  **Run the Orbe Frontend:**
    *   Open the orbe.html in browser - PORT=3001

## Usage

1.  **Select Source:** Use the top-left dropdown menu in the Orbe interface:
    *   **"Orbe Web Search"**: Uses the running Bun backend. Combines search results with the selected Mode's prompt before asking Ollama. Generation parameters (Temperature, etc.) are *not* currently sent to the backend.
    *   **Ollama Model Name (e.g., "qwen3:14b")**: Connects directly to Ollama. All parameters and modes apply. Requires Ollama CORS to be enabled for the list to populate.
2.  **Select Mode (Optional):** Choose a personality (Chat, Coder, Wizard, etc.) using the mode dropdown. This affects both Direct Ollama and Orbe Web Search modes. You can also load presets from a JSON file using the "Import Presets" button (<i data-feather="download"></i>).
3.  **Chat:** Type your query and press Enter, or click the microphone (<i data-feather="mic"></i>) button to use voice input.
4.  **TTS:** Toggle speech output using the "TTS Off/On" button. Use the adjacent buttons to pause/play and cycle speech rate.

## Troubleshooting

*   **Frontend UI Issues (Blank Buttons, No Particles):** Check the developer console within Orbe (often accessible via a menu or shortcut like Ctrl+Shift+I). Look for JavaScript errors. Ensure dependent scripts (Feather Icons) loaded correctly.
*   **"Error fetching models" / Dropdown Missing Ollama Models:** Your Ollama server likely doesn't have CORS enabled. Restart Ollama using the `OLLAMA_ORIGINS='*'` command (see Setup Step 3). Also verify the `OLLAMA_API_URL` in the advanced settings within Orbe points to your running Ollama instance.
*   **Errors Using "Orbe Web Search":**
    *   **`Failed to fetch` or connection errors in Orbe UI:** The Bun backend (`bun run server.mjs`) is likely not running or not accessible on the configured port (default 3001). Check the backend terminal. Ensure no firewall is blocking port 3001.
    *   **`5xx` errors, `Ollama request failed` in Orbe UI:** The Bun backend *was reached*, but it failed to get a response from Ollama. Check the backend terminal logs for specific Ollama errors (e.g., 404 Not Found if the model isn't pulled, connection refused if Ollama isn't running). Verify the `OLLAMA_MODEL` in `.env` is correct and available (`ollama list`).
    *   **`Search failed` or `Search API key not configured`:** Check the `SERPER_API_KEY` in the backend's `.env` file. Ensure it's correct and has queries remaining. Check the backend terminal logs for details.
*   **Errors Using Direct Ollama Mode:** Ensure Ollama is running and accessible (check `OLLAMA_API_URL` in Orbe settings). Check the Orbe developer console for CORS errors if the model list populated but requests fail (see Setup Step 3).
*   **Speech Input Not Working:**
    *   Ensure microphone is connected and selected in your OS sound settings.
    *   Grant microphone permission when the browser/app asks.
    *   Check microphone input levels and **Microphone Boost** in OS settings if you get "No speech detected" errors.
    *   Check the Orbe console for errors like `network`, `audio-capture`, or `not-allowed`.
*   **TTS Output Not Working:**
    *   Ensure the "TTS On" button is active.
    *   Check system and browser/app volume levels.
    *   Try selecting a different voice in the dropdown.
    *   Check the Orbe console for `SpeechSynthesis` errors.

## License

This project is licensed under the terms of the license agreement included in the project files. Please see the LICENSE file for details. (Adjust if using GPL or other specific license).

## Acknowledgements

*   Ollama Team
*   Bun Team
*   Serper.dev
*   Howler.js
*   PrismJS
*   Feather Icons
*   Particles

Enjoy the Freedom of open search and prompt!

*Bohemai*

Art: https://www.deviantart.com/bohemai
