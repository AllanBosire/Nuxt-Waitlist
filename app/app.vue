<script setup lang="ts">
const { sendAnalytics } = useAnalytics();
onMounted(() => {
	execute(sendAnalytics);
});

useScript({
	src: "https://mami.ifkafin.com/script.js",
	"data-website-id": "de166c08-9f14-42f3-93cd-9f0c3c7d248a",
});
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
