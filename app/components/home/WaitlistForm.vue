<script setup lang="ts">
import { z } from "zod/v4-mini";

const token = useRouteQuery("token");

const { data: count } = await useFetch("/api/count");
const toast = useToast();

const { data: state, validate } = useZodState(
	z.object({
		email: z.email("Invalid email"),
		username: z.optional(z.string().check(z.minLength(4))),
		password: z.string(),
		token: z.any().check(
			z.refine((token) => {
				if (token) {
					return true;
				}
				return false;
			}, "We were not able to obtain your invite token your link may be invalid; it's invite only")
		),
	})
);

const joiningWaitlist = ref(false);
async function joinWaitlist() {
	const { data, error } = validate();
	if (error) {
		toast.add({
			title: "An error occurred",
			description: error.issues.map((i) => i.message).join(","),
			color: "error",
		});
		return;
	}

	joiningWaitlist.value = true;
	try {
		await $fetch("api/join-waitlist", {
			method: "POST",
			body: {
				email: data.email,
				token: data.token,
				password: data.password,
			},
		});

		state.email = undefined;
	} catch (e: any) {
		switch (e?.response?.status) {
			case 400: {
				toast.add({
					title: e.message,
					description: e.data.data.issues || tryParse(e.data.data.message),
					color: "error",
				});
				break;
			}
			case 429: {
				toast.add({
					title: "Too Many Requests",
					description:
						"You’ve made too many requests in a short period. Please wait a moment and try again.",
					color: "warning",
				});
				break;
			}
		}
	} finally {
		joiningWaitlist.value = false;
	}
}

const config = useAppConfig();
</script>

<template>
	<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
		<UForm :state="state" @submit="joinWaitlist">
			<div>
				<UFormField class="mt-2" name="email" label="Email">
					<UInput class="w-full" v-model="state.email" placeholder="Email address" />
				</UFormField>
				<UFormField class="mt-2" name="password" label="Password">
					<UInput
						class="w-full"
						v-model="state.password"
						placeholder="Invite code"
						required
						type="password"
					/>
				</UFormField>
				<UFormField class="mt-2" name="token" label="Token" hidden>
					<UInput class="w-full" v-model="token" placeholder="Invite code" />
				</UFormField>
			</div>
			<div class="mt-6">
				<UButton
					type="submit"
					class="flex w-full cursor-pointer justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-all bg-purple hover:bg-purple/85"
					:loading="joiningWaitlist"
				>
					<span>Sign Up</span>
				</UButton>
			</div>
		</UForm>

		<div class="mt-4 flex gap-2 items-center justify-center">
			<UAvatarGroup v-if="count?.count">
				<UAvatar src="https://i.pravatar.cc/150?img=3" />
				<UAvatar src="https://i.pravatar.cc/150?img=5" />
				<UAvatar src="https://i.pravatar.cc/150?img=8" />
			</UAvatarGroup>
			<p class="font-medium text-gray-500 text-sm">Join {{ count?.count || 0 }}+ others</p>
		</div>
		<p class="mt-10 text-center text-sm text-gray-400" v-if="config.waitlist.showSignups">
			Already signed up?
			<NuxtLink
				to="/leaderboard"
				class="cursor-pointer transition-color font-semibold leading-6 text-purple hover:text-purple/90"
			>
				Check your spot on the waiting list.
			</NuxtLink>
		</p>
	</div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 200ms;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
