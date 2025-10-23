<script setup lang="ts">
defineProps<{
    video: string;
}>();
</script>

<template>
    <video
        class="w-full aspect-video rounded-xl"
        controls
        playsinline
        autoplay
        preload="metadata"
        v-if="video"
    >
        <source :src="video" type="video/mp4" />
        Your browser does not support the video tag.
    </video>
    <div v-else>No Video Id or Link from {{ video }}</div>
</template>
<style scoped>
.video-container {
    position: relative;
    width: 100%;
    max-width: 800px;
    margin: auto;
}
video {
    width: 100%;
    height: 100%;
}
</style>
