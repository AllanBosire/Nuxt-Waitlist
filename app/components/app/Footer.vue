<script setup lang="ts">
const config = useAppConfig();
</script>

<template>
  <footer class="">
    <div class="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
      <div class="flex justify-center gap-6 md:order-2">
        <a v-for="item in config.socials" :href="item.link" class="text-gray-400 hover:text-gray-500">
          <span class="sr-only">twitter</span>
          <Icon :name="item.icon" />
        </a>
      </div>
      <div class="mt-8 md:order-1 md:mt-0">
        <p class="text-center text-xs leading-5 text-gray-500 inline-flex gap-2 items-center">
          <Icon name="tabler:copyright" /> Proyecto LTD 2024
        </p>
      </div>
    </div>
  </footer>
</template>
