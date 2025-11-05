<script setup lang="ts">
import type {
  FormEvent,
  FormSubmitEvent,
  TableColumn,
  TableRow,
} from "@nuxt/ui";

import * as z from "zod";
import type { Reactive } from "vue";
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");
import type { Row } from "@tanstack/vue-table";
import { toast } from "#build/ui";
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

const unclaimedInvitesColumns: TableColumn<string>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "invite_sendout_time",
    header: "Invite Date Sent",
    cell: ({ row }) => {
      const date = new Date(row.getValue<string>("invite_sendout_time"));
      return `${date.toLocaleDateString()}`;
    },
  },
  {
    accessorKey: "referrer",
    header: "Referrer",
  },
];

const monthStrings = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const waitlistUsersListColumn: TableColumn<DefaultReferrer>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "username",
    header: "Username",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue<string>("createdAt"));
      // const options: Partial<Intl.DateTimeFormatOptions> = { month: "long" };

      // const month = date.toLocaleString("en-US", options);

      const month = monthStrings[date.getMonth()];
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const formattedDate = `${month} ${day
        .toString()
        .padStart(2, "0")}, ${hour}:${minute}`;

      return formattedDate;
    },
  },

  {
    accessorKey: "referrer",
    header: "Referrer",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return h(
        UDropdownMenu,
        { items: getRowItems(row), content: { align: "end" } },
        h(UButton, {
          icon: "i-lucide-ellipsis-vertical",
        })
      );
    },
  },
];

function getRowItems(row: Row<DefaultReferrer>) {
  return [
    {
      label: "Copy Referrer Username",
      onSelect() {
        console.log(row.original.referrer);
      },
    },
  ];
}

const router = useRouter();
async function onSelect(row: TableRow<TopReferrer>, e: Event) {
  if (filterState.referrer === "Top Referrers") {
    // const response = await $fetch("api/ma");
    console.log(row.original.referrer);
    const mmUser = await $fetch("/api/mattermost/Users/getByUsername", {
      method: "POST",
      body: JSON.stringify({
        username: row.original.referrer,
      }),
    });
    if (!mmUser) {
      return;
    }
    const email = mmUser.email;
    const user = await $fetch("/api/referrals/referrers/getByEmail", {
      method: "POST",
      body: JSON.stringify({
        email,
      }),
    });
    console.log(`/admin/${user.id}`);
    navigateTo(`/admin/${user.id}`);
    return;
  }
  navigateTo(`/admin/${row.getValue("id")}`);
}

const popOverOpen = ref(false);

type FilterSchemaType = z.infer<typeof schema>;

type FilterState = {
  referrer: (typeof referrerOptions)[number];
  page: number;
  pageQuantity: number;
};
const filterState = reactive<FilterState>({
  referrer: "Default",
  page: 1,
  pageQuantity: 1,
});

const url = ref<string>(
  filterState.referrer === "Top Referrers"
    ? "/api/referrals/referrers/top-referrers"
    : "/api/referrals/referees"
);

const waitlistUsers = await useFetch(
  url.value + `?page=${filterState.page}&items=${filterState.pageQuantity}`
);

const itemCount = await useFetch("/api/count");

// if (!referrers.error.value) {
//   previousSubmission = { referrer: "Default" };
// }
const referrerOptions = ["Default", "Top Referrers"] as const;
const formSelects: {
  referrerOptions: typeof referrerOptions;
} = {
  referrerOptions: referrerOptions,
};
const schema = z.object({
  referrer: z.enum(formSelects.referrerOptions),
});

function resetFilters() {
  filterState.referrer = "Default";
  popOverOpen.value = false;
}

async function formSubmit(event: FormSubmitEvent<FilterSchemaType>) {
  const url =
    filterState.referrer === "Top Referrers"
      ? "/api/referrals/referrers/top-referrers"
      : "/api/referrals/referees";
  const response = await $fetch(url);
  waitlistUsers.data.value = response;

  // if (JSON.stringify(previousSubmission) === JSON.stringify(filterState)) {
  //   console.log(`up to date ${event.data.referrer}`);
  //   return;
  // }

  // console.log(`getting new data for ${filterState.referrer}`);

  // previousSubmission = Object.assign(previousSubmission!, filterState);
  // const url =
  //   filterState.referrer === "Top Referrers"
  //     ? "/api/referrals/referrers/top-referrers"
  //     : "/api/referrals/referees";

  // const response = await $fetch(url);

  // referrers.data.value = response;

  popOverOpen.value = false;
}

async function refereesPageChange(newPageNumber: number) {
  const url =
    filterState.referrer === "Top Referrers"
      ? "/api/referrals/referrers/top-referrers"
      : "/api/referrals/referees";
  refereesPaginationDisabled.value = true;
  const response = await $fetch(
    url + `?page=${newPageNumber}&items=${filterState.pageQuantity}`
  );
  waitlistUsers.data.value = response;

  refereesPaginationDisabled.value = false;
  filterState.page = newPageNumber;
}

const refereesPaginationDisabled = ref(false);
const unclaimedInvitesTotal = await useFetch("/api/referrals/invites/count");
const unclaimedInvitesState = reactive({
  page: 1,
  pageQuantity: 1,
  disabled: false,
  total: unclaimedInvitesTotal.data.value?.count,
});
const unclaimedInvites = await useFetch(
  `/api/referrals/invites?page=${unclaimedInvitesState.page}&items=${unclaimedInvitesState.pageQuantity}`
);
console.log("//// " + unclaimedInvites.data.value);
async function unclaimedInvitePageChange(newPageNumber: number) {
  const url = "/api/referrals/invites";
  unclaimedInvitesState.disabled = true;
  const response = await $fetch(
    url + `?page=${newPageNumber}&items=${unclaimedInvitesState.pageQuantity}`
  );
  unclaimedInvites.data.value = response;
  unclaimedInvitesState.page = newPageNumber;

  unclaimedInvitesState.disabled = false;
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
        :columns="waitlistUsersListColumn"
        :data="waitlistUsers.data.value"
        @select="onSelect"
        class="border border-gray-400 overflow-hidden mt-0 mb-0 border-t-0 border-b-0 hover:cursor-pointer"
      ></UTable>
      <div
        class="border border-gray-400 h-16 rounded-b-[10px] flex justify-end pt-4 pr-2"
      >
        <UPagination
          :total="itemCount.data.value?.count"
          :sibling-count="1"
          :page="filterState.page"
          :items-per-page="filterState.pageQuantity"
          @update:page="refereesPageChange"
          :disabled="refereesPaginationDisabled"
        />
      </div>

      <h2 class="text-xl">Unclaimed Invites</h2>
      <div>
        <UTable
          :data="unclaimedInvites.data.value"
          :columns="unclaimedInvitesColumns"
          class="border border-gray-400 rounded-t-md hover:cursor-pointer"
        ></UTable>
        <div
          class="border border-gray-400 h-16 rounded-b-[10px] flex justify-end pt-4 pr-2 border-t-0"
        >
          <UPagination
            :total="unclaimedInvitesState.total"
            :sibling-count="1"
            :page="unclaimedInvitesState.page"
            :items-per-page="unclaimedInvitesState.pageQuantity"
            @update:page="unclaimedInvitePageChange"
            :disabled="unclaimedInvitesState.disabled"
          />
        </div>
      </div>
    </div>
  </div>
</template>
