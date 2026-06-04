/**
 * Basic Research Agent Example
 *
 * Demonstrates how to use the ResearchAgent programmatically.
 *
 * Run with:
 *   TAVILY_API_KEY=*** \
 *   OPENROUTER_API_KEY=*** \
 *   npx tsx examples/basic.ts
 */

import { ResearchAgent } from "../src/index.ts";

const agent = new ResearchAgent({
	maxTurns: 10,
});

agent.subscribe((event) => {
	switch (event.type) {
		case "tool_execution_start": {
			const toolName = event.toolName;
			const args = event.args as Record<string, unknown>;
			if (toolName === "web_search") {
				console.error(`[Searching: ${args.query}]`);
			} else if (toolName === "read_url") {
				console.error(`[Reading: ${args.url}]`);
			} else if (toolName === "save_note") {
				console.error(`[Saving note: ${args.topic}]`);
			} else if (toolName === "synthesize_report") {
				console.error("[Synthesizing report...]");
			}
			break;
		}
		case "message_update": {
			if (event.assistantMessageEvent.type === "text_delta") {
				process.stdout.write(event.assistantMessageEvent.delta);
			}
			break;
		}
	}
});

const topic = "Latest developments in quantum error correction 2026";
console.log(`Researching: ${topic}\n`);

const result = await agent.research(topic);

console.log("\n\n" + "=".repeat(60));
console.log(`Research complete!`);
console.log(`Turns used: ${result.turnsUsed}`);
console.log(`Notes collected: ${result.notes.length}`);
console.log("=".repeat(60) + "\n");

console.log(result.report);
