<script setup lang="ts">
useHead({
	bodyAttrs: {
		class: "",
	},
});
</script>

<template>
	<UApp>
		<NuxtLoadingIndicator />
		<div class="flex flex-col justify-between px-8 lg:px-0 min-h-screen relative">
			<AppNavbar />
			<NuxtPage />
			<AppFooter />
		</div>
	</UApp>
</template>

<style>
body {
	background-size: 12px 12px;
	background-image: radial-gradient(hsla(0, 0%, 86%, 0.3) 1px, transparent 0);
}
</style>
