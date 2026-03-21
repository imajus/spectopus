## Context

The generation pipeline needs tools to gather contract data before the LLM can generate a skill. Basescan (Base's block explorer) provides REST APIs for ABI and source code. These tools must be wrapped as Vercel AI SDK tool definitions so the Research stage agent can call them.

## Goals / Non-Goals

**Goals:**
- Reliable ABI and source code fetching from Basescan API
- ERC standard detection from ABI function signatures
- Tools formatted for Vercel AI SDK `tool()` definitions with zod schemas

**Non-Goals:**
- Support for non-EVM chains
- Support for block explorers other than Etherscan-compatible APIs
- Caching or rate limiting (keep simple for PoC)

## Decisions

**Single block explorer client module** — `src/tools/explorer.js` handles all Basescan/Etherscan HTTP calls. Uses native `fetch`. No axios or other HTTP libraries.

**ERC detection via signature matching** — Compare ABI function names and signatures against known ERC interface definitions. Pure function, no network calls. Covers ERC-20, ERC-721, ERC-1155, ERC-4626 as initial set.

**AI SDK tool wrappers in separate file** — `src/tools/research.js` exports Vercel AI SDK `tool()` definitions that call the explorer and detection functions. This keeps the raw API client testable independently from the AI SDK integration.

**Chain ID to explorer URL mapping** — Simple object mapping chain IDs to base URLs. Start with Base Mainnet (8453) and Base Sepolia (84532). Extensible by adding entries.

## Risks / Trade-offs

**Basescan rate limits** → For PoC, accept potential 429s. Future: add retry with backoff.

**Unverified contracts have no source code** → `fetchSourceCode` returns null. The pipeline must handle this gracefully — skill generation works with ABI alone, source is supplementary.
