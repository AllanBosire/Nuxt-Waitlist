<template>
	<UContainer class="w-[700px] mt-20">
		<UCard>
			<UForm :state="data" :schema @submit="submit()">
				<UFormField name="channelID" label="Enter Channel ID">
					<UInput class="w-full" v-model="data.channelID" />
				</UFormField>
				<UButton type="submit" class="mt-4"> Add All To Channel </UButton>
			</UForm>
		</UCard>
	</UContainer>
</template>
<script setup lang="ts">
import { z } from "zod";
import { consola } from "consola";

definePageMeta({
	middleware: "admin",
	layout: "admin",
});

const schema = z.object({
	channelID: z.string().check(z.minLength(1)),
});

const { data } = useZodState(schema);
const {
	data: response,
	refresh: submit,
	error,
} = useFetch("/api/new-public-channel", {
	immediate: false,
	watch: false,
	body: data,
	method: "POST",
});

const toast = useToast();
watch([response, error], ([response, error]) => {
	if (error) {
		consola.error(error);
		toast.add({
			title: error.message,
			description: String(error),
		});
		return;
	}

	toast.add({
		title: "Users added to channel successfully",
		description: response,
	});
});
</script>
