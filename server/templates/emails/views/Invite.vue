<script setup lang="ts">
import { Tailwind, Button, Html, Text, Container } from "@vue-email/components";
defineProps<{ inviteUrl: string; code: string }>();
</script>

<template>
	<Html lang="en">
		<Tailwind>
			<Container
				class="bg-white p-8 rounded-lg shadow-md font-sans max-w-md mx-auto text-gray-900"
			>
				<Text class="text-2xl font-bold mb-4"
					>You're Invited to Join Finueva!</Text
				>
				<Text class="mb-4">
					You've been invited to join
					<span class="font-semibold">Finueva</span>. Click the button below
					to accept your invite and get started.
				</Text>
				<Button
					:href="inviteUrl"
					class="text-white font-semibold px-6 py-2 rounded transition mb-4"
					style="text-decoration: none; background-color: #6366f1"
				>
					Accept Invite
				</Button>
				<Text class="mt-4">Or use this invite code:</Text>
				<div
					class="bg-gray-100 border border-gray-300 rounded px-4 py-2 mt-2 text-lg font-mono tracking-wider"
				>
					{{ code }}
				</div>
				<Text class="mt-6 text-gray-500 text-sm">
					If you did not expect this invitation, you can safely ignore this email.
				</Text>
			</Container>
		</Tailwind>
	</Html>
</template>
