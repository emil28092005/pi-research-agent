import { fetch } from "undici";
import { TAVILY_API_URL } from "../config.ts";
import type { SearchResult, TavilySearchResponse } from "../types.ts";

export interface TavilySearchOptions {
	apiKey: string;
	maxResults?: number;
	searchDepth?: "basic" | "advanced";
	includeAnswer?: boolean;
}

export async function tavilySearch(query: string, options: TavilySearchOptions): Promise<TavilySearchResponse> {
	const response = await fetch(TAVILY_API_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			api_key: options.apiKey,
			query,
			max_results: options.maxResults ?? 10,
			search_depth: options.searchDepth ?? "basic",
			include_answer: options.includeAnswer ?? false,
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Tavily API error (${response.status}): ${errorText}`);
	}

	const data = (await response.json()) as {
		query: string;
		results: Array<{
			title: string;
			url: string;
			content: string;
			score: number;
		}>;
		answer?: string;
	};

	return {
		query: data.query,
		results: data.results.map(
			(r): SearchResult => ({
				title: r.title,
				url: r.url,
				content: r.content,
				score: r.score,
			}),
		),
		answer: data.answer,
	};
}
