import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Agent, type AgentEvent, type AgentMessage } from "@earendil-works/pi-agent-core";
import { type Api, getModels, type Message, type Model, streamSimple } from "@earendil-works/pi-ai";
import {
	DEFAULT_MAX_TURNS,
	DEFAULT_MODEL_ID,
	DEFAULT_OUTPUT_DIR,
	DEFAULT_PROVIDER,
	ENV_LLM_MODEL,
	ENV_OPENROUTER_API_KEY,
	ENV_TAVILY_API_KEY,
	MIN_REPORT_LENGTH,
} from "./config.ts";
import { buildSystemPrompt } from "./system-prompt.ts";
import { createNoteStore, createResearchTools } from "./tools/index.ts";
import type { NoteStore, ResearchAgentOptions, ResearchResult } from "./types.ts";

export class ResearchAgent {
	private agent: Agent;
	private notes: NoteStore;
	private turnCount = 0;
	private maxTurns: number;
	private report = "";
	private forcedSynthesis = false;
	private synthesisRequested = false;
	private reportGenerationStopped = false;
	private turnsAfterSynthesis = 0;
	private topic = "";
	private outputDir: string;
	private saveResults: boolean;

	constructor(options: ResearchAgentOptions = {}) {
		this.notes = createNoteStore();
		this.maxTurns = options.maxTurns ?? DEFAULT_MAX_TURNS;
		this.outputDir = options.outputDir ?? DEFAULT_OUTPUT_DIR;
		this.saveResults = options.saveResults ?? true;

		const tavilyApiKey = options.tavilyApiKey ?? process.env[ENV_TAVILY_API_KEY];
		if (!tavilyApiKey) {
			throw new Error(
				`Tavily API key is required. Set ${ENV_TAVILY_API_KEY} environment variable or pass tavilyApiKey option.`,
			);
		}

		const llmApiKey = options.llmApiKey ?? process.env[ENV_OPENROUTER_API_KEY];
		if (!llmApiKey) {
			throw new Error(
				`LLM API key is required. Set ${ENV_OPENROUTER_API_KEY} environment variable or pass llmApiKey option.`,
			);
		}

		const model = options.model ?? this.resolveModel();
		const tools = createResearchTools(this.notes, tavilyApiKey);
		const systemPrompt = buildSystemPrompt(options.skills);

		this.agent = new Agent({
			initialState: {
				systemPrompt,
				model,
				thinkingLevel: options.thinkingLevel ?? "medium",
				tools,
			},
			streamFn: async (streamModel, context, opts) => {
				return streamSimple(streamModel, context, {
					...opts,
					apiKey: llmApiKey,
				});
			},
			convertToLlm: (messages: AgentMessage[]): Message[] => {
				return messages.filter(
					(m) => m.role === "user" || m.role === "assistant" || m.role === "toolResult",
				) as Message[];
			},
		});

		this.agent.subscribe((event: AgentEvent) => {
			// Log assistant message generation for debugging
			if (event.type === "message_end" && event.message.role === "assistant") {
				const textContent = event.message.content.find((c) => c.type === "text");
				if (textContent && textContent.type === "text" && textContent.text.length > 0) {
					console.error(`[Assistant message generated, length: ${textContent.text.length}]`);
				}
			}

			// Track when synthesize_report tool completes successfully
			if (event.type === "tool_execution_end" && event.toolName === "synthesize_report") {
				if (event.result?.details && event.result.details.synthesisRequested === true) {
					this.synthesisRequested = true;
					this.turnsAfterSynthesis = 0;
					console.error(`\n[synthesize_report called, waiting for report generation...]`);
				}
			}

			if (event.type === "turn_end") {
				this.turnCount++;

				// After synthesize_report was called, track turns and check for report
				if (this.synthesisRequested && !this.reportGenerationStopped) {
					this.turnsAfterSynthesis++;

					const lastMsg = this.getLastAssistantMessage();
					const reportLength = lastMsg ? this.getTextLength(lastMsg) : 0;
					const hasReport = reportLength >= MIN_REPORT_LENGTH;

					// Stop after 2 turns OR if we have a substantial report after at least 1 turn
					if (this.turnsAfterSynthesis >= 2 || (hasReport && this.turnsAfterSynthesis >= 1)) {
						this.reportGenerationStopped = true;
						console.error(`\n[Report generation complete. Stopping agent.]`);
						this.agent.abort();
						return;
					}
				}

				// When reaching max turns, inject a steering message to force synthesis
				if (this.turnCount >= this.maxTurns && !this.forcedSynthesis && !this.synthesisRequested) {
					this.forcedSynthesis = true;
					console.error(`\n[Max turns (${this.maxTurns}) reached. Forcing report synthesis.]`);
					this.agent.steer({
						role: "user",
						content: [
							{
								type: "text",
								text: `You have reached the maximum number of research turns (${this.maxTurns}). You MUST now call the synthesize_report tool immediately with all the notes you have collected. Do not search or read more - synthesize what you have now.`,
							},
						],
						timestamp: Date.now(),
					});
				}
			}
		});
	}

