import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Simple .env file parser
 * Supports:
 * - KEY=VALUE
 * - KEY="VALUE" (double quotes)
 * - KEY='VALUE' (single quotes)
 * - # comments
 * - Empty lines
 * - Multiline values with quotes
 */
export function parseEnvFile(content: string): Record<string, string> {
	const result: Record<string, string> = {};
	const lines = content.split("\n");
	let currentKey = "";
	let currentValue = "";
	let inMultiline = false;
	let quoteChar = "";

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Handle multiline values
		if (inMultiline) {
			if (line.endsWith(quoteChar)) {
				currentValue += `\n${line.slice(0, -1)}`;
				result[currentKey] = currentValue;
				inMultiline = false;
				currentKey = "";
				currentValue = "";
			} else {
				currentValue += `\n${line}`;
			}
			continue;
		}

		// Skip empty lines and comments
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) {
			continue;
		}

		// Parse KEY=VALUE
		const eqIndex = trimmed.indexOf("=");
		if (eqIndex === -1) {
			continue;
		}

		const key = trimmed.slice(0, eqIndex).trim();
		let value = trimmed.slice(eqIndex + 1).trim();

		// Handle quoted values
		if (value.startsWith('"') || value.startsWith("'")) {
			quoteChar = value[0];
			value = value.slice(1);

			// Check if it's a multiline value
			if (!value.endsWith(quoteChar)) {
				currentKey = key;
				currentValue = value;
				inMultiline = true;
				continue;
			}

			// Single-line quoted value
			value = value.slice(0, -1);
		}

		// Unescape common escape sequences
		value = value
			.replace(/\\n/g, "\n")
			.replace(/\\r/g, "\r")
			.replace(/\\t/g, "\t")
			.replace(/\\"/g, '"')
			.replace(/\\'/g, "'");

		result[key] = value;
	}

	return result;
}

/**
 * Load .env file and set variables in process.env
 * Only sets variables that are not already defined in process.env
 * (environment variables take precedence)
 */
export function loadEnvFile(envPath?: string): void {
	const paths: string[] = [];

	if (envPath) {
		paths.push(envPath);
	} else {
		// Try current working directory
		paths.push(join(process.cwd(), ".env"));
		paths.push(join(process.cwd(), "packages/research-agent/.env"));

		// Try relative to this script's location
		try {
			const currentFile = fileURLToPath(import.meta.url);
			const scriptDir = dirname(currentFile);

			// Go up from dist/utils to research-agent root
			const researchAgentDir = dirname(scriptDir);
			paths.push(join(researchAgentDir, ".env"));

			// Go up to project root (pi-research)
			const projectRoot = dirname(researchAgentDir);
			paths.push(join(projectRoot, ".env"));
		} catch {
			// Ignore errors if import.meta.url is not available
		}
	}

	for (const path of paths) {
		if (!existsSync(path)) {
			continue;
		}

		try {
			const content = readFileSync(path, "utf-8");
			const vars = parseEnvFile(content);

			for (const [key, value] of Object.entries(vars)) {
				// Don't override existing environment variables
				if (process.env[key] === undefined) {
					process.env[key] = value;
				}
			}

			// Successfully loaded from first found file
			return;
		} catch (error) {
			console.warn(`Warning: Failed to load .env file from ${path}:`, error);
		}
	}
}
