<template>
	<div class="p-6">
		<UContainer>
			<UCard>
				<template #header>
					<h2 class="text-xl font-bold">Send Bot Messages</h2>
				</template>

				<UForm @submit="onSubmit" class="space-y-6">
					<UFormField label="Select Bot" name="bot">
						<USelectMenu
							:items="bots"
							option-attribute="name"
							value-attribute="id"
							placeholder="Choose a bot"
							@update:model-value="
								(v) => {
									state.bot = v.id;
								}
							"
							class="w-full"
						/>
					</UFormField>

					<UFormField label="Select Recipients" name="recipients">
						<UFieldGroup class="flex items-center">
							<USwitch
								label="All"
								class="w-full"
								@update:model-value="
									(v) => {
										if (v === true) {
											state.recipients = true;
											return;
										}
										state.recipients = [];
									}
								"
								:model-value="
									Array.isArray(state.recipients) && state.recipients.length
										? false
										: true
								"
							/>
							<span class="w-full">Or</span>
							<USelectMenu
								:items="
									users?.map((u) => ({
										id: u.id,
										label: u.email,
									}))
								"
								option-attribute="email"
								value-attribute="id"
								multiple
								placeholder="Choose recipients"
								class="w-full"
								:ui="{
									base: 'rounded',
								}"
								@update:model-value="
									(v) => {
										state.recipients = v.map((u) => u.label);
									}
								"
							/>
						</UFieldGroup>
					</UFormField>

					<UFormField label="Message" name="message">
						<UTextarea
							:rows="6"
							placeholder="Enter your message here..."
							class="w-full"
							v-model="state.message"
						/>
					</UFormField>

					<!-- Send Button -->
					<div class="flex justify-end">
						<UButton
							type="submit"
							color="primary"
							:loading="sending"
							:disabled="sending"
						>
							<template #leading>
								<UIcon name="i-heroicons-paper-airplane" />
							</template>
							Send Message
						</UButton>
					</div>
				</UForm>

				<template #footer>
					<div class="py-4">
						<h3 class="text-lg font-semibold mb-4">Recent Messages</h3>
						<div class="space-y-4" v-if="recentMessages">
							<div
								v-for="message in recentMessages"
								:key="message.id"
								class="border-b border-gray-200 dark:border-gray-700 pb-4"
							>
								<div class="flex justify-between items-start">
									<div>
										<div class="font-medium">{{ message.id }}</div>
										<div class="text-sm text-gray-500">
											Sent at
											{{ new Date(message.timestamp).toLocaleString() }}
										</div>
									</div>
								</div>
								<div class="mt-2 text-sm">{{ message.content }}</div>
							</div>
						</div>
						<p class="w-full text-center" v-else>No Data</p>
					</div>
				</template>
			</UCard>
		</UContainer>
	</div>
</template>

<script setup lang="ts">
import { z } from "zod/v4-mini";

definePageMeta({
	layout: "admin",
	middleware: "admin",
});

const schema = z.object({
	bot: z.string().check(z.minLength(1, "Please select a bot")),
	recipients: z.union([
		z.array(z.string()).check(z.minLength(1, "Please select at least one recipient")),
		z.literal(true),
	]),
	message: z.string().check(z.minLength(1, "Please enter a message")),
});
const { data: state, validate } = useZodState(schema);

onMounted(() => {
	state.recipients = true;
});

const sending = ref(false);

const { data: users } = await useFetch("/api/users", {
	query: {
		limit: 1000,
	},
});
const { data: bots } = await useFetch("/api/mattermost/bots");
const { data: recentMessages, refresh: refreshRecentMessages } = await useFetch(
	"/api/mattermost/messages/recent",
	{
		query: {
			botId: state.bot,
		},
		immediate: false,
	}
);

watch(
	() => state.bot,
	(b) => {
		if (b) {
			refreshRecentMessages();
		}
	}
);

const toast = useToast();
async function onSubmit() {
	const { data, error: validationError } = validate({ prettifyError: true });
	if (validationError) {
		toast.add({
			title: String(validationError),
			color: "error",
		});
		return;
	}
	if (sending.value) return;

	sending.value = true;
	const { error } = await execute(
		$fetch("/api/mattermost/messages/send", {
			method: "POST",
			body: {
				botId: data.bot,
				recipients: data.recipients,
				message: data.message,
			},
		})
	);

	if (error) {
		toast.add({
			title: String(error),
		});
		sending.value = false;
		return;
	}

	refreshRecentMessages();
	data.message = "";
	data.recipients = [];
	toast.add({
		title: "Success",
		description: "Message sent successfully",
		color: "success",
	});
	sending.value = false;
}
</script>
