import chalk from "chalk";
import type { ResearchAgent } from "../agent.ts";

export async function runPrintMode(agent: ResearchAgent, topic: string): Promise<number> {
	console.log(chalk.bold(`\nResearching: ${topic}\n`));
	console.log(chalk.dim("─".repeat(60)));

	agent.subscribe((event) => {
		switch (event.type) {
			case "tool_execution_start": {
				const toolName = event.toolName;
				const args = event.args as Record<string, unknown>;
				if (toolName === "web_search") {
					console.error(chalk.cyan(`\n[Searching: ${args.query}]`));
				} else if (toolName === "read_url") {
					console.error(chalk.blue(`\n[Reading: ${args.url}]`));
				} else if (toolName === "save_note") {
					console.error(chalk.green(`\n[Saving note: ${args.topic}]`));
				} else if (toolName === "synthesize_report") {
					console.error(chalk.magenta("\n[Synthesizing report...]"));
				}
				break;
			}
			case "turn_end": {
				console.error(
					chalk.dim(`\n[Turn ${agent.getTurnCount()} complete, ${agent.getNoteCount()} notes collected]`),
				);
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

	try {
		const result = await agent.research(topic);

		console.log("\n");
		console.log(chalk.dim("─".repeat(60)));
		console.log(chalk.bold.green("\nResearch Complete!"));
		console.log(chalk.dim(`Turns used: ${result.turnsUsed}`));
		console.log(chalk.dim(`Notes collected: ${result.notes.length}`));
		console.log(chalk.dim("─".repeat(60)));
		console.log(`\n${result.report}`);

		return 0;
	} catch (error) {
		console.error(chalk.red(`\nResearch failed: ${error instanceof Error ? error.message : String(error)}`));
		return 1;
	}
}
