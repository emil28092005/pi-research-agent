import type { AgentTool } from "@earendil-works/pi-agent-core";
import type { NoteStore } from "../types.ts";
import { createReadUrlTool } from "./read-url.ts";
import { createSaveNoteTool } from "./save-note.ts";
import { createSynthesizeTool } from "./synthesize.ts";
import { createWebSearchTool } from "./web-search.ts";

export type { NoteStore, ResearchNote } from "../types.ts";
export { createNoteStore } from "./save-note.ts";

export function createResearchTools(notes: NoteStore, tavilyApiKey: string): AgentTool[] {
	return [
		createWebSearchTool(tavilyApiKey),
		createReadUrlTool(),
		createSaveNoteTool(notes),
		createSynthesizeTool(notes),
	];
}
