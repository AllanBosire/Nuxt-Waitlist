<script setup lang="ts">
const length = ref();
onMounted(() => {
  let path = document.querySelector('.path');
  length.value = path?.getTotalLength();
});

const items = [
  'https://picsum.photos/600/800?random=1',
  'https://picsum.photos/600/800?random=2',
  'https://picsum.photos/600/800?random=3',
  'https://picsum.photos/600/800?random=4',
  'https://picsum.photos/600/800?random=5',
  'https://picsum.photos/600/800?random=6',
  'https://picsum.photos/600/800?random=7',
  'https://picsum.photos/600/800?random=8',
  'https://picsum.photos/600/800?random=9',
  'https://picsum.photos/600/800?random=10',
];

</script>

<template>
  <div class="flex">
    <HomeHero class="" />
  </div>
</template>
