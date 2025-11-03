<script setup lang="ts">
import type {
  FormEvent,
  FormSubmitEvent,
  TableColumn,
  TableRow,
} from "@nuxt/ui";

import * as z from "zod";
import type { Reactive } from "vue";
definePageMeta({
  middleware: "admin",
  layout: "admin",
});
type UnclaimedInvite = {
  email: string | null;
  invite_sendout_time: string | null;
  referrer: string;
};

type TopReferrer = {
  referrer: string | null;
  referrals: number;
};
type DefaultReferrer = {
  id: string;
  username: string;
  email: string;
  date: Date;
  referrer: string;
};

const unclaimedInvitesColumns: TableColumn<UnclaimedInvite>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "invite_sendout_time",
    header: "Invite Date Sent",
    cell: ({ row }) => {
      // const date = new Date(row.getValue<string>("invite_sendout_time"));
      // return `${date.toLocaleDateString()}`;
      const date = row.getValue<string>("invite_sendout_time");
    },
  },
  {
    accessorKey: "referrer",
    header: "Referrer",
  },
];
const unclaimedInvites = await useFetch("/api/referrals/invites");
const router = useRouter();
function onSelect(row: TableRow<TopReferrer>, e: Event) {
  router.push(`/admin/${row.getValue("id")}`);
}

const popOverOpen = ref(false);
const referrerKey: Ref<"Default" | "Top Referrers"> = ref("Default");
let previousSubmission: FilterState | undefined = undefined;
const referrers = await useFetch("/api/referrals/referees");
if (!referrers.error.value) {
  previousSubmission = { referrer: "Default" };
}
const referrerOptions = ["Default", "Top Referrers"] as const;
const formSelects: {
  referrerOptions: typeof referrerOptions;
} = {
  referrerOptions: referrerOptions,
};
const schema = z.object({
  referrer: z.enum(formSelects.referrerOptions),
});

type FilterSchemaType = z.infer<typeof schema>;

type FilterState = {
  referrer: (typeof referrerOptions)[number];
};
const filterState: FilterState = reactive({
  referrer: "Default",
});

function resetFilters() {
  filterState.referrer = "Default";
  popOverOpen.value = false;
}

async function formSubmit(event: FormSubmitEvent<FilterSchemaType>) {
  if (JSON.stringify(previousSubmission) === JSON.stringify(filterState)) {
    console.log(`up to date ${event.data.referrer}`);
    return;
  }

  console.log(`getting new data for ${filterState.referrer}`);

  previousSubmission = Object.assign(previousSubmission!, filterState);
  const url =
    filterState.referrer === "Top Referrers"
      ? "/api/referrals/referrers/top-referrers"
      : "/api/referrals/referees";

  const response = await $fetch(url);

  referrers.data.value = response;

  popOverOpen.value = false;
}
</script>

<template>
  <div class="flex flex-col p-8 gap-8">
    <div
      class="w-full text-[#343C6A] font-bold text-3xl font-[Outfit] flex justify-between"
    >
      <span class="phone:hidden tablet:block"> Referrals </span>
    </div>

    <div class="flex flex-col space-y-4 bg-white rounded-xl p-4 shadow-med">
      <span class="text-[#001C55] font-[Outfit] text-xl leading-7"
        >List of Referrals</span
      >
      <div
        class="border border-gray-400 h-16 rounded-t-[10px] mb-0 flex items-center pl-8"
      >
        <UPopover v-model:open="popOverOpen">
          <UButton label="Filter" icon="i-heroicons-adjustments-horizontal" />
          <template #content>
            <UForm
              :state="filterState"
              class="w-65 pb-16 pl-4 pt-2"
              @submit.prevent="formSubmit"
            >
              <p class="flex mb-4">
                <UIcon
                  name="i-heroicons-adjustments-horizontal"
                  class="mr-2"
                />Select Filters
              </p>
              <UFormField label="Filter by referees" class="">
                <USelect
                  v-model="filterState.referrer"
                  :default-value="formSelects.referrerOptions[0]"
                  :items="formSelects.referrerOptions"
                  icon="i-heroicons-users"
                  class="mt-2"
                />
              </UFormField>
              <UFieldGroup class="flex justify-between mt-8 mr-8"
                ><UButton
                  label="Clear"
                  class="w-25 flex justify-center bg-white border border-gray-500 text-black hover:bg-white hover:cursor-pointer"
                  @click="resetFilters" /><UButton
                  class="w-25 hover:cursor-pointer"
                  label="Filter Results"
                  type="submit"
              /></UFieldGroup>
            </UForm>
          </template>
        </UPopover>
      </div>
      <UTable
        :data="referrers.data.value"
        @select="onSelect"
        class="border border-gray-400 overflow-hidden mt-0 mb-0 border-t-0 border-b-0"
      ></UTable>
      <div class="border border-gray-400 h-16 rounded-b-[10px]"></div>

      <h2 class="text-xl">Unclaimed Invites</h2>
      <UTable
        :data="unclaimedInvites.data.value"
        :columns="unclaimedInvitesColumns"
        class="border border-gray-400 rounded-md"
      ></UTable>
    </div>
  </div>
</template>
