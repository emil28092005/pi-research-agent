import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ResearchAgent } from "./agent.ts";
import { VERSION } from "./config.ts";

const researchSchema = {
	topic: z.string().describe("The research topic to investigate"),
	maxTurns: z
		.number()
		.optional()
		.default(15)
		.describe("Maximum number of research turns (default: 15). More turns = deeper research."),
	format: z
		.enum(["markdown", "json", "bullet"])
		.optional()
		.default("markdown")
		.describe("Output format for the report (default: markdown)"),
};

const quickSearchSchema = {
	query: z.string().describe("Search query"),
	maxResults: z.number().optional().default(10).describe("Maximum number of results (default: 10)"),
};

const readUrlSchema = {
	url: z.string().describe("URL to read"),
	maxLength: z.number().optional().default(10000).describe("Maximum characters to extract (default: 10000)"),
};

export function createResearchMcpServer(): McpServer {
	const server = new McpServer({
		name: "pi-research-agent",
		version: VERSION,
	});

	server.registerTool(
		"research",
		{
			description:
				"Perform deep autonomous research on a topic. Searches the web, reads sources, saves findings, and generates a comprehensive report with citations.",
			inputSchema: researchSchema as any,
		},
		async (params: any) => {
			const { topic, maxTurns = 15, format = "markdown" } = params;
			const agent = new ResearchAgent({
				maxTurns,
				saveResults: false,
			});

			// Suppress console output during MCP execution
			const originalError = console.error;
			console.error = () => {};

			try {
				const result = await agent.research(topic);

				console.error = originalError;

				const reportWithMeta = [
					`# Research Report: ${topic}`,
					"",
					`**Turns used:** ${result.turnsUsed}`,
					`**Notes collected:** ${result.notes.length}`,
					`**Format:** ${format}`,
					"",
					"---",
					"",
					result.report,
					"",
					"---",
					"",
					"## Raw Research Notes",
					"",
					...result.notes.flatMap((note) => [
						`### ${note.topic}`,
						`- **Confidence:** ${note.confidence}`,
						`- **Source:** ${note.source_url}`,
						`- **Finding:** ${note.finding}`,
						"",
					]),
				].join("\n");

				return {
					content: [{ type: "text" as const, text: reportWithMeta }],
				};
			} catch (error) {
				console.error = originalError;
				const message = error instanceof Error ? error.message : String(error);
				return {
					content: [{ type: "text" as const, text: `Research failed: ${message}` }],
					isError: true,
				};
			}
		},
	);

	server.registerTool(
		"quick_search",
		{
			description:
				"Quick web search on a topic. Returns search results without full research flow. Use for fast information lookup.",
			inputSchema: quickSearchSchema as any,
		},
		async (params: any) => {
			const { query, maxResults = 10 } = params;
			try {
				const { tavilySearch } = await import("./utils/tavily.ts");
				const { formatSearchResults } = await import("./utils/formatter.ts");

				const apiKey = process.env.TAVILY_API_KEY;
				if (!apiKey) {
					return {
						content: [{ type: "text" as const, text: "Error: TAVILY_API_KEY environment variable is not set" }],
						isError: true,
					};
				}

				const results = await tavilySearch(query, {
					apiKey,
					maxResults,
				});

				return {
					content: [{ type: "text" as const, text: formatSearchResults(results.results) }],
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return {
					content: [{ type: "text" as const, text: `Search failed: ${message}` }],
					isError: true,
				};
			}
		},
	);

	server.registerTool(
		"read_url",
		{
			description: "Fetch and extract content from a URL. Useful for reading specific articles or pages.",
			inputSchema: readUrlSchema as any,
		},
		async (params: any) => {
			const { url, maxLength = 10000 } = params;
			try {
				const { fetchAndExtract } = await import("./utils/fetcher.ts");
				const content = await fetchAndExtract(url, maxLength);

				return {
					content: [{ type: "text" as const, text: `Content from ${url}:\n\n${content}` }],
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				return {
					content: [{ type: "text" as const, text: `Failed to read URL: ${message}` }],
					isError: true,
				};
			}
		},
	);

	return server;
}
