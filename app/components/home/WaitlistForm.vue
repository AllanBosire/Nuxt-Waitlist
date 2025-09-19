<script setup lang="ts">
import * as z from 'zod';
import { useClipboard, onClickOutside } from '@vueuse/core';

interface WaitlistError {
  code?: string;
  message: string;
  path: string[];
  validation?: string;
}

const schema = z.object({
  email: z.string().email('Invalid email'),
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  email: undefined,
})

const email = ref('');
const joiningWaitlist = ref(false);
const success = ref(false);
const errors = ref<WaitlistError[]>([]);
const config = useAppConfig();

const { data: count } = await useFetch('/api/count');
const yourIndex = computed(() => (count.value?.count || 0) + 1);

const modalOpen = ref(false);

const runtimeConfig = useRuntimeConfig();
const hovered = ref(false);

const { copy: copyToClipboard } = useClipboard();

const copyButtonRef = ref<HTMLElement>();

const copyState = ref('init');

onClickOutside(copyButtonRef, () => {
  if (copyState.value === 'copied') {
    copyState.value = 'init'
  }
})

const url = runtimeConfig?.public?.socialShare?.baseUrl || "";
const copy = (_e: MouseEvent) => {
  copyToClipboard(url)
    .then(() => {
      copyState.value = 'copied'
    })
    .catch((err) => {
      // eslint-disable-next-line no-console
      console.warn("Couldn't copy to clipboard!", err)
    })
}

const joinWaitlist = async () => {
  joiningWaitlist.value = true;
  errors.value = [];

  try {
    await $fetch('api/join-waitlist', {
      method: 'POST', body: {
        email: state.email,
      }
    });

    email.value = '';
    success.value = true;
    modalOpen.value = true;
  } catch (e: any) {
    switch (e?.response?.status) {
      case 400: {
        errors.value = e.data.data.issues
        break;
      }
      case 429: {
        errors.value = [{ path: ['server'], message: 'You’ve made too many requests in a short period. Please wait a moment and try again.' }]
        break;
      }
    }
  } finally {
    joiningWaitlist.value = false;
  }

}

</script>

<template>

  <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
    <UForm :schema="schema" :state="state" @submit="joinWaitlist">
      <div>
        <UFormField class="mt-2" name="email">
          <UInput class="w-full" v-model="state.email" placeholder="Email address" />
        </UFormField>
      </div>
      <div class="mt-6">
        <UButton type="submit"
          class="flex w-full cursor-pointer justify-center rounded-md bg-primary-500 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-primary-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 transition-all">
          <span>Sign
            Up</span>
        </UButton>

        <p class="mt-4 text-base/6 text-red-500 data-[disabled]:opacity-50 sm:text-sm/6" v-for="error in errors">
          {{ error.path.join(',') }}: {{ error.message }}
        </p>
      </div>
    </UForm>

    <UModal v-model:open="modalOpen" :title="`Thanks! you are number ${yourIndex} on the waitlist.`"
      description="We'll let you know when we launch.">

      <template #body>
        <div class="flex flex-col items-center justify-center gap-4">
          <p class="text-xl font-medium">tell your friends:</p>
          <div class="flex gap-4">
            <SocialShare v-for="network in ['facebook', 'x', 'linkedin', 'email']" :key="network" :network="network"
              :styled="true" />
          </div>
          <div class="bg-black rounded-full py-2 px-5 text-gray-300 flex items-center gap-2">
            <span>{{ runtimeConfig?.public?.socialShare?.baseUrl }}</span>
            <button ref="copyButtonRef" @click="copy"
              class="border font-mono rounded-md text-sm border-gray-600 flex gap-2 items-center p-1 transition-all font-medium">
              <span class="sr-only">Copy to clipboard</span>
              <span class="icon-wrapper h-[18px] w-[18px] block relative">
                <Transition name="fade">
                  <Icon v-if="copyState === 'copied'" name="tabler:copy-check" size="18"
                    class="copied block absolute" />
                  <Icon v-else name="tabler:copy" size="18" class="absolute block" />
                </Transition>
              </span>
            </button>
          </div>
        </div>
      </template>
    </UModal>

    <div class="mt-4 flex gap-2 items-center justify-center">
      <UAvatarGroup>
        <UAvatar src="https://i.pravatar.cc/150?img=3" />
        <UAvatar src="https://i.pravatar.cc/150?img=5" />
        <UAvatar src="https://i.pravatar.cc/150?img=8" />
      </UAvatarGroup>
      <p class="font-medium text-gray-500 text-sm">Join {{ count?.count || 0 }}+ others</p>
    </div>
    <p class="mt-10 text-center text-sm text-gray-400" v-if="config.waitlist.showSignups">
      Already signed up?
      <NuxtLink to="/leaderboard"
        class="cursor-pointer transition-color font-semibold leading-6 text-primary-400 hover:text-primary-300">
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
  opacity: 0
}
</style>
