<script setup lang="ts">
import { z } from "zod/v4-mini";
import JSConfetti from "js-confetti";
import type { ZodError } from "zod";

const token = useRouteQuery("token");
const { data: count } = await useFetch("/api/count");
const toast = useToast();

const { data: invite } = await useFetch("/api/validate-invite", {
	method: "POST",
	body: {
		secret: token,
	},
});
const { data: state, validate } = useZodState(
	z
		.object({
			email: z.email("Invalid email"),
			username: z.optional(z.string().check(z.minLength(4))),
			password1: z.string(),
			password2: z.string(),
			token: z.any().check(
				z.refine((token) => {
					if (token) {
						return true;
					}
					return false;
				}, "We were not able to obtain your invite token your link may be invalid; it's invite only")
			),
		})
		.check(
			z.superRefine(({ password1, password2 }, ctx) => {
				if (password1 !== password2) {
					ctx.addIssue({
						path: ["password2"],
						message: "Passwords do not match",
						code: "custom",
					});
				}
			})
		)
);

watch(
	invite,
	() => {
		state.email = invite.value?.for_email || undefined;
	},
	{
		immediate: true,
	}
);
const joiningWaitlist = ref(false);
const success = ref(false);

let jsConfetti: JSConfetti | undefined;
onMounted(() => {
	jsConfetti = new JSConfetti();
});
async function joinWaitlist() {
	state.token = token.value;
	const { data, error } = validate();
	if (error) {
		toast.add({
			title: "An error occurred",
			description: error?.issues.map((i) => i.message).join(","),
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
				password: data.password2,
			},
		});

		state.email = undefined;
		state.password = undefined;
		jsConfetti?.addConfetti().catch(console.error);
		success.value = true;
		toast.add({
			title: "Welcome",
			description: "You have successfully joind Finueva",
		});
	} catch (e: any) {
		switch (e?.response?.status) {
			case 400: {
				toast.add({
					title: "An error occurred",
					description:
						e.data.data.issues ||
						tryParse<ZodError["issues"]>(e.data.data.message)
							.map((i) => i.message)
							.join(", "),
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
	<div class="w-full">
		<UForm :state="state" @submit.prevent="joinWaitlist">
			<div>
				<UFormField class="mt-2" name="email" label="Email">
					<UInput
						class="w-full"
						v-model="state.email"
						placeholder="Your email address"
						:default-value="invite?.for_email"
						:disabled="invite?.for_email ? true : false"
						autocomplete="email"
					/>
				</UFormField>
				<UFormField class="mt-2" name="password" label="Password">
					<UInput
						class="w-full"
						v-model="state.password1"
						placeholder="Create a password"
						required
						type="password"
						autocomplete="new-password"
					/>
				</UFormField>
				<UFormField class="mt-2" name="password" label="Password">
					<UInput
						class="w-full"
						v-model="state.password2"
						placeholder="Confirm your password"
						required
						type="password"
						autocomplete="new-password"
					/>
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

		<UModal :open="success" @close="success = false" title="Welcome to Finueva!">
			<template #content>
				<div class="p-4">
					<p class="mt-2 text-gray-700">
						You have successfully joined the waitlist. 🎉<br />
						We’re excited to have you on board!
					</p>
					<UButton
						class="mt-4"
						@click="success = false"
						color="success"
						:to="$config.public.mmUrl"
						:external="true"
						icon="i-gridicons:external"
					>
						Visit Community
					</UButton>
				</div>
			</template>
		</UModal>
		<HomeVideo />
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
