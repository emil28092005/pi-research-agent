import chalk from "chalk";
import { ResearchAgent } from "./agent.ts";
import { APP_NAME, VERSION } from "./config.ts";
import { runInteractiveMode, runPrintMode } from "./modes/index.ts";
import { loadResearchSkills } from "./skills/loader.ts";

interface ParsedArgs {
	help: boolean;
	version: boolean;
	print: boolean;
	maxTurns?: number;
	model?: string;
	topic?: string;
	save: boolean;
	outputDir?: string;
}

function parseArgs(args: string[]): ParsedArgs {
	const parsed: ParsedArgs = {
		help: false,
		version: false,
		print: false,
		save: true,
	};

	const positional: string[] = [];

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--help" || arg === "-h") {
			parsed.help = true;
		} else if (arg === "--version" || arg === "-v") {
			parsed.version = true;
		} else if (arg === "--print" || arg === "-p") {
			parsed.print = true;
		} else if (arg === "--max-turns" || arg === "-t") {
			const value = args[++i];
			if (value) {
				parsed.maxTurns = Number.parseInt(value, 10);
			}
		} else if (arg === "--model" || arg === "-m") {
			parsed.model = args[++i];
		} else if (arg === "--no-save") {
			parsed.save = false;
		} else if (arg === "--output-dir" || arg === "-o") {
			parsed.outputDir = args[++i];
		} else if (!arg.startsWith("-")) {
			positional.push(arg);
		}
	}

	if (positional.length > 0) {
		parsed.topic = positional.join(" ");
	}

	return parsed;
}

function printHelp(): void {
	console.log(`
${chalk.bold(APP_NAME)} - Autonomous Research Agent

${chalk.bold("Usage:")}
  ${APP_NAME} [options] <topic>

${chalk.bold("Options:")}
  -h, --help           Show this help message
  -v, --version        Show version number
  -p, --print          Use print mode (no interactive TUI)
  -t, --max-turns <n>  Maximum research turns (default: 15)
  -m, --model <model>  Model to use (default: minimax/minimax-m3)
  -o, --output-dir <p> Output directory for results (default: ./research-output)
  --no-save            Do not save results to disk

${chalk.bold("Environment Variables:")}
  TAVILY_API_KEY       Required - Tavily API key for web search
  OPENROUTER_API_KEY   Required - OpenRouter API key for LLM
  LLM_MODEL            Optional - Override default model

${chalk.bold("Examples:")}
  ${APP_NAME} "quantum computing breakthroughs 2026"
  ${APP_NAME} --print "AI safety research"
  ${APP_NAME} --max-turns 15 "climate change solutions"
  ${APP_NAME} -m openai/gpt-4o "renewable energy trends"
  ${APP_NAME} --no-save "quick research topic"
  ${APP_NAME} -o ./my-reports "saved to custom directory"

${chalk.bold("Output:")}
  Results are automatically saved to <output-dir>/<timestamp>-<topic>/
  - report.md   - Final research report in markdown
  - report.json - Full results (report + notes + metadata)
  - notes.json  - Collected research notes

${chalk.bold("Skills:")}
  Research skills are loaded from ~/.pi/skills/research/ directory.
  Create .md files with YAML frontmatter to customize research behavior.
`);
}

export async function main(args: string[]): Promise<void> {
	const parsed = parseArgs(args);

	if (parsed.help) {
		printHelp();
		return;
	}

	if (parsed.version) {
		console.log(`${APP_NAME} ${VERSION}`);
		return;
	}

	if (!parsed.topic) {
		console.error(chalk.red("Error: Research topic is required."));
		console.error(chalk.dim(`Run '${APP_NAME} --help' for usage information.`));
		process.exit(1);
	}

	const skills = await loadResearchSkills();

	let agent: ResearchAgent;
	try {
		agent = new ResearchAgent({
			maxTurns: parsed.maxTurns,
			skills,
			saveResults: parsed.save,
			outputDir: parsed.outputDir,
		});
	} catch (error) {
		console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
		process.exit(1);
	}

	const mode = parsed.print || !process.stdin.isTTY ? "print" : "interactive";

	const exitCode =
		mode === "interactive" ? await runInteractiveMode(agent, parsed.topic) : await runPrintMode(agent, parsed.topic);

	process.exit(exitCode);
}
