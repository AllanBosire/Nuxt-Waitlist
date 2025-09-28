import { createTransport } from "nodemailer";
import { Welcome } from "../templates/emails/views";
import { render } from "@vue-email/render";

const config = useRuntimeConfig();
export const transporter = createTransport({
	host: config.nodemailer.host,
	port: parseInt(String(config.nodemailer.port)),
	secure: false,
	auth: {
		user: config.nodemailer.email,
		pass: config.nodemailer.password,
	},
});

export function sendMail(
	data: { to: string | string[]; subject: string; from?: string } & (
		| { text: string }
		| { html: string }
	)
) {
	return transporter.sendMail({
		...data,
		from: data.from || config.nodemailer.email,
	});
}

export async function sendWelcomeEmail(data: {
	email: string;
	username: string;
	password: string;
	link: string;
}) {
	const html = await render(Welcome, {
		link: data.link,
		password: data.password,
		username: data.username,
	});

	return sendMail({
		to: data.email,
		subject: "Welcome to Finueva Community!",
		html,
	});
}
