/**
 * Custom Skills Example
 *
 * Demonstrates how to use custom research skills with the ResearchAgent.
 *
 * Run with:
 *   TAVILY_API_KEY=*** \
 *   OPENROUTER_API_KEY=*** \
 *   npx tsx examples/custom-skills.ts
 */

import type { ResearchSkill } from "../src/index.ts";
import { ResearchAgent } from "../src/index.ts";

const academicResearchSkill: ResearchSkill = {
	name: "academic-research",
	description: "Focus on academic sources and peer-reviewed papers",
	content: `When conducting research:
1. Prioritize academic sources (Google Scholar, arXiv, PubMed)
2. Look for peer-reviewed papers and citations
3. Check publication dates and author credentials
4. Note methodology and sample sizes
5. Distinguish between correlation and causation`,
	maxTurns: 15,
};

const factCheckingSkill: ResearchSkill = {
	name: "fact-checking",
	description: "Verify claims with multiple sources",
	content: `For each major claim:
1. Find at least 3 independent sources
2. Check for conflicting information
3. Note the confidence level appropriately
4. Flag any claims that cannot be verified`,
};

const agent = new ResearchAgent({
	maxTurns: 12,
	skills: [academicResearchSkill, factCheckingSkill],
});

agent.subscribe((event) => {
	if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
		process.stdout.write(event.assistantMessageEvent.delta);
	}
});

const topic = "Effectiveness of cognitive behavioral therapy for anxiety";
console.log(`Researching: ${topic}\n`);

const result = await agent.research(topic);

console.log("\n\n" + result.report);
