# Examples

This directory contains working examples of how to use Pi Research Agent.

## Prerequisites

Before running any example, make sure you have:

1. Built the project: `npm run build` (from the package root)
2. Set up environment variables in a `.env` file or exported in your shell:
   ```bash
   TAVILY_API_KEY=your-tavily-key
   OPENROUTER_API_KEY=your-openrouter-key
   ```

## Examples

### [basic.ts](./basic.ts)

The simplest example — basic programmatic research.

```bash
npx tsx examples/basic.ts
```

### [custom-model.ts](./custom-model.ts)

Using a custom LLM model (GPT-4o instead of the default).

```bash
npx tsx examples/custom-model.ts
```

### [custom-skills.ts](./custom-skills.ts)

Adding custom research skills to specialize the agent's behavior.

```bash
npx tsx examples/custom-skills.ts
```

### [with-env.ts](./with-env.ts)

Loading API keys from a `.env` file automatically.

```bash
npx tsx examples/with-env.ts
```

### [mcp-client.ts](./mcp-client.ts)

Connecting to the MCP server programmatically from another agent.

```bash
npx tsx examples/mcp-client.ts
```

## MCP Configuration Files

### [mcp-config-claude.json](./mcp-config-claude.json)

Configuration for Claude Desktop. Copy to:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### [mcp-config-cursor.json](./mcp-config-cursor.json)

Configuration for Cursor. Copy to `.cursor/mcp.json` in your project root.

## Running Examples

All examples use `tsx` to run TypeScript files directly. You can run them with:

```bash
# From the package root
npx tsx examples/<example-name>.ts

# Or with a specific environment variable
TAVILY_API_KEY=*** OPENROUTER_API_KEY=*** npx tsx examples/basic.ts
```

## Output

Examples will:
1. Connect to Tavily and OpenRouter APIs
2. Run the research workflow
3. Print progress to the console
4. Save results to `./research-output/`
5. Display the final report

## Troubleshooting

If you get an error about missing API keys:
- Make sure your `.env` file exists in the package root
- Or export the variables in your shell before running

If you get a build error:
- Run `npm run build` first
- Make sure dependencies are installed: `npm install`
