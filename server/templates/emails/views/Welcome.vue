<script setup lang="ts">
import { defineProps } from "vue";
import { Tailwind, Button, Html, Text, Hr, Container } from "@vue-email/components";
defineProps<{
	username: string;
	password: string;
	link: string;
}>();
</script>

<template>
	<Html lang="en">
		<Tailwind>
			<Container class="bg-gray-100 p-8 font-sans max-w-md mx-auto rounded-lg shadow-md">
				<Text class="text-2xl text-gray-800 mb-6 capitalize">
					Welcome, {{ username }}!
				</Text>

				<Text class="text-base text-gray-600 mb-4">
					Your account has been created successfully. Here are your login details:
				</Text>

				<ul class="list-none p-0 mb-4 text-base text-gray-600 space-y-1">
					<li><strong>Username:</strong> {{ username }}</li>
					<li><strong>Password:</strong> {{ password }}</li>
				</ul>

				<Text class="text-base text-gray-600 mb-4">
					To access your account, please click the magic link below:
				</Text>

				<Button
					:href="link"
					class="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600 inline-block mb-6"
				>
					Login Link
				</Button>

				<Text class="text-sm text-gray-500 mb-6">
					Please keep this information safe. For security reasons, we recommend updating
					your password after your first login.
				</Text>

				<Hr class="border-gray-300 my-6" />

				<Text class="text-xs text-gray-400">
					Thank you,<br />
					The Finueva Team
				</Text>
			</Container>
		</Tailwind>
	</Html>
</template>
