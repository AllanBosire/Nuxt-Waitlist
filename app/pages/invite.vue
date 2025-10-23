<template>
	<UContainer class="flex flex-col items-center justify-center min-h-screen">
		<UCard class="w-full max-w-md mt-12">
			<UForm :state="form" @submit="onSubmit">
				<u-form-field label="Invite Code" name="inviteCode">
					<UInput
						v-model="form.inviteCode"
						placeholder="Enter your invite code"
						required
					/>
				</u-form-field>
				<UButton type="submit" class="mt-4" block>Continue</UButton>
			</UForm>
			<UAlert v-if="error" type="error" class="mt-4">{{ error }}</UAlert>
		</UCard>
	</UContainer>
</template>

<script setup lang="ts">
import { ref } from "vue";

const form = ref({ inviteCode: "" });
const error = ref("");

async function onSubmit() {
	error.value = "";
	const { result, error: fetchError } = await execute(
		$fetch("/api/invited-join", {
			method: "POST",
			body: { code: form.value.inviteCode },
		})
	);
	if (fetchError) {
		error.value = fetchError.message || "Invalid invite code.";
		return;
	}

	if (result) {
		navigateTo("/");
	} else {
		error.value = "Invalid invite code.";
	}
}
</script>
