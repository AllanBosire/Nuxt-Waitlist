<template>
	<div class="flex items-center justify-center">
		<UCard class="w-full max-w-md">
			<template #header>
				<h2 class="text-xl font-bold">Admin Login</h2>
			</template>
			<UForm :schema="schema" :state="state" @submit="onSubmit">
				<UFormField label="Username" name="username">
					<UInput v-model="state.username" class="w-full mb-2" />
				</UFormField>
				<UFormField label="Password" name="password">
					<UInput v-model="state.password" type="password" class="w-full mb-2" />
				</UFormField>
				<UButton type="submit" color="primary" block>Login</UButton>
			</UForm>
		</UCard>
	</div>
</template>

<script setup lang="ts">
import { z } from "zod";
import { consola } from "consola";
const toast = useToast();

const router = useRouter();

const schema = z.object({
	username: z.string().min(1),
	password: z.string().min(1),
});

const state = ref({
	username: "",
	password: "",
});

async function onSubmit() {
	const { error } = await execute(
		$fetch("/admin-login", {
			method: "POST",
			body: state.value,
		})
	);
	if (error) {
		consola.error(error);
		toast.add({
			title: error.message,
			color: "error",
		});
		return;
	}
	toast.add({
		title: "Login Successful",
		color: "success",
	});
	router.push("/admin/analytics");
}
</script>
