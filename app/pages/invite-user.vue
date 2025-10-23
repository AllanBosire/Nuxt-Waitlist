<template>
	<UContainer class="flex flex-col items-center justify-center">
		<UCard class="w-full max-w-md">
			<UForm :state="form" @submit="onSubmit">
				<u-form-field label="Invite Token" name="token">
					<UInput
						placeholder="You have no valid invite token"
						required
						class="w-full"
						disabled
						:value="token"
					/>
				</u-form-field>
				<u-form-field label="Email to Invite" name="email" class="mt-4">
					<UInput
						v-model="form.email"
						placeholder="Enter email to invite"
						required
						class="w-full"
					/>
				</u-form-field>
				<UButton type="submit" class="mt-4" block>Send Invite</UButton>
			</UForm>
			<UAlert v-if="error" type="error" class="mt-4">{{ error }}</UAlert>
			<UAlert v-if="success" type="success" class="mt-4">Invite sent!</UAlert>
		</UCard>
	</UContainer>
</template>

<script setup lang="ts">
const form = reactive({ token: "", email: "" });
const error = ref("");
const success = ref(false);

const token = useRouteQuery("token");
async function onSubmit() {
	error.value = "";
	success.value = false;
	const { result, error: fetchError } = await execute(
		$fetch("/api/invite-user", {
			method: "POST",
			body: form,
		})
	);
	if (fetchError) {
		error.value = fetchError.message || "Failed to send invite.";
		return;
	}

	if (result) {
		success.value = true;
		form.email = "";
	} else {
		error.value = "Failed to send invite.";
	}
}
</script>
