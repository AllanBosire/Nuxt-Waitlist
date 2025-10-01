<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const route = useRoute();
const items: NavigationMenuItem[][] = [
	[
		{
			label: "General",
			icon: "i-lucide-user",
			to: "/admin/analytics",
		},
		{
			label: "Broadcast",
			icon: "i-heroicons-chat-bubble-left-right",
			to: "/admin/send-message",
		},
		{
			label: "Notifications",
			icon: "i-lucide-bell",
		},
	],
	[
		{
			label: "Help & Feedback",
			icon: "i-lucide-help-circle",
			to: "https://github.com/15996376CanadaInc/geel/issues",
			target: "_blank",
		},
		{
			label: "Logout",
			icon: "i-heroicons-arrow-left-on-rectangle",
			onSelect(e) {
				console.log(e);
			},
			as: "button",
			class: "text-amber-500",
		},
	],
];
</script>
<template>
	<UDashboardGroup>
		<UDashboardSidebar>
			<template #header="{ collapsed }">
				<Logo class="h-5 w-auto shrink-0" />
				<LogoName v-if="!collapsed" />
			</template>
			<template #default="{ collapsed }">
				<UNavigationMenu :items="items[0]" highlight :collapsed orientation="vertical" />
				<UNavigationMenu
					:items="items[1]"
					highlight
					:collapsed
					orientation="vertical"
					class="mt-auto"
				/>
			</template>
		</UDashboardSidebar>

		<UMain class="w-full overflow-auto">
			<div class="mt-10">
				<slot />
			</div>
		</UMain>
	</UDashboardGroup>
</template>
