export default defineNuxtRouteMiddleware(async () => {
	const { data: me } = await useMe();
	if (!me.value?.isAdmin) {
		return navigateTo("/admin/login");
	}
});
