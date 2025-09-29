import { ensureAdmin } from "../utils/user";
import { access, mkdir, writeFile } from "node:fs/promises";
import { platform } from "node:os";
import { join } from "node:path";
import { constants } from "node:fs";

async function getUploadsPath() {
	const isWindows = platform() === "win32";
	const baseDir = isWindows ? join("C:", "uploads") : join("/", "uploads");
	const fullPath = join(baseDir, "videos");

	try {
		await access(fullPath, constants.F_OK);
	} catch {
		await mkdir(fullPath, { recursive: true });
	}

	return fullPath;
}

async function refreshJellyfinLibrary() {
	const { jellyfin } = useRuntimeConfig();

	await $fetch(`${jellyfin.url}/Library/Refresh`, {
		method: "POST",
		headers: {
			"X-Emby-Token": jellyfin.apiKey,
		},
	}).catch((e) => {
		throw createError({
			statusCode: 500,
			message: "Failed to refresh Jellyfin library",
			cause: e,
		});
	});
}

async function getJellyfinItemsByFilename(filenames: string[]) {
	const { jellyfin } = useRuntimeConfig();
	const items: Array<{
		filename: string;
		itemId: string;
		streamUrl: string;
		directPlayUrl: string;
		webUrl: string;
	}> = [];

	for (const filename of filenames) {
		try {
			// Search for the item in Jellyfin by filename
			const searchResults: any = await $fetch(`${jellyfin.url}/Items`, {
				params: {
					searchTerm: filename,
					recursive: true,
					fields: "Path",
				},
				headers: {
					"X-Emby-Token": jellyfin.apiKey,
				},
			});

			if (searchResults.Items && searchResults.Items.length > 0) {
				const item = searchResults.Items[0];
				const itemId = item.Id;

				// Generate streaming URLs
				// TODO: Proxy with nitro, not to expose key
				const streamUrl = `${jellyfin.url}/Videos/${itemId}/stream?static=true&api_key=${jellyfin.apiKey}`;
				const directPlayUrl = `${jellyfin.url}/Videos/${itemId}/stream?static=false&api_key=${jellyfin.apiKey}`;
				const webUrl = `${jellyfin.url}/web/index.html#!/details?id=${itemId}`;

				items.push({
					filename,
					itemId,
					streamUrl,
					directPlayUrl,
					webUrl,
				});
			}
		} catch (error) {
			console.error(`Failed to find Jellyfin item for ${filename}:`, error);
		}
	}

	return items;
}

export default defineEventHandler(async (event) => {
	await ensureAdmin(event);

	const files = await readMultipartFormData(event);
	if (!files) {
		throw createError("Empty Upload");
	}

	const path = await getUploadsPath();
	const savedFiles: string[] = [];

	for (const file of files) {
		if (!file.filename) {
			continue;
		}

		const filePath = join(path, file.filename);

		try {
			await writeFile(filePath, file.data);
			savedFiles.push(file.filename);
		} catch (error) {
			console.error(`Failed to save file ${file.filename}:`, error);
			throw createError({
				statusCode: 500,
				message: `Failed to save file: ${file.filename}`,
			});
		}
	}

	await refreshJellyfinLibrary();

	await new Promise((resolve) => setTimeout(resolve, 10000));
	const jellyfinItems = await getJellyfinItemsByFilename(savedFiles);

	return {
		success: true,
		filesUploaded: savedFiles.length,
		files: jellyfinItems,
	};
});