	private resolveModel(): Model<Api> {
		const modelId = process.env[ENV_LLM_MODEL] ?? DEFAULT_MODEL_ID;
		const models = getModels(DEFAULT_PROVIDER);
		const model = models.find((m) => m.id === modelId);
		if (!model) {
			throw new Error(`Model not found: ${DEFAULT_PROVIDER}/${modelId}`);
		}
		return model;
	}

	subscribe(listener: (event: AgentEvent, signal: AbortSignal) => Promise<void> | void): () => void {
		return this.agent.subscribe(listener);
	}

	get state() {
		return this.agent.state;
	}

	getNoteCount(): number {
		return this.notes.count();
	}

	getTurnCount(): number {
		return this.turnCount;
	}

	async research(topic: string): Promise<ResearchResult> {
		this.turnCount = 0;
		this.notes.clear();
		this.report = "";
		this.forcedSynthesis = false;
		this.synthesisRequested = false;
		this.reportGenerationStopped = false;
		this.turnsAfterSynthesis = 0;
		this.topic = topic;

		await this.agent.prompt(topic);

		this.extractReport();

		// Fallback: if no report was generated, create one from notes
		if (!this.report || this.report.trim() === "") {
			this.report = this.generateFallbackReport();
		}

		const result: ResearchResult = {
			topic,
			notes: this.notes.getAll(),
			report: this.report,
			turnsUsed: this.turnCount,
		};

		if (this.saveResults) {
			await this.saveToDisk(result);
		}

		return result;
	}

	private getLastAssistantMessage(): AgentMessage | undefined {
		const messages = this.agent.state.messages;
		for (let i = messages.length - 1; i >= 0; i--) {
			const msg = messages[i];
			if (msg.role === "assistant" && "content" in msg) {
				return msg;
			}
		}
		return undefined;
	}

	private getTextLength(msg: AgentMessage): number {
		if ("content" in msg && msg.content) {
			const textContent = (msg.content as Array<{ type: string; text?: string }>).find((c) => c.type === "text");
			if (textContent?.text) {
				return textContent.text.length;
			}
		}
		return 0;
	}

