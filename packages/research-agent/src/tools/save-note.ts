import type { AgentTool } from "@earendil-works/pi-agent-core";
import { type Static, Type } from "typebox";
import type { NoteStore, ResearchNote } from "../types.ts";

const saveNoteSchema = Type.Object({
	topic: Type.String({ description: "Topic or sub-question this note addresses" }),
	finding: Type.String({ description: "The key finding or information extracted" }),
	source_url: Type.String({ description: "URL of the source where this finding came from" }),
	confidence: Type.Union([Type.Literal("high"), Type.Literal("medium"), Type.Literal("low")], {
		description:
			"Confidence level: high for well-established facts, medium for recent info, low for speculative claims",
	}),
});

export type SaveNoteInput = Static<typeof saveNoteSchema>;

export function createNoteStore(): NoteStore {
	const notes: ResearchNote[] = [];
	return {
		add(note: ResearchNote) {
			notes.push(note);
		},
		getAll() {
			return notes.slice();
		},
		clear() {
			notes.length = 0;
		},
		count() {
			return notes.length;
		},
	};
}

export function createSaveNoteTool(notes: NoteStore): AgentTool<typeof saveNoteSchema, ResearchNote> {
	return {
		name: "save_note",
		label: "Save Note",
		description: "Save a research note or finding for later synthesis into the final report",
		parameters: saveNoteSchema,
		execute: async (_toolCallId, params: SaveNoteInput) => {
			const note: ResearchNote = {
				topic: params.topic,
				finding: params.finding,
				source_url: params.source_url,
				confidence: params.confidence,
				timestamp: Date.now(),
			};
			notes.add(note);
			return {
				content: [
					{
						type: "text" as const,
						text: `Note saved successfully. Topic: "${params.topic}". Total notes collected: ${notes.count()}`,
					},
				],
				details: note,
			};
		},
	};
}
