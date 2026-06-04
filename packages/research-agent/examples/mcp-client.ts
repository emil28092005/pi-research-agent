/**
 * MCP Client Example
 *
 * Demonstrates how to call the research agent MCP server from another agent.
 *
 * Run with:
 *   TAVILY_API_KEY=*** \
 *   OPENROUTER_API_KEY=*** \
 *   npx tsx examples/mcp-client.ts
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { join } from "node:path";

const mcpServerPath = join(import.meta.dirname, "../dist/mcp-cli.js");

const transport = new StdioClientTransport({
	command: "node",
	args: [mcpServerPath],
	env: {
		...process.env,
	},
});

const client = new Client({
	name: "example-client",
	version: "1.0.0",
});

await client.connect(transport);

console.log("Connected to research agent MCP server\n");

const toolsResult = await client.listTools();
console.log("Available tools:");
for (const tool of toolsResult.tools) {
	console.log(`  - ${tool.name}: ${tool.description}`);
}
console.log();

console.log("Starting research on 'Rust async runtime'...\n");

const result = await client.callTool({
	name: "quick_search",
	arguments: {
		query: "Rust async runtime tokio vs async-std 2026",
		maxResults: 5,
	},
});

console.log("Search results:");
for (const content of result.content) {
	if (content.type === "text") {
		console.log(content.text);
	}
}

await client.close();
