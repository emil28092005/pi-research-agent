import type { ResearchNote, SearchResult } from "../types.ts";

export function formatSearchResults(results: SearchResult[]): string {
	if (results.length === 0) {
		return "No results found.";
	}

	const lines: string[] = [`Found ${results.length} results:\n`];

	for (let i = 0; i < results.length; i++) {
		const r = results[i];
		lines.push(`[${i + 1}] ${r.title}`);
		lines.push(`    URL: ${r.url}`);
		lines.push(`    Relevance: ${(r.score * 100).toFixed(0)}%`);
		lines.push(`    Snippet: ${r.content.slice(0, 500)}${r.content.length > 500 ? "..." : ""}`);
		lines.push("");
	}

	return lines.join("\n");
}

export function formatNotes(notes: ResearchNote[]): string {
	if (notes.length === 0) {
		return "No notes collected.";
	}

	const lines: string[] = [`Collected ${notes.length} research notes:\n`];

	for (let i = 0; i < notes.length; i++) {
		const note = notes[i];
		lines.push(`--- Note ${i + 1} ---`);
		lines.push(`Topic: ${note.topic}`);
		lines.push(`Confidence: ${note.confidence}`);
		lines.push(`Source: ${note.source_url}`);
		lines.push(`Finding: ${note.finding}`);
		lines.push("");
	}

	return lines.join("\n");
}
