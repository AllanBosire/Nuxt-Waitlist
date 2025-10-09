import { consola } from "consola";
export async function logout() {
	const toast = useToast();
	await $fetch("/logout")
		.then(() => {
			toast.add({
				title: "Logged out successfully",
				color: "success",
			});
		})
		.catch((e) => {
			consola.fatal(e);
			toast.add({
				title: String(e),
				color: "error",
			});
		});
	useCookie("MMAUTHTOKEN").value = "";
	navigateTo("/admin/login");
}
