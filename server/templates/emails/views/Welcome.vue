<script setup lang="ts">
import { Tailwind, Button, Html, Text, Hr, Container } from "@vue-email/components";
defineProps<{
	username: string;
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
					Your account has been created successfully.
				</Text>

				<ul class="list-none p-0 mb-4 text-base text-gray-600 space-y-1">
					<li><strong>Username:</strong> {{ username }}</li>
				</ul>

				<Text class="text-base text-gray-600 mb-4">
					To access our platform, use the link below:
				</Text>

				<Button
					:href="link"
					class="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600 inline-block mb-6"
				>
					Login Link
				</Button>

				<Hr class="border-gray-300 my-6" />

				<Text class="text-xs text-gray-400">
					Thank you,<br />
					The Finueva Team
				</Text>
			</Container>
		</Tailwind>
	</Html>
</template>
