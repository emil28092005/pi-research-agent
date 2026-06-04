export interface ResearchNote {
	topic: string;
	finding: string;
	source_url: string;
	confidence: "high" | "medium" | "low";
	timestamp: number;
}

export interface NoteStore {
	add(note: ResearchNote): void;
	getAll(): ResearchNote[];
	clear(): void;
	count(): number;
}

export interface SearchResult {
	title: string;
	url: string;
	content: string;
	score: number;
}

export interface TavilySearchResponse {
	query: string;
	results: SearchResult[];
	answer?: string;
}

export interface ResearchResult {
	topic: string;
	notes: ResearchNote[];
	report: string;
	turnsUsed: number;
}

export interface ResearchAgentOptions {
	model?: import("@earendil-works/pi-ai").Model<any>;
	thinkingLevel?: import("@earendil-works/pi-agent-core").ThinkingLevel;
	maxTurns?: number;
	tavilyApiKey?: string;
	llmApiKey?: string;
	skills?: import("./skills/types.ts").ResearchSkill[];
	outputDir?: string;
	saveResults?: boolean;
}
