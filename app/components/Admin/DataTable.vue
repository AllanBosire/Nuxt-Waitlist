<script setup lang="ts" generic="TData extends {id?: number}">
import type { TableColumn, TableRow } from "@nuxt/ui";

const props = defineProps<{
  columns: TableColumn<TData>[];
  siblingCount?: number;
  itemsPerPage: number;
  paginationClass?: string;
  tableClass?: string;
  url: string;
  onSelect?: (row: TableRow<TData>, e: Event | undefined) => void;
  referrer?: string;
}>();
const id = useRouteParam("referrer");

const method = computed(() => {
  if (id.value) return "POST";
  return "GET";
});
const countBody = computed(() => {
  if (id.value) return { referrer: id.value };
  return undefined;
});
const dataBody = computed(() => {
  if (props.referrer) return { referrer: props.referrer };
  return undefined;
});
const pageNumber = ref<number>(1);
const totalCount = await useFetch<{ count: number }>(`${props.url}/count`, {
  method,
  body: countBody,
});

const { data: localData, pending: paginationDisabled } = await useFetch<
  TData[]
>(`${props.url}`, {
  query: {
    page: pageNumber,
    items: props.itemsPerPage,
  },
  body: dataBody,
  method,
});
</script>
<template>
  <ClientOnly>
    <UTable
      :data="localData?.sort((a, b) => (a.id && b.id ? a.id - b.id : 0))"
      :columns="props.columns"
      :class="`${tableClass}`"
      :onSelect="onSelect"
    />
  </ClientOnly>
  <div :class="`${paginationClass}`">
    <UPagination
      :total="totalCount.data.value?.count || 0"
      :sibling-count="siblingCount ? siblingCount : 1"
      :page="pageNumber"
      :items-per-page="itemsPerPage"
      @update:page="pageNumber = $event"
      :disabled="paginationDisabled"
    />
  </div>
</template>
