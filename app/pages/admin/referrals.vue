<script setup lang="ts">
import type { TableColumn, TableRow } from "@nuxt/ui";

const UDropdownMenu = resolveComponent("UDropdownMenu");
const UButton = resolveComponent("UButton");
import type { Row } from "@tanstack/vue-table";
import { useClipboard } from "@vueuse/core";
import DataTable from "~/components/Admin/DataTable.vue";
// import {UDropdownMenu, UButton } from "#components";

definePageMeta({
  middleware: "admin",
  layout: "admin",
});

const { copy } = useClipboard();

type UnclaimedInvite = {
  email: string | null;
  invite_sendout_time: string | null;
  referrer: string;
  id?: number;
};

type Referrer = {
  id: number;
  username: string;
  email: string;
  createdAt: string | null;
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
      const date = new Date(row.getValue<string>("invite_sendout_time"));
      return `${date.toLocaleString()}`;
    },
  },
  {
    accessorKey: "referrer",
    header: "Referrer",
  },
];

const waitlistUsersListColumn: TableColumn<Referrer>[] = [
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

async function onSelect(row: TableRow<Referrer>, e: Event | undefined) {
  navigateTo(`/admin/referrer/${row.original.id}`);
  return;
}
</script>

<template>
  <div class="flex flex-col p-8 gap-8">
    <div
      class="w-full text-[#343C6A] font-bold text-3xl font-[Outfit] flex justify-between"
    >
      <span class="phone:hidden tablet:block"> Referrals </span>
    </div>

    <div class="flex flex-col space-y-4 bg-white rounded-xl p-4">
      <span class="text-[#001C55] font-[Outfit] text-xl leading-7"
        >List of Referrals</span
      >
      <DataTable
        :columns="waitlistUsersListColumn"
        table-class="border border-gray-400 overflow-hidden mt-0 mb-0 border-t-1 border-b-0 rounded-t-lg hover:cursor-pointer"
        pagination-class="border border-gray-400 h-16 rounded-b-[10px] flex justify-end pt-4 pr-2"
        :items-per-page="10"
        url="/api/referrals/referees"
        :onSelect="onSelect"
      />
    </div>

    <h2 class="text-xl">Unclaimed Invites</h2>
    <div>
      <DataTable
        :columns="unclaimedInvitesColumns"
        table-class="border border-gray-400 overflow-hidden mt-0 mb-0 border-t-1 border-b-0 rounded-t-lg"
        pagination-class="border border-gray-400 h-16 rounded-b-[10px] flex justify-end pt-4 pr-2"
        :items-per-page="10"
        url="/api/referrals/invites"
      />
    </div>
  </div>
</template>
