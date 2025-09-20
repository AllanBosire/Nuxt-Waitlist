<script setup lang="ts">
import { z } from "zod/v4-mini";
import { useClipboard, onClickOutside } from "@vueuse/core";

interface WaitlistError {
	code?: string;
	message: string;
	path: string[];
	validation?: string;
}

type Schema = z.output<typeof schema>;

const referrer = useRouteQuery("referrer");
const state = reactive<Partial<Schema>>({
	email: undefined,
	username: undefined,
	referrer: referrer.value,
});

const email = ref("");
const joiningWaitlist = ref(false);
const success = ref(false);
const errors = ref<WaitlistError[]>([]);
const config = useAppConfig();

const { data: count } = await useFetch("/api/count");
const yourIndex = computed(() => (count.value?.count || 0) + 1);

const modalOpen = ref(false);

const runtimeConfig = useRuntimeConfig();

const { copy: copyToClipboard } = useClipboard();

const copyButtonRef = ref<HTMLElement>();

const copyState = ref("init");

onClickOutside(copyButtonRef, () => {
	if (copyState.value === "copied") {
		copyState.value = "init";
	}
});

const url = computed(
	() => `${runtimeConfig?.public?.socialShare?.baseUrl}?referrer=${state.email}`
);
const copy = (_e: MouseEvent) => {
	copyToClipboard(url.value)
		.then(() => {
			copyState.value = "copied";
		})
		.catch((err) => {
			// eslint-disable-next-line no-console
			console.warn("Couldn't copy to clipboard!", err);
		});
};

function parse(str: any) {
	try {
		return JSON.parse(str);
	} catch (_) {
		return str;
	}
}

const { data: username, refresh: _refresh } = useFetch("/api/check-username", {
	method: "POST",
	immediate: false,
	body: {
		username: toRef(() => state.username),
	},
	watch: false,
});

const refresh = debounce(_refresh, 500);
watch(
	() => state.username,
	() => {
		refresh();
	}
);
const schema = z
	.object({
		email: z.email("Invalid email"),
		username: z.optional(z.string().check(z.minLength(4))),
		referrer: z.optional(z.string()),
	})
	.check(
		z.superRefine((_, ctx) => {
			if (username.value?.exists) {
				ctx.addIssue({
					code: "custom",
					path: ["username"],
					message: "Sorry, this username is already taken",
				});

				errors.value = [
					{
						code: "custom",
						path: ["username"],
						message: "Sorry, this username is already taken",
					},
				];
			}
		})
	);

const joinWaitlist = async () => {
	joiningWaitlist.value = true;
	errors.value = [];

	try {
		await $fetch("api/join-waitlist", {
			method: "POST",
			body: state,
		});

		email.value = "";
		success.value = true;
		modalOpen.value = true;
	} catch (e: any) {
		switch (e?.response?.status) {
			case 400: {
				errors.value = e.data.data.issues || parse(e.data.data.message);
				break;
			}
			case 429: {
				errors.value = [
					{
						path: ["server"],
						message:
							"You’ve made too many requests in a short period. Please wait a moment and try again.",
					},
				];
				break;
			}
		}
	} finally {
		joiningWaitlist.value = false;
	}
};
</script>

<template>
	<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
		<UForm :schema="schema" :state="state" @submit="joinWaitlist">
			<div>
				<UFormField>
					<UInput
						class="w-full"
						placeholder="Username (optional)"
						v-model="state.username"
					/>
				</UFormField>
				<UFormField class="mt-2" name="email">
					<UInput class="w-full" v-model="state.email" placeholder="Email address" />
				</UFormField>
			</div>
			<div class="mt-6">
				<UButton
					type="submit"
					class="flex w-full cursor-pointer justify-center rounded-md px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-all bg-purple hover:bg-purple/85"
				>
					<span>Sign Up</span>
				</UButton>

				<p
					class="mt-4 text-base/6 text-red-500 data-[disabled]:opacity-50 sm:text-sm/6"
					v-for="error in errors"
				>
					<template v-if="error.message">
						{{ error.path?.join(",") }}: {{ error?.message }}
					</template>
					<template v-else>
						{{ error }}
					</template>
				</p>
			</div>
		</UForm>

		<UModal
			v-model:open="modalOpen"
			:title="`Thanks! you are number ${yourIndex} on the waitlist.`"
			description="We'll let you know when we launch."
			@after:leave="console.log"
		>
			<template #body>
				<div class="flex flex-col items-center justify-center gap-4">
					<p class="text-xl font-medium">tell your friends:</p>
					<div class="flex gap-4">
						<SocialShare
							v-for="network in ['facebook', 'x', 'linkedin', 'email']"
							:key="network"
							:network="network"
							:styled="true"
						/>
					</div>
					<div
						class="bg-black rounded-full py-2 px-5 text-gray-300 flex items-center gap-2"
					>
						<span>{{ url }}</span>
						<button
							ref="copyButtonRef"
							@click="copy"
							class="border font-mono rounded-md text-sm border-gray-600 flex gap-2 items-center p-1 transition-all font-medium"
						>
							<span class="sr-only">Copy to clipboard</span>
							<span class="icon-wrapper h-[18px] w-[18px] block relative">
								<Transition name="fade">
									<Icon
										v-if="copyState === 'copied'"
										name="tabler:copy-check"
										size="18"
										class="copied block absolute"
									/>
									<Icon
										v-else
										name="tabler:copy"
										size="18"
										class="absolute block"
									/>
								</Transition>
							</span>
						</button>
					</div>
				</div>
			</template>
		</UModal>

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
