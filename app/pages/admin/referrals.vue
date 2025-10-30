<script setup lang="ts">
definePageMeta({
  middleware: 'admin',
  layout: 'admin',
});
</script>

<template>
  <div class="flex flex-col p-8 gap-8">
    <div
      class="w-full text-[#343C6A] font-bold text-3xl font-[Outfit] flex justify-between"
    >
      <span class="phone:hidden tablet:block"> Referrals </span>
    </div>

    <div class="flex flex-col space-y-4 bg-white rounded-md p-4">
      <span class="text-[#001C55] font-[Outfit] text-xl leading-7"
        >List of Referrals</span
      >

      <div class="">table</div>
    </div>
  </div>
</template>
