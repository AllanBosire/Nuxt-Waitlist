import type { RuntimeConfig } from "nuxt/schema";
import clients from "@mattermost/client";
import WebSocket from "ws";

type Bot = keyof RuntimeConfig["mattermost"]["bots"];
interface BotSocket {
	on: JSFunction<void, [string, (data?: any) => void]>;
	off: JSFunction<void, [string, (data?: any) => void]>;
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

export function useMatterClient(bot: Bot) {
	if (globalThis.botClients?.has(bot)) {
		return globalThis.botClients.get(bot)!;
	}

	const client = new clients.Client4();
	const config = useRuntimeConfig();
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
			if (!globalThis.botSockets) {
				globalThis.botSockets = new Map();
			}

			const existing = globalThis.botSockets.get(bot);
			if (existing) {
				return existing;
			}

			const url = this.getWebSocketUrl();

			const ws = new WebSocket(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			const listeners = new Map<string, Set<(data?: any) => void>>();

			function on(event: string, callback: JSFunction): () => void {
				if (!listeners.has(event)) {
					listeners.set(event, new Set());
				}
				listeners.get(event)!.add(callback);
				return () => off(event, callback);
			}

			function off(event: string, callback: JSFunction): void {
				if (listeners.has(event)) {
					listeners.get(event)!.delete(callback);
					if (listeners.get(event)!.size === 0) {
						listeners.delete(event);
					}
				}
			}

			function emit(event: string, data?: any): void {
				if (listeners.has(event)) {
					for (const cb of listeners.get(event)!) {
						try {
							cb(data);
						} catch (err) {
							console.error(`Error in listener for event '${event}':`, err);
						}
					}
				}
			}

			function tryParse(raw: string): { event?: string; data?: any } {
				try {
					return JSON.parse(raw);
				} catch {
					return {};
				}
			}

			ws.on("message", (raw: WebSocket.Data) => {
				const message = tryParse(raw.toString());
				if (message.event) {
					emit(message.event, message.data);
				} else {
					console.error("No message event", raw);
				}
			});

			ws.on("open", () => emit("open"));
			ws.on("close", () => emit("close"));
			ws.on("error", (err: Error) => emit("error", err));

			const socket = {
				on,
				off,
				close: ws.close,
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
