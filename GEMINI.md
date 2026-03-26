# Spectopus: AI-Powered Agent Skill Generator

Spectopus is an autonomous agent service that researches smart contracts on Base Mainnet and generates high-quality [Agent Skills](https://agentskills.io) (portable `SKILL.md` files). It uses a research-generate-validate pipeline to ensure accuracy and safety, monetizing its services via [x402](https://x402.org) micropayments in USDC.

## Project Overview

*   **Goal:** Provide AI agents and developers with ready-to-use, validated skills for interacting with any smart contract.
*   **Core Architecture:**
    *   **3-Stage Pipeline:**
        1.  **Research:** ReAct agent fetches ABI, source code, and detects ERC patterns (ERC-20, 721, 1155) using block explorer APIs.
        2.  **Generate:** LLM (GPT-5) produces a `SKILL.md` file with typed function signatures and `viem` code examples.
        3.  **Validate:** Cross-checks output against the real ABI and runs safety scans. Retries on failure (max 2 times).
*   **Technologies:**
    *   **Runtime:** Node.js (ES Modules) + Express.
    *   **AI:** LangChain + LangGraph (ReAct agent) + OpenAI (GPT-5).
    *   **Payments:** x402 via PayAI facilitator (USDC on Base).
    *   **Storage:** In-memory session tracking + permanent artifact storage on Filecoin (via Synapse SDK).
    *   **Discovery:** Auto-indexed on x402 Bazaar.

## Building and Running

### Prerequisites
*   Node.js (v18+)
*   Environment variables (see `.env.example`):
    *   `OPENAI_API_KEY`: For LLM calls.
    *   `BASESCAN_API_KEY`: For contract research.
    *   `FILECOIN_PRIVATE_KEY`: For Synapse storage.
    *   `PAY_TO_ADDRESS`: Your wallet to receive USDC.

### Commands
*   **Install Dependencies:** `npm install`
*   **Run Development Server:** `npm run dev` (uses `--watch` mode)
*   **Start Production Server:** `npm start`
*   **Run Tests:** `npm test` (uses `vitest`)
*   **Run Specific Test:** `npx vitest src/path/to/file.test.js`

## API Reference

*   `POST /skills/generate` ($0.10 USDC): Initiates skill generation for a `contractAddress`. Returns a `sessionId` and `statusUrl`.
*   `GET /skills/status/:sid` (Free): Polls the status of a generation session (`processing`, `ready`, `failed`). Includes `skillId` (PieceCID) when complete.
*   `GET /skills/:id` ($0.01 USDC): Returns a permanent Filecoin PDP URL for the generated `SKILL.md` content.
*   `GET /health`: Basic health check.

## Development Conventions

*   **Language:** JavaScript (ESM). Do not use TypeScript, but use `.d.ts` files for type definitions.
*   **Testing:** Co-locate tests with source files (`src/**/*.test.js`). Use `vitest`.
*   **Error Handling:** Fail-closed validation for LLM outputs. Pipeline failures are logged to Filecoin.
*   **Safety:** Rigorous input sanitization (`src/guardrails.js`) and output safety scanning before storage.
*   **Logging:** Structured execution logs are generated for every pipeline run and stored on Filecoin.
*   **Commit Attribution:** AI commits must include:
    ```
    Co-Authored-By: Claude <noreply@anthropic.com>
    ```

## Key Files & Directories

*   `src/index.js`: Server entry point.
*   `src/app.js`: Express application configuration.
*   `src/pipeline/`: Core logic for Research, Generation, and Validation.
*   `src/storage.js`: Session management and Filecoin storage abstraction.
*   `src/routes/skills.js`: x402-protected API routes and payment middleware.
*   `src/guardrails.js`: Central utility for safety and sanitization.
*   `skills/spectopus/SKILL.md`: Self-describing skill for the Spectopus agent.
*   `docs/`: Detailed project Requirements and Specifications.
