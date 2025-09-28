import { consola } from "consola";
import { deleteUser } from "../utils/user";

export default defineNitroPlugin(async () => {
	const bot = useMatterClient("welcome");
	const botSocket = bot.getWebSocket();
	botSocket.on("user_updated", async (message: { user: MMUser }) => {
		if (Boolish(message?.user?.delete_at)) {
			deleteUser(message.user.email);
		}
	});

	consola.success("Listening for user deletions");
});
