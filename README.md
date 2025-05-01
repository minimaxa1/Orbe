# Orbi ✨ (Ollama Advanced Web UI)

![Screenshot 2025-05-01 114120](https://github.com/user-attachments/assets/007bce36-e82e-4a3d-bbea-abe8fd76fc50)


Orbi is a feature-rich, single-file web interface designed to interact directly with a locally running Ollama instance. It provides a highly customizable chat experience with advanced controls, multimedia output, code handling, and configuration management, all within your browser without needing complex server setups. 

## ✨ Key Features

*   **Direct Local Ollama Interaction:** Connects directly to your `http://localhost:11434` Ollama API endpoint.
*   **Streaming Responses:** Displays AI responses word-by-word as they are generated.
*   **Model Management:**
    *   Fetches and displays available Ollama models.
    *   Select the desired model for conversation.
    *   View detailed model information (parameters, template, license).
    *   Delete models directly from the UI.
*   **🤖 Personality Modes & Prompts:**
    *   Pre-defined modes (Default, Coder, Business, Creative, Wizard) with tailored system prompts.
    *   **Wizard Mode:** Aims for direct, concise output without conversational filler.
    *   Custom system prompt editor for fine-tuning AI behavior.
    *   **Language Fix:** System prompts explicitly instruct the AI to respond *only* in English.
*   **⚙️ Advanced Parameter Control:**
    *   Adjust Temperature, Top P, Top K, Repeat Penalty, Seed, Context Window (`num_ctx`), and Stop Sequences.
    *   Reset parameters to defaults.
*   **🗣️ Text-to-Speech (TTS):**
    *   Enable/disable speech output for AI responses.
    *   Select from available system voices (filtered for English).
    *   Pause/resume speech playback.
    *   Cycle through different speech rates (1.0x, 1.5x, 2.0x).
*   **📝 Chat & Context Management:**
    *   Full conversation history displayed.
    *   Clear entire chat history and context.
    *   Clear only the context sent to the model (keeps visual history).
    *   Regenerate the last AI response.
    *   Visual indicator for the number of turns included in the context window.
*   **💻 Rich Code Block Handling:**
    *   Automatic language detection and syntax highlighting (via Prism.js).
    *   **Copy Code:** Easily copy the code within a block.
    *   **Save Snippet:** Save code blocks to a persistent snippets panel.
    *   **Edit Code:** Open code in a modal editor to make changes.
    *   **Use Code:** Insert code block content directly into the input area.
    *   **Code Actions:** Buttons to quickly ask the AI to:
        *   Explain the code.
        *   Refactor the code.
        *   Find bugs in the code.
        *   Optimize the code.
        *   Add documentation/comments to the code.
*   **📑 Code Snippet Management:**
    *   Persistent panel to store and manage saved code snippets.
    *   View snippets by language and preview.
    *   Use snippets in the input area.
    *   Delete snippets.
*   **💾 Configuration Presets:**
    *   Save combinations of selected model, mode/system prompt, and generation parameters as named presets.
    *   Load presets to quickly switch configurations.
    *   Delete saved presets.
    *   Export all presets to a JSON file.
    *   Import presets from a JSON file (overwrites existing).
*   **🎨 Visual Feedback:**
    *   Animated particle background.
    *   Central "orb" visualizer that reacts to AI state (idle, thinking, speaking).
*   **🔒 Persistence:** Settings, snippets, and presets are saved locally in the browser's `localStorage`.
*   **🚀 Single-File:** Runs entirely from a single HTML file.

## Prerequisites

1.  **Ollama:** You need Ollama installed and running locally.
    *   Download from [ollama.com](https://ollama.com/).
    *   Ensure the Ollama server is running (usually via `ollama serve` or the desktop application). It must be accessible at `http://localhost:11434`.
2.  **Ollama Models:** You need at least one model pulled into Ollama.
    *   Example: `ollama pull llama3`
3.  **Modern Web Browser:** Chrome, Firefox, Edge, or Safari recommended. Requires support for Fetch API, Canvas, Web Speech API (for TTS), and ES6 JavaScript.

## Setup

1.  **Ensure Ollama is running** and accessible at `http://localhost:11434`.
2.  Node.js is running - open cmd run: npx serve . -l 8080 --cors
3.  **Download** the `Orbi.html` file.
4.  **Open** the `Orbi.html` file directly in your web browser (e.g., using `File -> Open File...`).

That's it! Orbi should load, fetch your available Ollama models, and be ready to use.

## Usage Guide

1.  **Select Model:** Choose an available model from the model dropdown list.
2.  **(Optional) Select Mode:** Choose a personality mode (Default, Coder, etc.) or click "Sys" to set a custom system prompt.
3.  **(Optional) Adjust Parameters:** Expand "Advanced Options" to fine-tune generation parameters.
4.  **Ask Question:** Type your query into the text area at the bottom and press `Enter` (or Shift+Enter for newline).
5.  **Interact:**
    *   Use controls in the `controls-row` to manage TTS, snippets, chat history, or regenerate responses.
    *   Interact with code blocks using the buttons provided below them (copy, edit, save, explain, etc.).
    *   Save/load configurations using the Presets controls.

## Configuration Details

*   **Modes & System Prompt:** Selecting a mode applies a pre-defined system prompt. Clicking "Sys" opens a modal to edit the system prompt directly, automatically switching the mode to "Custom". The Wizard mode is designed for direct command execution.
*   **Parameters:** Found under "Advanced Options". These directly map to Ollama generation parameters. `Seed=0` means random, `Context Window=0` lets Ollama decide.
*   **Presets:** Save complex configurations (model + mode/prompt + parameters) for easy recall via the Preset dropdown and save/delete buttons. Import/Export allows sharing or backing up presets.
*   **TTS:** Toggle TTS on/off. Select a preferred voice from the dropdown (only English voices are listed). Use the play/pause and speed controls during playback.
*   **Snippets:** Save useful code blocks via the bookmark icon on code blocks. Access them via the "📑" button. Use or delete saved snippets from the panel.

## Known Issues / Limitations

*   **CORS:** While designed for `localhost`, if you run Ollama on a different origin, you might encounter CORS issues. Ensure Ollama is configured with appropriate `OLLAMA_ORIGINS`.
*   **Web Speech API:** TTS functionality depends on browser support for the Web Speech API, which can vary. Voice availability depends on your operating system and browser.
*   **`localStorage` Limits:** Settings, snippets, and presets are stored in `localStorage`, which has size limits and is specific to the browser profile and origin (the file path if opened locally). Clearing browser data may remove saved items.
*   **Error Handling:** While attempts are made to catch errors, issues with the Ollama connection or unexpected responses might cause problems. Check the browser's developer console (F12) for detailed errors.

## Contributing

This is currently a single-file project. Contributions like bug fixes, feature suggestions, or UI improvements can be made via standard Git workflows (Pull Requests) if this project is hosted on a platform like GitHub.

## License

[MIT, Apache 2.0]


Enjoy!

Bohemai 