	private extractReport(): void {
		const messages = this.agent.state.messages;

		console.error(`\n[Extracting report from ${messages.length} messages...]`);

		// Strategy 1: Look for assistant message AFTER synthesize_report tool result (correct flow)
		for (let i = messages.length - 1; i >= 0; i--) {
			const msg = messages[i];

			if (msg.role === "toolResult") {
				const content = msg.content;
				if (Array.isArray(content)) {
					const textContent = content.find((c: any) => c.type === "text");
					if (
						textContent &&
						textContent.type === "text" &&
						textContent.text.includes("Research synthesis requested for")
					) {
						console.error(`[Found synthesize_report at index ${i}]`);
						// Found synthesize_report result, look for assistant message after it
						for (let j = i + 1; j < messages.length; j++) {
							const nextMsg = messages[j];
							if (nextMsg.role === "assistant" && nextMsg.content) {
								const nextTextContent = nextMsg.content.find((c) => c.type === "text");
								if (nextTextContent && nextTextContent.type === "text" && nextTextContent.text.length > 200) {
									console.error(
										`[Extracted report from assistant message at index ${j}, length: ${nextTextContent.text.length}]`,
									);
									this.report = nextTextContent.text;
									return;
								}
							}
						}
					}
				}
			}
		}

		console.error(`[No report found after synthesize_report, trying fallback strategies...]`);

		// Strategy 2: Look for the longest assistant message in the last 5 messages (fallback)
		const lastMessages = messages.slice(-5);
		let longestText = "";
		for (const msg of lastMessages) {
			if (msg.role === "assistant" && msg.content) {
				const textContent = msg.content.find((c) => c.type === "text");
				if (textContent && textContent.type === "text" && textContent.text.length > longestText.length) {
					longestText = textContent.text;
				}
			}
		}

		if (longestText.length > 200) {
			console.error(`[Extracted longest report from last 5 messages, length: ${longestText.length}]`);
			this.report = longestText;
			return;
		}

		console.error(`[No substantial report found in last 5 messages, trying any long message...]`);

		// Strategy 3: Look for any assistant message with substantial text
		for (let i = messages.length - 1; i >= 0; i--) {
			const msg = messages[i];
			if (msg.role === "assistant" && msg.content) {
				const textContent = msg.content.find((c) => c.type === "text");
				if (textContent && textContent.type === "text" && textContent.text.length > 100) {
					console.error(
						`[Extracted fallback report from assistant message at index ${i}, length: ${textContent.text.length}]`,
					);
					this.report = textContent.text;
					return;
				}
			}
		}

		console.error(`[No report found in messages, trying longest message from all...]`);

		// Strategy 4: Find the longest assistant message in ALL messages
		let longestMsg = "";
		let longestIndex = -1;
		for (let i = 0; i < messages.length; i++) {
			const msg = messages[i];
			if (msg.role === "assistant" && msg.content) {
				const textContent = msg.content.find((c) => c.type === "text");
				if (textContent && textContent.type === "text" && textContent.text.length > longestMsg.length) {
					longestMsg = textContent.text;
					longestIndex = i;
				}
			}
		}

		if (longestMsg.length > MIN_REPORT_LENGTH) {
			console.error(
				`[Extracted longest report from all messages at index ${longestIndex}, length: ${longestMsg.length}]`,
			);
			this.report = longestMsg;
			return;
		}

		console.error(`[No report found in messages]`);
		this.report = "";
	}

	private generateFallbackReport(): string {
		const notes = this.notes.getAll();
		if (notes.length === 0) {
			return "Research completed but no notes were collected.";
		}

		const lines = [
			`# Research Report: ${this.topic}`,
			"",
			"## Executive Summary",
			"",
			`This research collected ${notes.length} findings on "${this.topic}".`,
			"",
			"## Key Findings",
			"",
		];

		// Group notes by confidence
		const highConfidence = notes.filter((n) => n.confidence === "high");
		const mediumConfidence = notes.filter((n) => n.confidence === "medium");
		const lowConfidence = notes.filter((n) => n.confidence === "low");

		if (highConfidence.length > 0) {
			lines.push("### High Confidence Findings");
			lines.push("");
			for (const note of highConfidence) {
				lines.push(`- **${note.topic}**: ${note.finding}`);
				lines.push(`  - Source: ${note.source_url}`);
			}
			lines.push("");
		}

		if (mediumConfidence.length > 0) {
			lines.push("### Medium Confidence Findings");
			lines.push("");
			for (const note of mediumConfidence) {
				lines.push(`- **${note.topic}**: ${note.finding}`);
				lines.push(`  - Source: ${note.source_url}`);
			}
			lines.push("");
		}

		if (lowConfidence.length > 0) {
			lines.push("### Low Confidence Findings");
			lines.push("");
			for (const note of lowConfidence) {
				lines.push(`- **${note.topic}**: ${note.finding}`);
				lines.push(`  - Source: ${note.source_url}`);
			}
			lines.push("");
		}

		lines.push("## Notes");
		lines.push("");
		lines.push(
			"*This report was auto-generated from collected notes as the agent reached the turn limit before synthesizing a full report.*",
		);

		return lines.join("\n");
	}

	private async saveToDisk(result: ResearchResult): Promise<void> {
		try {
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
			const slug = result.topic
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "")
				.slice(0, 50);
			const dir = join(this.outputDir, `${timestamp}-${slug}`);

			await mkdir(dir, { recursive: true });
			await writeFile(join(dir, "report.md"), result.report, "utf-8");
			await writeFile(join(dir, "report.json"), JSON.stringify(result, null, 2), "utf-8");
			await writeFile(join(dir, "notes.json"), JSON.stringify(result.notes, null, 2), "utf-8");

			console.error(`\n[Results saved to ${dir}]`);
		} catch (error) {
			console.error(
				`\n[Warning: Failed to save results to disk: ${error instanceof Error ? error.message : String(error)}]`,
			);
		}
	}

	abort(): void {
		this.agent.abort();
	}
}
