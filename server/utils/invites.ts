import { consola } from "consola";
import { v7 } from "uuid";

export function createInviteToken(user_id: string) {
	const token = v7();
	useDrizzle()
		.insert(tables.invites)
		.values({
			code: token,
			created_by: user_id,
		})
		.execute()
		.catch((e) => {
			consola.error("Unable to create invite token", e);
			consola.info("Said token:", token);
		});

	return token;
}

export function validateToken(token: string) {
	if (!token) {
		consola.error("empty token");
		return;
	}

	return useDrizzle().query.invites.findFirst({
		where(fields, { and, eq, isNull }) {
			return and(eq(fields.code, token), eq(fields.is_active, true), isNull(fields.used_by));
		},
	});
}

export function inValidateToken(token: string, used_by: string) {
	return useDrizzle()
		.update(tables.invites)
		.set({
			used_at: new Date(),
			used_by,
			is_active: false,
		})
		.where(eq(tables.invites.code, token));
}
