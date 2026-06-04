import { fetch } from "undici";

const USER_AGENT =
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const ALTERNATIVE_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0";

export async function fetchAndExtract(url: string, maxLength: number, useAlternativeUA = false): Promise<string> {
	const userAgent = useAlternativeUA ? ALTERNATIVE_USER_AGENT : USER_AGENT;

	const response = await fetch(url, {
		headers: {
			"User-Agent": userAgent,
			Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"Accept-Language": "en-US,en;q=0.9",
		},
		signal: AbortSignal.timeout(30000),
	});

	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}

	const contentType = response.headers.get("content-type") ?? "";
	const html = await response.text();

	let text: string;
	if (contentType.includes("text/html")) {
		text = extractTextFromHtml(html);
	} else {
		text = html;
	}

	text = collapseWhitespace(text);

	if (text.length > maxLength) {
		text = `${text.slice(0, maxLength)}\n\n[... content truncated ...]`;
	}

	return text;
}

function extractTextFromHtml(html: string): string {
	let text = html;

	text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
	text = text.replace(/<style[\s\S]*?<\/style>/gi, "");
	text = text.replace(/<nav[\s\S]*?<\/nav>/gi, "");
	text = text.replace(/<footer[\s\S]*?<\/footer>/gi, "");
	text = text.replace(/<header[\s\S]*?<\/header>/gi, "");

	const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
	const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);

	if (articleMatch) {
		text = articleMatch[1];
	} else if (mainMatch) {
		text = mainMatch[1];
	}

	text = text.replace(/<[^>]+>/g, " ");

	text = decodeHtmlEntities(text);

	return text;
}

function decodeHtmlEntities(text: string): string {
	return text
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number.parseInt(code, 10)));
}

function collapseWhitespace(text: string): string {
	return text
		.split("\n")
		.map((line) => line.replace(/\s+/g, " ").trim())
		.filter((line) => line.length > 0)
		.join("\n");
}
