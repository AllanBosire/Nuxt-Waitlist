import { joinURL } from "ufo";
import { z } from "zod/v4-mini";
import { consola } from "consola";
import { getAllUsers } from "../utils/user";

const schema = z.object({
	channelID: z.string(),
});

export interface Channel {
	id: string;
	create_at: number;
	update_at: number;
	delete_at: number;
	team_id: string;
	type: string;
	display_name: string;
	name: string;
	header: string;
	purpose: string;
	last_post_at: number;
	total_msg_count: number;
	extra_update_at: number;
	creator_id: string;
}

function addUsersToMMChannel(user_ids: string[] | string, channelID: string) {
	const config = useRuntimeConfig();
	return $fetch(joinURL(config.public.mmUrl, "api/v4/channels/", channelID, "/members"), {
		method: "POST",
		headers: {
			Authorization: `Bearer ${config.mattermost.token}`,
		},
		body: {
			user_ids: Array.isArray(user_ids) ? user_ids : [user_ids],
		},
	});
}

export default defineEventHandler(async (event) => {
	await ensureAdmin(event);
	const { channelID } = await readValidatedBody(event, schema.parse);

	const config = useRuntimeConfig();
	const channel = await $fetch<Channel>(
		joinURL(config.public.mmUrl, "api/v4/channels", channelID),
		{
			headers: {
				Authorization: `Bearer ${config.mattermost.token}`,
			},
		}
	).catch((e) => {
		consola.error("Unable to get channel");
		return undefined;
	});

	if (!channel) {
		throw createError({
			statusCode: 404,
			message: "Channel not found",
		});
	}

	if (import.meta.dev) {
		const user = await getMatterMostUserByEmail("archiethebig@gmail.com");
		if (!user) {
			throw createError("Test user not found");
		}
		const { error } = await execute(addUsersToMMChannel, user.id, channelID);
		if (error) {
			throw error;
		}
		return "OK";
	}

	for await (const users of getAllUsers()) {
		addUsersToMMChannel(
			users.map((u) => u.id),
			channelID
		);
	}

	return "OK";
});
