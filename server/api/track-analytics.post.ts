import { defineEventHandler, readBody } from "h3";
import db from "../database/index";
import { useIP } from "../utils/location";
import { consola } from "consola";

export default defineEventHandler(async (event) => {
	const body = await readBody(event);
	const ip =
		(await useIP(event).catch((e) => {
			consola.error(e);
			return getRequestIP(event);
		})) || event.node.req.socket.remoteAddress;
	await db
		.insert(tables.analytics)
		.values({
			session_id: body.sessionId,
			data: body,
			ip,
			created_at: new Date(),
		})
		.onConflictDoUpdate({
			target: tables.analytics.session_id,
			set: {
				data: body,
				ip,
			},
		});
	return "OK";
});
