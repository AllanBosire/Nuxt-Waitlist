import type { RuntimeConfig } from "nuxt/schema";
import clients from "@mattermost/client";
import WebSocket from "ws";
import { consola } from "consola";

export type Bot = keyof RuntimeConfig["mattermost"]["bots"];
interface BotSocket {
	on: JSFunction<void, [MattermostEventType, (data?: any) => void]>;
	off: JSFunction<void, [MattermostEventType, (data?: any) => void]>;
	close: JSFunction;
	raw: WebSocket;
}

export type CustomBotClient = Omit<InstanceType<typeof clients.Client4>, "userId"> & {
	getWebSocket: () => BotSocket;
	userId: () => Promise<string>;
};

declare global {
	var botSockets: Map<Bot, BotSocket> | undefined;
	var botClients: Map<Bot, CustomBotClient> | undefined;
}

export type DMChannel = Awaited<
	ReturnType<InstanceType<typeof clients.Client4>["createDirectChannel"]>
>;
export async function sendMessage(bot: CustomBotClient, dmChannel: DMChannel, message: string) {
	const { error } = await execute(bot.createPost, {
		channel_id: dmChannel.id,
		message: message,
	});

	if (error) {
		throw createError({
			message: "Unable to create post",
			cause: error,
		});
	}
}

const dms = new Map<string, DMChannel>();
export async function getOrCreateDM(details: { bot: Bot; message?: string; user_id: string }) {
	const bot = useMatterClient(details.bot);
	const key = `${details.bot}-${details.user_id}`;
	let dmChannel = dms.get(key);
	if (!dmChannel) {
		const { result, error: dmError } = await execute(bot.createDirectChannel, [
			await bot.userId(),
			details.user_id,
		]);
		if (dmError && !result) {
			throw createError({
				message: "Unable to create DM",
				cause: dmError,
			});
		}

		dmChannel = result;
		dms.set(key, dmChannel);
	}

	if (details.message) {
		sendMessage(bot, dmChannel, details.message);
	}

	return dmChannel;
}

/**
 * @throws an error when the bot is not found
 */
export function useMatterClient(bot: Bot) {
	const config = useRuntimeConfig();
	if (!config.mattermost.bots[bot]) {
		throw createError("No such bot");
	}

	if (globalThis.botClients?.has(bot)) {
		return globalThis.botClients.get(bot)!;
	}

	const client = new clients.Client4();
	client.setUrl(config.public.mmUrl);
	const token = config.mattermost.bots[bot]?.token;

	client.setToken(token);

	console.info("Initialised mattermost bot: ", bot);
	const _client = {
		...client,
		async userId() {
			if (!client.userId) {
				const me = await client.getMe();
				client.userId = me.id;
			}
			return client.userId;
		},
		getWebSocket() {
			if (!globalThis.botSockets) globalThis.botSockets = new Map();

			const existing = globalThis.botSockets.get(bot);
			if (existing) return existing;

			const url = this.getWebSocketUrl();
			const listeners = new Map<string, Set<(data?: any) => void>>();

			const connect = (): WebSocket => {
				const ws = new WebSocket(url, {
					headers: { Authorization: `Bearer ${token}` },
				});

				ws.on("message", (raw) => {
					const message = tryParse<{ event?: string; data?: any; action?: string }>(
						raw.toString()
					);

					if (message.event) {
						emit(message.event, message.data);
					}
					if (message.hasOwnProperty("seq_reply") || message.hasOwnProperty("status")) {
						return;
					}
					if (
						message.hasOwnProperty("action") &&
						["ping", "pong"].includes(message.action!)
					) {
						return;
					}
					consola.debug("Unknown WebSocket message:", message);
				});

				ws.on("open", () => {
					consola.success(`WebSocket opened for bot ${bot}`);
					emit("open");
				});

				ws.on("error", (err) => emit("error", err));

				ws.on("close", (code, reason) => {
					consola.warn(
						`WebSocket closed for bot ${bot} (code: ${code}, reason: ${reason})`
					);
					reconnect();
				});

				return ws;
			};

			const emit = (event: string, data?: any) => {
				if (listeners.has(event)) {
					for (const cb of listeners.get(event)!) {
						try {
							cb(data);
						} catch (err) {
							consola.error(`Error in listener '${event}':`, err);
						}
					}
				}
			};

			const on = (event: string, callback: (data?: any) => void) => {
				if (!listeners.has(event)) listeners.set(event, new Set());
				listeners.get(event)!.add(callback);
				return () => off(event, callback);
			};

			const off = (event: string, callback: (data?: any) => void) => {
				listeners.get(event)?.delete(callback);
				if (listeners.get(event)?.size === 0) listeners.delete(event);
			};

			let ws = connect();

			// ---- Reconnection logic with persistent listeners ----
			function reconnect() {
				let retries = 0;
				const maxRetries = 10;
				const retryInterval = 5000;

				const tryReconnect = () => {
					if (retries >= maxRetries) {
						consola.error(`Bot ${bot} failed to reconnect after ${maxRetries} tries.`);
						sendEmergencyEmailToDev(bot, "WebSocket failed to reconnect");
						return;
					}

					retries++;
					consola.info(
						`Reconnecting WebSocket for bot ${bot} (attempt ${retries}/${maxRetries})...`
					);

					const newWs = connect();

					newWs.once("open", () => {
						consola.success(
							`Bot ${bot} reconnected successfully after ${retries} tries.`
						);
						ws = newWs;
						globalThis.botSockets?.set(bot, socket);
					});

					newWs.once("error", () => {
						setTimeout(tryReconnect, retryInterval);
					});
				};

				setTimeout(tryReconnect, retryInterval);
			}

			const socket = {
				on,
				off,
				close: () => ws.close(),
				raw: ws,
			};

			globalThis.botSockets.set(bot, socket);
			return socket;
		},
	} as CustomBotClient;

	if (!globalThis.botClients) {
		globalThis.botClients = new Map();
	}

	globalThis.botClients.set(bot, _client);
	return _client;
}

