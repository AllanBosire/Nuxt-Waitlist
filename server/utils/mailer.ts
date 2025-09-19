import { createTransport } from "nodemailer";

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

export function sendMagicLink(data: {
	email: string;
	username: string;
	password: string;
	link: string;
}) {
	const html = `
		<div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px;">
			<div style="max-width: 480px; margin: auto; background: #fff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 32px;">
				<h2 style="color: #333;">Welcome, ${data.username}!</h2>
				<p style="font-size: 16px; color: #555;">
					Your account has been created successfully. Here are your login details:
				</p>
				<ul style="font-size: 16px; color: #555; list-style: none; padding: 0;">
					<li><strong>Username:</strong> ${data.username}</li>
					<li><strong>Password:</strong> ${data.password}</li>
				</ul>
				<p style="font-size: 16px; color: #555;">
					To access your account, please click the magic link below:
				</p>
				<p>
					<a href="${data.link}" style="display: inline-block; padding: 10px 20px; background: #007bff; color: #fff; border-radius: 4px; text-decoration: none;">
						Login with Magic Link
					</a>
				</p>
				<p style="font-size: 14px; color: #888;">
					Please keep this information safe. For security reasons, we recommend updating your password after your first login.
				</p>
				<hr style="margin: 24px 0;">
				<p style="font-size: 12px; color: #aaa;">
					Thank you,<br>
					The Team
				</p>
			</div>
		</div>
	`;

	return sendMail({
		to: data.email,
		subject: "Welcome to Finueva Community!",
		html,
	});
}
