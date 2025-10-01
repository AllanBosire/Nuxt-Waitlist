<template>
	<div>
		<div class="flex items-center gap-6 mb-6">
			<div
				class="flex-shrink-0 w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600"
			>
				<span>{{ user.first_name?.charAt(0) || user.username?.charAt(0) }}</span>
			</div>
			<div>
				<h3 class="text-xl font-semibold">{{ user.first_name }} {{ user.last_name }}</h3>
				<div class="text-gray-500">@{{ user.username }}</div>
				<div class="text-gray-400 text-sm">ID: {{ user.id }}</div>
			</div>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
			<div>
				<div class="font-medium text-gray-700">Email</div>
				<div class="text-gray-900">{{ user.email }}</div>
			</div>
			<div>
				<div class="font-medium text-gray-700">Joined</div>
				<div class="text-gray-900">{{ formatDate(user.create_at) }}</div>
			</div>
			<div>
				<div class="font-medium text-gray-700">Roles</div>
				<div class="text-gray-900">{{ user.roles }}</div>
			</div>
			<div>
				<div class="font-medium text-gray-700">Locale</div>
				<div class="text-gray-900">{{ user.locale }}</div>
			</div>
			<div>
				<div class="font-medium text-gray-700">Auth Service</div>
				<div class="text-gray-900">{{ user.auth_service || "N/A" }}</div>
			</div>
			<div>
				<div class="font-medium text-gray-700">Email Verified</div>
				<div class="text-gray-900">{{ user.email_verified ? "Yes" : "No" }}</div>
			</div>
		</div>
		<div class="mb-4">
			<div class="font-medium text-gray-700 mb-2">Timezone</div>
			<div class="text-gray-900">
				{{ user.timezone?.automaticTimezone || user.timezone?.manualTimezone || "N/A" }}
			</div>
		</div>
		<div class="mb-4">
			<div class="font-medium text-gray-700 mb-2">Notify Props</div>
			<div class="text-gray-900 text-sm">
				<div>Email: {{ user.notify_props?.email }}</div>
				<div>Push: {{ user.notify_props?.push }}</div>
				<div>Desktop: {{ user.notify_props?.desktop }}</div>
			</div>
		</div>
		<div class="mt-8 flex justify-end">
			<UButton color="error" icon="i-heroicons-trash" variant="soft" size="md"
				>Unsubscribe</UButton
			>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { MMUser } from "~~/server/utils/mattermost";
const props = defineProps<{ user: MMUser }>();

function formatDate(ts: number) {
	if (!ts) return "N/A";
	return new Date(ts).toLocaleDateString();
}
</script>
