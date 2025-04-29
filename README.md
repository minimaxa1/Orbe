# Orbi ✨ (Ollama Advanced Web UI)

Orbi is a visually engaging, single-file HTML web interface for interacting with locally running Ollama models. It provides real-time streaming responses, text-to-speech output, and dynamic visual feedback through animated particle effects in an "orb" display.


![Screenshot 2025-04-29 001448](https://github.com/user-attachments/assets/ae20d5e4-0fc6-4347-8c16-041061ec0328)



## Features

*   **Direct Ollama Integration:** Connects to your running Ollama instance (defaults to `http://localhost:11434`).
*   **Model Selection:** Choose from available Ollama models directly in the UI (includes defaults like Gemma3, Deepseek-r1:8b, Llama 3, Mistral - requires models to be pulled locally).
*   **Text-to-Speech (TTS):** Enable voice output for Orbi's responses using browser-native speech synthesis.
*   **Voice Selection:** Choose from available English system voices for TTS.
*   **Streaming Responses:** See the model's response generate in real-time.
*   **Dynamic Visual Feedback:**
    *   **Orb Animation:** The central orb animates differently based on state:
        *   *Idle:* Gentle, relaxed particle movement.
        *   *Thinking/Generating:* Energetic swirling/whirlpool effect around the edge.
        *   *Speaking (TTS):* Particle wave pattern synchronized with speech output.
    *   **Background Particles:** Subtle, slowly color-cycling background particle effect.
*   **Interactive Orb:** Orb particle colors change based on mouse position over the orb container.
*   **Chat Interface:** Standard chat display with user questions and Orbi answers.
*   **Usability Controls:**
    *   Clear Chat button.
    *   Copy Response button for easy sharing.
    *   Stop Generation button to interrupt lengthy responses.
*   **Session Logging:** Automatically prompts to download a text file log of the current session when the browser tab/window is closed (`beforeunload` event).
*   **Single File:** Runs entirely from a single HTML file, no server or build process needed.

## Prerequisites

1.  **Ollama Installation:** You **must** have Ollama installed and running on your local machine.
    *   Download and install from [https://ollama.ai/](https://ollama.ai/).
    *   Ensure the Ollama application/service is running in the background.
2.  **Ollama Models:** You need to have the models you want to use pulled locally via Ollama. The UI dropdown includes common models by default, but they won't work unless pulled. Open your terminal/command prompt and run:
    ```bash
    ollama pull gemma3:12b
    ollama pull deepseek-r1:8b
    ollama pull llama3
    ollama pull mistral
    # Pull any other models you wish to use
    ```
3.  **Web Browser:** A modern web browser that supports `fetch`, `SpeechSynthesis`, and `Canvas` (e.g., Chrome, Firefox, Edge).

## Installation

There is no complex installation process required.

1.  **Download:** Download the latest `Orbi.html` file (e.g., `Orbi.html`) from this repository.
    *Alternatively, you can clone the repository:*
    ```bash
    git clone https://your-github-repo-url/orbi.git
    cd orbi
    ```
2.  **That's it!** No build steps or dependencies are needed besides Ollama, models and node.js.

## Running Orbi

1.  Download node.js and set up
2.  Download and start Ollama: Ensure your Ollama service runs locally.
4.  Open cmd and start the local host: npx serve . -l 8080 --cors
5.  ![image](https://github.com/user-attachments/assets/c8c2d128-1002-44a3-a534-28644952f6bf)

6.  **Open the HTML File:** Simply open the downloaded `OrbiXX.html` file directly in your web browser (e.g., double-click the file or use `File -> Open File...` in your browser).
7.  **Make sure http://localhost:8080/Orbi is in the correct directory
8.  If you add more models, make sure you update the line of code in a text editor (notepad) and save:
  
                     <select id="modelSelector" class="control-item">
                     <option value="gemma3:12b" selected>Gemma3 12B</option>
                     <option value="deepseek-coder-v2">DeepSeek Coder V2</option>
                     <option value="llama3">Llama 3</option>
                     <option value="mistral">Mistral</option>


**Note on CORS:** Orbi attempts to communicate with Ollama at `http://localhost:11434`. Default Ollama configurations usually allow requests from `file://` origins, but if you encounter connection errors (check the browser's developer console - F12), you might need to adjust Ollama's CORS settings (e.g., by setting the `OLLAMA_ORIGINS` environment variable before starting Ollama). Refer to the Ollama documentation for details.

## Usage Guide

1.  **Ask a Question:** Type your prompt into the input box at the bottom labeled "Ask Orbi" and press `Enter`.
2.  **Model Selection:** Use the first dropdown menu in the bottom bar to choose which installed Ollama model to use for the response.
3.  **Voice Selection:** Use the second dropdown menu to select a system voice for TTS output (if enabled). "(M)" indicates male, "(F)" indicates female where detected.
4.  **TTS Toggle:** Click the slider switch to enable (`green`) or disable (`grey`) text-to-speech output for Orbi's responses.
5.  **Clear Chat:** Click the 'C' button to clear the current chat history from the display.
6.  **Stop Generation:** While Orbi is generating a response ("...consults..." message visible, orb swirling), a "Stop" button will appear. Click it to abort the current request.
7.  **Orb Visuals:**
    *   **Idle:** Gentle particle movement. Mouse over the orb container to change particle target colors.
    *   **Thinking:** Particles swirl around the edge while waiting for Ollama.
    *   **Speaking:** Particles move in a wave pattern while TTS is active.
8.  **Copy Response:** Hover over an Orbi message bubble and click the '📋' icon that appears in the bottom-right corner to copy the text content.
9.  **Session Log:** When you close the browser tab/window, your browser should prompt you to save a `.txt` file containing the session's chat history.

## Contributing

Contributions are welcome! Feel free to open issues for bugs or feature requests, or submit pull requests. Please try to maintain the existing code style.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (or add license text here).

---
Enjoy!

Bohemai 
