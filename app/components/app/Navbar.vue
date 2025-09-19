<script setup lang="ts">
const mobileMenu = ref();
const config = useAppConfig();

const route = useRoute();
const home = computed(() => route.fullPath === "/");
</script>

<template>
  <header class="sticky top-0 z-50">
    <UContainer class="mx-auto flex h-16 items-center justify-between px-4 transition-all">
      <div class="flex items-center gap-5">
        <NuxtLink to="/" class="flex items-center gap-2">
          <!-- <Logo class="h-8 w-auto" role="img" alt="Lemonrepo logo" /> -->
          <p class="font-bold text-xl tracking-tight">Proyecto</p>
        </NuxtLink>
      </div>
      <UButton v-if="config.waitlist.showSignups && home" to="/leaderboard" color="neutral">See Signups</UButton>
      <UButton v-else-if="!home" to="/" color="primary">Sign Up</UButton>
    </UContainer>
    <div class="block h-[calc(100vh-4rem)] w-full sm:hidden" v-show="mobileMenu">
      <div class="flex flex-col gap-4 p-4">
        <UButton to="/leaderboard" @click="toggleMobileMenu" color="gray">See Signups</UButton>
      </div>
    </div>
  </header>
</template>

<style scoped>
.menu-toggle.active .menu-bar[data-position="top"] {
  transform: translateY(0) rotate(45deg) scaleX(1.05);
}

.menu-toggle.active .menu-bar[data-position="bottom"] {
  transform: translateY(0) rotate(-45deg) scaleX(1.05);
}
</style>
