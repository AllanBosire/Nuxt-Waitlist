import { consola } from "consola";
export function logout() {
	const toast = useToast();
	$fetch("/logout")
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
}
