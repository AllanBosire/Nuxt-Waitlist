export function useMe() {
	const res = useFetch("/me");
	watch(useCookie("MMAUTHTOKEN"), () => {
		res.execute();
	});
	return res;
}
