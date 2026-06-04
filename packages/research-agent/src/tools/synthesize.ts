import type { AgentTool } from "@earendil-works/pi-agent-core";
import { type Static, Type } from "typebox";
import type { NoteStore } from "../types.ts";
import { formatNotes } from "../utils/formatter.ts";

const synthesizeSchema = Type.Object({
	topic: Type.String({ description: "The main research topic to synthesize" }),
	format: Type.Optional(
		Type.Union([Type.Literal("markdown"), Type.Literal("json"), Type.Literal("bullet")], {
			description: "Output format for the report (default: markdown)",
		}),
	),
});

export type SynthesizeInput = Static<typeof synthesizeSchema>;

interface SynthesizeDetails {
	notes_count: number;
	topic: string;
	format: string;
	synthesisRequested: boolean;
}

export function createSynthesizeTool(notes: NoteStore): AgentTool<typeof synthesizeSchema, SynthesizeDetails> {
	return {
		name: "synthesize_report",
		label: "Synthesize Report",
		description:
			"Synthesize all collected research notes into a structured report. Call this when you have gathered sufficient information to produce the final research report.",
		parameters: synthesizeSchema,
		execute: async (_toolCallId, params: SynthesizeInput) => {
			const allNotes = notes.getAll();
			const format = params.format ?? "markdown";

			// Warn if too few notes were collected
			if (allNotes.length === 0) {
				const warning = [
					`WARNING: No research notes were collected for topic "${params.topic}".`,
					"",
					"You must use the save_note tool to save findings from your research before calling synthesize_report.",
					"Please go back and:",
					"1. Read sources using read_url",
					"2. Save key findings using save_note with topic, finding, source_url, and confidence",
					"3. Call synthesize_report again after saving at least 5 notes",
				].join("\n");

				return {
					content: [{ type: "text" as const, text: warning }],
					details: {
						notes_count: 0,
						topic: params.topic,
						format,
						synthesisRequested: false,
					},
				};
			}

			if (allNotes.length < 3) {
				const warning = [
					`WARNING: Only ${allNotes.length} note(s) collected for topic "${params.topic}". This is insufficient for a comprehensive report.`,
					"",
					"Please continue researching and save more notes using save_note before calling synthesize_report again.",
					"Aim for at least 5-10 notes covering different aspects of the topic.",
					"",
					"=== COLLECTED RESEARCH NOTES ===",
					"",
					formatNotes(allNotes),
					"",
					"=== END OF NOTES ===",
				].join("\n");

				return {
					content: [{ type: "text" as const, text: warning }],
					details: {
						notes_count: allNotes.length,
						topic: params.topic,
						format,
						synthesisRequested: false,
					},
				};
			}

			const summary = [
				`Research synthesis requested for: "${params.topic}"`,
				`Format: ${format}`,
				`Notes collected: ${allNotes.length}`,
				"",
				"=== COLLECTED RESEARCH NOTES ===",
				"",
				formatNotes(allNotes),
				"",
				"=== END OF NOTES ===",
				"",
				"IMPORTANT: You MUST now generate the complete research report in your NEXT response.",
				"Do NOT call any more tools. Do NOT search or read more sources.",
				"Generate the full comprehensive report with:",
				"- Executive summary (2-3 paragraphs)",
				"- Key findings organized by theme",
				"- Source citations with URLs",
				"- Confidence assessment",
				"- Identified gaps for further research",
				"",
				"The report should be at least 2000 words and include all details from the notes above.",
			].join("\n");

			return {
				content: [{ type: "text" as const, text: summary }],
				details: {
					notes_count: allNotes.length,
					topic: params.topic,
					format,
					synthesisRequested: true,
				},
			};
		},
	};
}
