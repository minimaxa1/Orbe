Orbe - Ai Web Search Edition

An enhanced Orbe web interface for interacting with local Ollama language models and Ai web search built in.

It features two modes: direct interaction with Ollama and a web-augmented mode that uses a custom Bun backend to fetch real-time web search results (via Serper API) before querying Ollama.

Orbe v1.1 version simplifies the setup with a straightforward Bun process and .exe file.

Features
Dual Modes:
Direct Ollama: Chat directly with any locally installed Ollama model. Supports configurable parameters (Temperature, Top P, etc.) and personality modes (Coder, Business, Wizard, etc.) applied directly to the Ollama request.
Orbe Web Search: Queries are sent to the custom Bun backend. The backend performs a web search (Serper), combines results with the query and the selected personality mode's system prompt, and then asks Ollama for a synthesized answer. (Note: Generation parameters like Temperature are not passed to the backend in this mode currently).
Local First: Relies on your local Ollama instance for LLM inference.
Simple Bun Backend: Uses a lightweight backend (Orbe-backend/server.mjs) powered by Bun. (If Bun intergrates with Electron, this will further consolidate this extra step into the .exe)
Configurable Backend: Uses an .env file within the Orbe-backend directory for API keys, Ollama URL, and the default model used by the backend.
Streaming Responses: Supports streaming responses from both direct Ollama and the web search backend.
Orbe UI Features: Retains core Orbe features:
Visual orb animation
Text-to-Speech (TTS) output
Code block rendering & actions (Copy, Use, Save Snippet - Note: Explain/Refactor actions disabled in Web Search mode)
Inline code editing
Chat history import/export
Preset saving/loading (saves selected source and Ollama-specific settings)
File attachments (appends text content to prompt)
Prerequisites
Ollama: Must be installed and running locally.
Ollama Model(s): At least one model needs to be pulled (e.g., ollama pull qwen3:14b). The model specified in the backend's .env (OLLAMA_MODEL) MUST be available.
Bun: Required to run the custom backend server. Install from the official website (curl -fsSL https://bun.sh/install | bash or check Windows instructions). Verify with bun --version.
Serper API Key: Required for the web search functionality. Sign up for a free API key.
Modern Web Browser: Chrome, Firefox, Edge, etc.
Setup
Get the Code: Clone the repository and download the 75mb .exe Orbe file (Virus Checked & Tested): https://drive.google.com/file/d/1GYTJZMx1Kd0WsSofsXpH9XcZLcyKvTmR/view?usp=sharing

Configure .env: Add the following content, replacing placeholders:

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
(Optional but Recommended) Configure Ollama CORS: For the Orbe frontend to list your installed Ollama models in the "Source" dropdown, restart your Ollama server with CORS enabled:

Stop Ollama if running.
Start using one of these commands:
CMD: set OLLAMA_ORIGINS=* then ollama serve
PowerShell: $env:OLLAMA_ORIGINS='*' then ollama serve
macOS/Linux: OLLAMA_ORIGINS='*' ollama serve
Keep the Ollama terminal running.
Running the Application
You need two components running simultaneously:

Start the Backend Server:

Open a terminal window.
Navigate to the Orbe-backend directory.
Run: bun server.mjs
Keep this terminal open. Look for the "Starting Orbe backend (Bun)..." message.
Open the Orbe Frontend:

Navigate to the Orbe.exe file and run.
Usage
Select Source: Use the top dropdown menu in the Orbe interface:
"Orbe Web Search": Uses the running Bun backend. It combines search results with the currently selected Mode's prompt before asking Ollama. Generation parameters (Temperature, etc.) are not currently sent to the backend.
Ollama Model Name (e.g., "qwen3:14b"): Connects directly to Ollama. All parameters and modes apply. Requires Ollama CORS to be enabled for the list to populate.
Select Mode (Optional): upload Mode.json file to choose a personality (Default, Coder, Wizard, etc.). This affects both Direct Ollama and Orbe Web Search modes.
Chat: Type your query and press Enter.
Troubleshooting
Frontend UI Issues (Blank Buttons, No Particles): Check the browser's Developer Console (F12 -> Console) for JavaScript errors in the HTML file. Ensure you are using the final corrected HTML version. Make sure Feather Icons script loads (Network tab).
"Error fetching models" / Dropdown Missing Ollama Models: Your Ollama server likely doesn't have CORS enabled. Restart Ollama using the OLLAMA_ORIGINS='*' command (see Setup Step 5).
Errors Using "Orbe Web Search":
Failed to fetch in Orbe UI: The Bun backend (bun server.mjs) is likely not running or not accessible on the configured port (default 3001). Check the backend terminal.
502 Bad Gateway or Ollama request failed in Orbe UI: The Bun backend was reached, but it failed to get a response from Ollama. Check the backend terminal logs for specific Ollama errors (e.g., 404 Not Found, connection refused). Verify Ollama is running and the OLLAMA_MODEL in .env is correct and available (ollama list).
Search failed or Search API key not configured: Check the SERPER_API_KEY in the backend's .env file. Ensure it's correct and has queries remaining. Check the backend terminal logs for details.
Errors Using Direct Ollama Mode: Ensure Ollama is running and accessible at http://localhost:11434 (or your configured address). Check the browser console for CORS errors if the model list populated but requests fail.
License
*This project is licensed under GPL. See the LICENSE file for details.

Acknowledgements
Ollama Team
Bun Team
Serper.dev
PrismJS
Feather Icons
Particles
Enjoy the open freedom to search and prompt!

Bohemai
