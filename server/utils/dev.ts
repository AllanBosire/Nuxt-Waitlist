export async function sendEmergencyEmailToDev(...args: any[]) {
	const message = JSON.stringify(args);
	const config = useRuntimeConfig();
	sendMail({
		to: config.dev.email,
		text: message,
		subject: "Waitlist server fatal error",
	});

	const dev = await getMatterMostUserByEmail(config.dev.email);
	if (dev) {
		getOrCreateDM({
			bot: "notifications",
			user_id: dev.id,
			message,
		});
	}
}
