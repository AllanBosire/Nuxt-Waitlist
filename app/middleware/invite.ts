import { defineNuxtRouteMiddleware, navigateTo } from "#app";

export default defineNuxtRouteMiddleware((to, from) => {
	// Allow access to invite, admin, and static assets
	if (to.path.startsWith("/invite") || to.path.startsWith("/admin")) {
		return;
	}

	// Check if user is authenticated (has waitlistEmail cookie)
	const email = useCookie("waitlistEmail").value;
	if (!email) {
		return navigateTo("/invite");
	}
});
