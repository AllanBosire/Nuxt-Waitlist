<template>
  <div class="py-12 px-4 relative">
    <div class="relative max-w-6xl mx-auto">
      <div class="relative">
        <Icon name="i-logos-youtube-icon"
          class="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-12 h-12 drop-shadow" />
        <NuxtImg src="https://i.ytimg.com/vi/oDSM0pCgacU/maxresdefault.jpg" alt="Minted Directory Video Intro"
          class="max-w-3xl mx-auto mt-8 rounded-xl overflow-hidden cursor-pointer metal-shadow" sizes="sm:50vw md:400px"
          @click="isOpen = true" />
      </div>
      <UModal v-model="isOpen" :ui="{ width: 'sm:max-w-3xl', container: 'items-center' }">
        <iframe class="rounded-lg overflow-hidden mx-auto w-full aspect-video max-w-3xl"
          src="https://www.youtube.com/embed/oDSM0pCgacU?si=E_wVDRPkgISK6Qud&autoplay=1" title="YouTube video player"
          frameborder="0" loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
      </UModal>
    </div>
  </div>
</template>

<script setup>
const isOpen = ref(false);
</script>