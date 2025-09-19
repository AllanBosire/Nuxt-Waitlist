<script setup>
const features = [
  { title: "Feature 1", description: "Consequat voluptate ullamco esse cillum nisi voluptate enim labore pariatur.", icon: "tabler:alien" },
  { title: "Feature 2", description: "Officia deserunt elit cillum proident cillum exercitation eiusmod in.", icon: "tabler:alien" },
  { title: "Feature 3", description: "Aliquip aute officia nostrud quis laborum exercitation mollit voluptate.", icon: "tabler:alien" },
  { title: "Feature 4", description: "Eiusmod veniam sint mollit nostrud adipisicing cupidatat est tempor qui.", icon: "tabler:alien" }
];
</script>

<template>
  <div class="bg-zinc-100 py-20">
    <div class="grid grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
      <div v-for="feature in features" class="space-y-2">
        <div class="bg-blue-200 text-blue-600 rounded-full p-2 flex items-center justify-center w-10 mx-auto">
          <Icon :name="feature.icon" class="h-6 w-6" />
        </div>
        <p class="font-bold text-xl">{{ feature.title }}</p>
        <p>{{ feature.description }}</p>
      </div>
    </div>
  </div>
</template>
