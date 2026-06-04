/**
 * Environment Variables Example
 *
 * This example demonstrates how to use .env files with the research agent.
 *
 * Setup:
 * 1. Copy .env.example to .env:
 *    cp packages/research-agent/.env.example packages/research-agent/.env
 *
 * 2. Edit .env with your API keys:
 *    TAVILY_API_KEY=***
 *    OPENROUTER_API_KEY=***
 *
 * 3. Run the example:
 *    npx tsx examples/with-env.ts
 *
 * The agent will automatically load variables from .env file.
 * Environment variables take precedence over .env file values.
 */

import { ResearchAgent } from "../src/index.ts";

// No need to manually read process.env - the CLI does this automatically
// But when using the programmatic API, you can still pass keys explicitly
const agent = new ResearchAgent({
	maxTurns: 5,
	// Keys will be read from process.env (loaded from .env by CLI)
	// Or you can pass them explicitly:
	// tavilyApiKey: process.env.TAVILY_API_KEY,
	// llmApiKey: process.env.OPENROUTER_API_KEY,
});

agent.subscribe((event) => {
	if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
		process.stdout.write(event.assistantMessageEvent.delta);
	}
});

console.log("Starting research with environment variables from .env file...\n");

const result = await agent.research("Benefits of morning exercise");

console.log("\n\n" + "=".repeat(60));
console.log(`Research complete!`);
console.log(`Turns used: ${result.turnsUsed}`);
console.log(`Notes collected: ${result.notes.length}`);
console.log("=".repeat(60));
