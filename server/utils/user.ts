import { consola } from "consola";

export async function deleteUser(email: string) {
	const user = await useDrizzle()
		.delete(tables.waitlist)
		.where(eq(tables.waitlist.email, email))
		.returning()
		.execute()
		.catch(consola.fatal);

	user?.forEach((user) => {
		sendMail({
			to: user.email,
			subject: "Account Deletion",
			text: "Your account has been deleted successfully",
		});
	});
}
