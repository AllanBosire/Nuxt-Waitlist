<template>
  <div
    class="pl-8 bg-white font-outfit rounded-xl border border-gray-300 mx-[3%]"
  >
    <h3 class="font-bold text-xl border-b-gray-200 border-b pb-2 pt-6">
      User Details
    </h3>
    <div class="flex rounded-md py-4">
      <div class="grow-1">
        <div class="flex">
          <span class="w-[30%]">Username:</span>
          <span class="w-[70%]">{{ referrerUsername }}</span>
        </div>
        <div class="flex">
          <span class="w-[30%]">Email:</span>
          <span class="w-[70%]">{{ referrer?.email }}</span>
        </div>
      </div>
      <div class="grow-1">
        <div class="flex">
          <span class="w-[30%]">Referrer:</span>
          <span class="w-[70%]">{{ referredBy }}</span>
        </div>
        <div class="flex">
          <span class="w-[30%]">Date Created:</span>
          <ClientOnly>
            <span class="w-[70%]">{{
              new Date(referrer?.createdAt || "").toLocaleString()
            }}</span></ClientOnly
          >
        </div>
      </div>
    </div>
  </div>
  <div
    class="pl-8 border border-gray-300 mt-8 mx-[3%] bg-white rounded-xl mb-8"
  >
    <h2 class="text-2xl pt-4 mb-3">List of Referrals</h2>
    <div class="mr-4 mb-8">
      <ClientOnly>
        <DataTable
          table-class="border border-gray-400 overflow-hidden mt-0 mb-0 border-t-1 border-b-0 rounded-t-lg hover:cursor-pointer"
          pagination-class="border border-gray-400 h-16 rounded-b-[10px] flex justify-end pt-4 pr-2"
          :columns="refereesListColumn"
          :onSelect="onSelect"
          url="/api/referrals/referrers/referees-list"
          :items-per-page="10"
          :referrer="`${referrerMMObj.data.value?.id}`"
        />
      </ClientOnly>
    </div>
  </div>
</template>
<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui";
import type { Row } from "@tanstack/vue-table";
import { useClipboard } from "@vueuse/core";
import DataTable from "~/components/Admin/DataTable.vue";

definePageMeta({
  middleware: "admin",
  layout: "admin",
});
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");

const { copy } = useClipboard();

const param = useRouteParam("referrer");
const { data: referrer } = await useFetch(
  `/api/referrals/referees/referrer/${param.value}`
);

const referrerMMObj = await useFetch("/api/mattermost/Users/getByEmail", {
  method: "POST",
  body: JSON.stringify({ email: referrer.value?.email }),
});

const { data: referrerParentMM } = await useFetch(
  "/api/mattermost/Users/getById",
  {
    method: "POST",
    body: JSON.stringify({ id: referrer.value?.referrer }),
  }
);
const referredBy = referrerParentMM.value?.at(0)?.username;

const referrerUsername = referrerMMObj.data.value?.username || "";

type Referrer = {
  id: number;
  username: string;
  email: string;
  createdAt: string | null;
  referrer: string;
};
async function onSelect(row: TableRow<Referrer>, e: Event | undefined) {
  navigateTo(`/admin/referrer/${row.original.id}`);
  return;
}
function getRowItems(row: Row<Referrer>) {
  return [
    {
      label: "Copy Email",
      onSelect() {
        copy(row.original.email);
      },
    },
  ];
}
const refereesListColumn: TableColumn<Referrer>[] = [
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
      return date.toLocaleString();
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
        {
          default: () =>
            h(UButton, {
              icon: "i-lucide-ellipsis-vertical",
              class: "hover:bg-white bg-white text-gray-500",
            }),
        }
      );
    },
  },
];
</script>
