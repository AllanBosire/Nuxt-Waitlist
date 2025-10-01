import { type CustomBotClient, useMatterClient } from "../mattermost/client";
import { consola } from "consola";

export async function sendMessageToUser(userId: string, message: string, botId: string) {
	if (!userId) {
		throw createError("No user id");
	}

	const client = useMatterClient(botId as any);
	const channelId = await createDirectChannel(client, userId);

	if (!channelId) {
		throw createError("Failed to create direct channel");
	}

	return client.createPost({
		channel_id: channelId,
		message,
	});
}

async function createDirectChannel(client: CustomBotClient, userId: string) {
	const { error, result: channel } = await execute(
		client.createDirectChannel([await client.userId(), userId])
	);

	if (error) {
		consola.error("Error creating direct channel:", error);
		return undefined;
	}

	return channel.id;
}
