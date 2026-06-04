import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import type { ResearchSkill } from "./types.ts";

export type { ResearchSkill };

export async function loadResearchSkills(skillsDir?: string): Promise<ResearchSkill[]> {
	const dir = skillsDir ?? join(homedir(), ".pi", "skills", "research");

	if (!existsSync(dir)) {
		return [];
	}

	let files: string[];
	try {
		files = await readdir(dir);
	} catch {
		return [];
	}

	const skills: ResearchSkill[] = [];

	for (const file of files) {
		if (!file.endsWith(".md")) continue;

		try {
			const content = await readFile(join(dir, file), "utf-8");
			const parsed = parseSkillFrontmatter(content);
			if (parsed) {
				skills.push(parsed);
			}
		} catch {}
	}

	return skills;
}

function parseSkillFrontmatter(content: string): ResearchSkill | null {
	const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) return null;

	try {
		const frontmatter = parseYaml(match[1]) as Record<string, unknown>;
		return {
			name: (frontmatter.name as string) ?? "unnamed",
			description: (frontmatter.description as string) ?? "",
			content: match[2].trim(),
			maxTurns: frontmatter.max_turns as number | undefined,
			tools: frontmatter.tools as string[] | undefined,
		};
	} catch {
		return null;
	}
}
