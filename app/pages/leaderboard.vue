<script setup>
const { data: users } = await useFetch("/api/anon-list");
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <UCard>
      <template #header>
        <h1 class="font-bold text-3xl">Waitlist Leaderboard</h1>
      </template>

      <ol class="list-decimal ml-4">
        <li v-for="i in users">
          {{ i }}
        </li>
      </ol>
    </UCard>
  </div>
</template>
