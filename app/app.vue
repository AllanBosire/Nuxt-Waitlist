<script setup lang="ts">
// useHead({
// 	bodyAttrs: {
// 		class: "",
// 	},
// });
</script>

<template>
	<UApp>
		<NuxtLayout>
			<NuxtLoadingIndicator />
			<NuxtPage />
		</NuxtLayout>
	</UApp>
</template>

<style>
body {
	background-size: 12px 12px;
	background-image: radial-gradient(hsla(0, 0%, 86%, 0.3) 1px, transparent 0);
}
</style>
