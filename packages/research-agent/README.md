# Pi Research Agent

[![npm version](https://img.shields.io/npm/v/@earendil-works/pi-research-agent.svg)](https://www.npmjs.com/package/@earendil-works/pi-research-agent)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.19-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-purple.svg)](https://modelcontextprotocol.io)

Autonomous research agent that searches the web, analyzes sources, and synthesizes findings into structured reports. Built on [Pi](https://github.com/earendil-works/pi) agent core. Available as a CLI, programmatic API, and MCP server.

## Features

- **Autonomous Research**: Breaks down topics into sub-questions and searches systematically
- **Web Search**: Uses Tavily API for comprehensive web search
- **Source Analysis**: Fetches and extracts content from web pages with retry logic
- **Note Taking**: Saves findings with confidence levels (high/medium/low) and source attribution
- **Report Synthesis**: Generates structured reports in markdown, JSON, or bullet format
- **Skills System**: Extensible via markdown skills in `~/.pi/skills/research/`
- **Multiple Output Modes**: Interactive TUI or simple print mode
- **Automatic Reports**: Saves to `./research-output/<timestamp>-<topic>/`
- **MCP Server**: Expose research capabilities as MCP tools for other agents
- **CLI + Programmatic API**: Use from terminal or embed in your own code

## Installation

```bash
npm install @earendil-works/pi-research-agent
```

## Quick Start

### 1. Get API Keys

- **Tavily** (web search): https://tavily.com/ — free tier: 1,000 searches/month
- **OpenRouter** (LLM): https://openrouter.ai/ — pay-per-use pricing

### 2. Configure

Create a `.env` file in your project root:

```env
TAVILY_API_KEY=your-tavily-key
OPENROUTER_API_KEY=your-openrouter-key
LLM_MODEL=minimax/minimax-m3
```

### 3. Use

**CLI:**

```bash
# Basic research
pi-research "quantum computing breakthroughs 2026"

# Print mode (no TUI)
pi-research --print "AI safety research"

# Custom max turns
pi-research --max-turns 15 "climate change solutions"

# Custom model
pi-research -m openai/gpt-4o "renewable energy trends"
```

**Programmatic:**

```typescript
import { ResearchAgent } from "@earendil-works/pi-research-agent";

const agent = new ResearchAgent({
  maxTurns: 10,
  saveResults: true,
  outputDir: "./research-output",
});

const result = await agent.research("machine learning in healthcare 2026");

console.log(`Turns: ${result.turnsUsed}, Notes: ${result.notes.length}`);
console.log(result.report);
```

**As MCP Server:**

```bash
# Run as MCP server
pi-research-mcp
```

Then configure in your MCP client (Claude Desktop, OpenCode, Cursor, etc.):

```json
{
  "mcp": {
    "research-agent": {
      "type": "local",
      "command": ["node", "node_modules/@earendil-works/pi-research-agent/dist/mcp-cli.js"],
      "enabled": true
    }
  }
}
```

## Available Tools

### CLI / Programmatic

| Tool | Description |
|------|-------------|
| `web_search` | Search the web using Tavily API |
| `read_url` | Fetch and extract content from a URL |
| `save_note` | Save a research finding with confidence level |
| `synthesize_report` | Generate final report from collected notes |

### MCP Server

| Tool | Description |
|------|-------------|
| `research` | Full autonomous research with report generation |
| `quick_search` | Fast web search without full research flow |
| `read_url` | Extract content from a URL |

## Architecture

```
ResearchAgent
  └─> Agent (Pi core)
       ├─> web_search (Tavily API)
       ├─> read_url (URL fetcher + content extraction)
       ├─> save_note (in-memory store)
       └─> synthesize_report (terminates agent)
```

The agent autonomously decides when to search, read, and save findings. After collecting sufficient information, it calls `synthesize_report` to generate a comprehensive markdown report with executive summary, key findings, source citations, and confidence assessment.

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TAVILY_API_KEY` | Yes | — | Tavily API key for web search |
| `OPENROUTER_API_KEY` | Yes | — | OpenRouter API key for LLM |
| `LLM_MODEL` | No | `minimax/minimax-m3` | LLM model to use |

### CLI Options

```
pi-research [options] <topic>

Options:
  -h, --help           Show help
  -v, --version        Show version
  -p, --print          Print mode (no TUI)
  -t, --max-turns <n>  Max research turns (default: 15)
  -m, --model <model>  Model (default: minimax/minimax-m3)
  -o, --output-dir <p> Output directory (default: ./research-output)
  --no-save            Don't save to disk
```

### Programmatic Options

```typescript
interface ResearchAgentOptions {
  model?: Model;                  // LLM model
  thinkingLevel?: ThinkingLevel;  // "off" | "minimal" | "low" | "medium" | "high" | "xhigh"
  maxTurns?: number;              // Max research turns (default: 15)
  tavilyApiKey?: string;          // Tavily API key
  llmApiKey?: string;             // LLM provider API key
  skills?: ResearchSkill[];       // Custom research skills
  outputDir?: string;             // Output directory (default: "./research-output")
  saveResults?: boolean;          // Save to disk (default: true)
}
```

## Output Structure

Results are automatically saved to `./research-output/<timestamp>-<topic>/`:

```
research-output/
  2026-06-04T14-30-45-quantum-computing-2026/
    report.md      # Final research report (markdown)
    report.json    # Full results (report + notes + metadata)
    notes.json     # Collected research notes
```

## Research Skills

Create custom skills in `~/.pi/skills/research/`:

```markdown
---
name: deep-dive
description: Perform deep-dive research on technical topics
max_turns: 15
---

When researching technical topics:
1. Start with official documentation
2. Look for academic papers and whitepapers
3. Check recent blog posts from industry experts
4. Verify claims with multiple sources
```

Skills are automatically loaded and appended to the system prompt.

## Examples

See [`examples/`](./examples) for working code:

- `basic.ts` — Basic programmatic usage
- `custom-model.ts` — Using a different LLM model
- `custom-skills.ts` — Custom research skills
- `with-env.ts` — Environment variable configuration
- `mcp-client.ts` — MCP client example
- `mcp-config-claude.json` — Claude Desktop MCP config
- `mcp-config-cursor.json` — Cursor MCP config

## Documentation

- [MCP Server Guide](./MCP_SERVER.md) — Detailed MCP setup instructions
- [MCP Architecture](./MCP_ARCHITECTURE.md) — Architecture and flow diagrams
- [Environment Setup](./ENV_SETUP.md) — Detailed env var configuration
- [Changelog](./CHANGELOG.md) — Version history

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Watch mode
npm run dev
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for details.

## License

MIT © [Pi Research Team](https://github.com/earendil-works/pi)

## Related

- [Pi](https://github.com/earendil-works/pi) — The AI agent framework this is built on
- [Model Context Protocol](https://modelcontextprotocol.io/) — Standard for AI tool integration
- [Tavily](https://tavily.com/) — Web search API for AI applications
- [OpenRouter](https://openrouter.ai/) — Unified API for LLMs
