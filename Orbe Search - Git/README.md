# Orbe Backend Setup

This folder contains the Bun.js backend server for Orbe.

## Prerequisites

*   [Bun](https://bun.sh/) must be installed.
*   An [Ollama](https://ollama.com/) instance must be running.
*   Required Ollama models (check `.env.example`) must be pulled (e.g., `ollama pull qwen3:14b`).
*   API keys (e.g., Serper) are needed.

## Steps

1.  **Install Dependencies:**
    Open a terminal in this (`Orbe-backend`) directory and run:
    ```bash
    bun install
    ```
2.  **Configure Environment:**
    *   Copy the `.env.example` file to a new file named `.env`:
      ```bash
      cp .env.example .env
      ```
      (Or just copy/paste and rename using your file explorer).
    *   **Edit the `.env` file** and replace the placeholders (`YOUR_..._HERE`) with your actual API keys and verify the `OLLAMA_API_URL`, `OLLAMA_MODEL`, etc. settings.
3.  **Run the Server:**
    In the same terminal (still in the `Orbe-backend` directory), run:
    ```bash
    bun run server.mjs
    ```
    Keep this terminal open while using the Orbe frontend.

**(Note:** You also need the main `Orbe.html` file served, typically by accessing `http://localhost:PORT` where `PORT` is defined in your `.env` file, usually 3001).