function sendTyping(bot: Bot, channel_id: string) {
	const payload = JSON.stringify({
		action: "user_typing",
		channel_id,
	});
	const wsClient = useMatterClient(bot).getWebSocket().raw;
	if (wsClient.readyState === WebSocket.OPEN) {
		wsClient.send(payload);
	} else {
		wsClient.addEventListener("open", () => {
			wsClient.send(payload);
		});
	}
}

/**
 * Show typing indicator for the duration of a given async operation.
 * @param bot The bot name
 * @param channelId The Mattermost channel ID (e.g., DM or public channel)
 * @param promise A promise (async task) to run while showing typing
 */
export async function showTyping<T>(bot: Bot, channelId: string, promise: Promise<T>) {
	let typingInterval: NodeJS.Timeout | null = null;

	typingInterval = setInterval(() => sendTyping(bot, channelId), 3000);
	sendTyping(bot, channelId);

	const { result, error } = await execute(promise);
	if (typingInterval) {
		clearInterval(typingInterval);
		typingInterval = null;
	}
	if (error) {
		consola.error(error);
		return undefined;
	}

	return result;
}

export type MattermostEventType =
	| "added_to_team"
	| "authentication_challenge"
	| "channel_converted"
	| "channel_created"
	| "channel_deleted"
	| "channel_member_updated"
	| "channel_updated"
	| "channel_viewed"
	| "config_changed"
	| "delete_team"
	| "direct_added"
	| "emoji_added"
	| "ephemeral_message"
	| "group_added"
	| "hello"
	| "leave_team"
	| "license_changed"
	| "memberrole_updated"
	| "new_user"
	| "plugin_disabled"
	| "plugin_enabled"
	| "plugin_statuses_changed"
	| "post_deleted"
	| "post_edited"
	| "post_unread"
	| "posted"
	| "preference_changed"
	| "preferences_changed"
	| "preferences_deleted"
	| "reaction_added"
	| "reaction_removed"
	| "response"
	| "role_updated"
	| "status_change"
	| "typing"
	| "update_team"
	| "user_added"
	| "user_removed"
	| "user_role_updated"
	| "user_updated"
	| "dialog_opened"
	| "thread_updated"
	| "thread_follow_changed"
	| "thread_read_changed";
