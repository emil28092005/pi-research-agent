import type { AgentTool } from "@earendil-works/pi-agent-core";
import { type Static, Type } from "typebox";
import { DEFAULT_MAX_RESULTS } from "../config.ts";
import type { TavilySearchResponse } from "../types.ts";
import { formatSearchResults } from "../utils/formatter.ts";
import { tavilySearch } from "../utils/tavily.ts";

const webSearchSchema = Type.Object({
	query: Type.String({ description: "Search query to find information on the web" }),
	max_results: Type.Optional(
		Type.Number({
			description: `Maximum number of results to return (default: ${DEFAULT_MAX_RESULTS})`,
		}),
	),
	search_depth: Type.Optional(
		Type.Union([Type.Literal("basic"), Type.Literal("advanced")], {
			description: "Search depth: basic for quick overview, advanced for comprehensive results",
		}),
	),
});

export type WebSearchInput = Static<typeof webSearchSchema>;

export function createWebSearchTool(apiKey: string): AgentTool<typeof webSearchSchema, TavilySearchResponse> {
	return {
		name: "web_search",
		label: "Web Search",
		description:
			"Search the web for information on a given query using Tavily. Returns titles, URLs, and content snippets.",
		parameters: webSearchSchema,
		execute: async (_toolCallId, params: WebSearchInput) => {
			const results = await tavilySearch(params.query, {
				apiKey,
				maxResults: params.max_results ?? DEFAULT_MAX_RESULTS,
				searchDepth: params.search_depth ?? "basic",
			});

			return {
				content: [{ type: "text" as const, text: formatSearchResults(results.results) }],
				details: results,
			};
		},
	};
}
