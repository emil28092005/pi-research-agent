import type { AgentTool } from "@earendil-works/pi-agent-core";
import { type Static, Type } from "typebox";
import { DEFAULT_MAX_CONTENT_LENGTH } from "../config.ts";
import { fetchAndExtract } from "../utils/fetcher.ts";

const readUrlSchema = Type.Object({
	url: Type.String({ description: "URL of the web page to read" }),
	max_length: Type.Optional(
		Type.Number({
			description: `Maximum characters to extract (default: ${DEFAULT_MAX_CONTENT_LENGTH})`,
		}),
	),
});

export type ReadUrlInput = Static<typeof readUrlSchema>;

interface ReadUrlDetails {
	url: string;
	length: number;
}

export function createReadUrlTool(): AgentTool<typeof readUrlSchema, ReadUrlDetails> {
	return {
		name: "read_url",
		label: "Read URL",
		description: "Fetch and read the content of a web page. Extracts main text content from HTML pages.",
		parameters: readUrlSchema,
		execute: async (_toolCallId, params: ReadUrlInput) => {
			const maxLength = params.max_length ?? DEFAULT_MAX_CONTENT_LENGTH;

			// Try with default User-Agent, then retry with alternative if it fails
			let content: string;
			let lastError: Error | null = null;

			try {
				content = await fetchAndExtract(params.url, maxLength);
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				// Retry with alternative User-Agent
				try {
					await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
					content = await fetchAndExtract(params.url, maxLength, true); // true = use alternative UA
				} catch (_retryError) {
					throw new Error(`Failed to fetch ${params.url} after 2 attempts: ${lastError.message}`);
				}
			}

			return {
				content: [
					{
						type: "text" as const,
						text: `Content from ${params.url}:\n\n${content}`,
					},
				],
				details: { url: params.url, length: content.length },
			};
		},
	};
}
