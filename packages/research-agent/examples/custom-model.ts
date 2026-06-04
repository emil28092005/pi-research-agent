/**
 * Custom Model Example
 *
 * Demonstrates how to use a custom model with the ResearchAgent.
 *
 * Run with:
 *   TAVILY_API_KEY=*** \
 *   OPENROUTER_API_KEY=*** \
 *   npx tsx examples/custom-model.ts
 */

import { getModels } from "@earendil-works/pi-ai";
import { ResearchAgent } from "../src/index.ts";

const models = getModels("openrouter");
const gpt4o = models.find((m) => m.id === "openai/gpt-4o");

if (!gpt4o) {
	console.error("GPT-4o model not found");
	process.exit(1);
}

const agent = new ResearchAgent({
	model: gpt4o,
	thinkingLevel: "high",
	maxTurns: 15,
});

agent.subscribe((event) => {
	if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
		process.stdout.write(event.assistantMessageEvent.delta);
	}
});

const topic = "Comparison of renewable energy storage solutions";
console.log(`Researching: ${topic}\n`);

const result = await agent.research(topic);

console.log("\n\n" + result.report);
