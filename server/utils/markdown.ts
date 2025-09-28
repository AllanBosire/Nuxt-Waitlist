import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMDC from "remark-mdc";
import remarkRehype from "remark-rehype";
// @ts-ignore
import remarkVariables from "remark-variables";
import rehypeStringify from "rehype-stringify";
import remarkStringify from "remark-stringify";
import matter from "gray-matter";

export async function toMarkdown(md: string, variables: Record<string, any>) {
	const { content, data: frontmatter } = matter(md);

	const processor = unified().use(remarkParse).use(remarkVariables).use(remarkStringify);

	for (const [key, val] of entries(variables)) {
		processor.data(key as any, val);
	}

	const file = await processor.process(content);
	return {
		markdown: String(file),
		frontmatter,
	};
}

export async function toHtml(md: string, variables: Record<string, any> | undefined) {
	const { content, data: frontmatter } = matter(md);

	const processor = unified()
		.use(remarkParse)
		.use(remarkMDC)
		.use(remarkRehype)
		.use(rehypeStringify)
		.use(remarkVariables);

	for (const [key, val] of entries(variables)) {
		processor.data(key as any, val);
	}

	const file = await processor.process(content);

	return {
		html: String(file),
		frontmatter,
	};
}

export function getMarkdown(name: string) {
	return useStorage("assets:markdown").getItem<string>(`${name}.md`);
}

export interface Markdown {
	welcome: {
		username: string;
	};
}

/**
 * @param name name of the markdown file under server/templates/markdown
 * @throws when the markdown file isn't found
 */
export async function getHtml<K extends keyof Markdown>(name: K, variables: Markdown[K]) {
	const md = await getMarkdown(name);
	if (!md) {
		throw createError("Could not find markdown");
	}

	return toHtml(md, variables);
}
