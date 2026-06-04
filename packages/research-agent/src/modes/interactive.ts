import chalk from "chalk";
import type { ResearchAgent } from "../agent.ts";

export async function runInteractiveMode(agent: ResearchAgent, topic: string): Promise<number> {
	console.log(chalk.bold.cyan("\n╔══════════════════════════════════════════════════════════╗"));
	console.log(chalk.bold.cyan("║              Pi Research Agent - Interactive            ║"));
	console.log(chalk.bold.cyan("╚══════════════════════════════════════════════════════════╝"));
	console.log();

	console.log(chalk.bold(`Topic: ${topic}\n`));

	let currentPhase = "";

	agent.subscribe((event) => {
		switch (event.type) {
			case "turn_start": {
				const turnNum = agent.getTurnCount() + 1;
				console.log(chalk.bold.yellow(`\n┌─── Turn ${turnNum} ───────────────────────────────────`));
				break;
			}
			case "tool_execution_start": {
				const toolName = event.toolName;
				const args = event.args as Record<string, unknown>;
				if (toolName === "web_search") {
					currentPhase = "search";
					console.log(chalk.cyan(`  🔍 Searching: "${args.query}"`));
				} else if (toolName === "read_url") {
					currentPhase = "read";
					console.log(chalk.blue(`  📖 Reading: ${args.url}`));
				} else if (toolName === "save_note") {
					currentPhase = "note";
					console.log(chalk.green(`  💾 Saving note: "${args.topic}" (${args.confidence} confidence)`));
				} else if (toolName === "synthesize_report") {
					currentPhase = "synthesize";
					console.log(chalk.magenta("  📊 Synthesizing final report..."));
				}
				break;
			}
			case "tool_execution_end": {
				if (event.isError) {
					console.log(chalk.red(`  ⚠️  Error: ${event.toolName}`));
				}
				break;
			}
			case "turn_end": {
				console.log(chalk.dim(`  └── Notes: ${agent.getNoteCount()} | Turn ${agent.getTurnCount()} complete`));
				break;
			}
			case "message_start": {
				if (currentPhase !== "synthesize") {
					console.log(chalk.dim("  🤔 Thinking..."));
				}
				break;
			}
			case "message_update": {
				if (event.assistantMessageEvent.type === "text_delta") {
					process.stdout.write(chalk.white(event.assistantMessageEvent.delta));
				}
				break;
			}
			case "message_end": {
				process.stdout.write("\n");
				break;
			}
		}
	});

	try {
		const result = await agent.research(topic);

		console.log(chalk.bold.green("\n\n╔══════════════════════════════════════════════════════════╗"));
		console.log(chalk.bold.green("║                  Research Complete!                     ║"));
		console.log(chalk.bold.green("╚══════════════════════════════════════════════════════════╝"));
		console.log();

		console.log(chalk.dim(`  Turns used: ${result.turnsUsed}`));
		console.log(chalk.dim(`  Notes collected: ${result.notes.length}`));
		console.log(chalk.dim(`\n${"─".repeat(60)}\n`));

		console.log(result.report);

		return 0;
	} catch (error) {
		console.error(chalk.red(`\n\nResearch failed: ${error instanceof Error ? error.message : String(error)}`));
		return 1;
	}
}
