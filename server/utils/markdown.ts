import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMDC from "remark-mdc";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import matter from "gray-matter";
import Mustache from "mustache";

function toMarkdown<K extends keyof Markdown>(md: string, variables: Markdown[K]) {
	const { content, data: frontmatter } = matter(md);
	const renderedContent = Mustache.render(content, variables);
	const renderedFrontmatter = JSON.parse(Mustache.render(JSON.stringify(frontmatter), variables));

	return {
		markdown: renderedContent,
		frontmatter: renderedFrontmatter,
	};
}

export async function toHtml<K extends keyof Markdown>(md: string, _frontmatter?: Markdown[K]) {
	const { markdown, frontmatter } = toMarkdown(md, _frontmatter ? _frontmatter : ({} as any));
	const processor = unified()
		.use(remarkParse)
		.use(remarkMDC)
		.use(remarkRehype)
		.use(rehypeStringify);

	const file = await processor.process(markdown);
	return {
		html: String(file),
		frontmatter: _frontmatter ? Object.assign(_frontmatter, frontmatter) : frontmatter,
	};
}

export async function getMarkdown<K extends keyof Markdown>(
	name: K,
	variables: Markdown[K] | undefined
) {
	const md = await useStorage("assets:markdown").getItem<string>(`${name}.md`);
	if (!md) {
		throw createError("Could not find markdown: " + name);
	}

	return toMarkdown(md, variables ? variables : ({} as any));
}

export interface Markdown {
	welcome: {
		username: string;
	};
	invite: {
		link: string;
	};
}

/**
 * @param name name of the markdown file under server/templates/markdown
 * @throws when the markdown file isn't found
 */
export async function getHtml<K extends keyof Markdown>(name: K, variables: Markdown[K]) {
	const { markdown, frontmatter } = await getMarkdown(name, variables);
	return toHtml(markdown, frontmatter);
}
