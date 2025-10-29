<script setup lang="ts">
const config = useAppConfig();

const route = useRoute();
const home = computed(() => route.fullPath === "/");

const { data: me } = useMe();
</script>

<template>
	<header class="sticky top-0 z-50">
		<UContainer class="mx-auto flex h-16 items-center justify-between px-4 transition-all">
			<div class="flex items-center gap-5">
				<NuxtLink to="/" class="flex items-center gap-2">
					<Logo class="w-5 h-5" />
					<LogoName />
				</NuxtLink>
			</div>
			<div class="gap-2 flex">	
				<UButton v-if="me" color="warning" @click="logout">Log Out</UButton>
				<UButton v-else-if="!home" to="/" color="primary">Sign Up</UButton>
			</div>
		</UContainer>
	</header>
</template>

<style scoped>
.menu-toggle.active .menu-bar[data-position="top"] {
	transform: translateY(0) rotate(45deg) scaleX(1.05);
}

.menu-toggle.active .menu-bar[data-position="bottom"] {
	transform: translateY(0) rotate(-45deg) scaleX(1.05);
}
</style>
