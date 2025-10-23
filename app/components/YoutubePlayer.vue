<script setup lang="ts">
import { parseURL } from "ufo";
const props = defineProps<{
    video: string;
}>();
function getYTVideoId(link: string) {
    if (!link) {
        return undefined;
    }

    const lower = link.toLowerCase();
    if (!lower.startsWith("http") && !lower.startsWith("you")) {
        return link;
    }

    const url = parseURL(link, "https://");
    if (url.host === "youtu.be") {
        return url.pathname.replace("/", "");
    }
    const params = new URLSearchParams(url.search);
    return params.get("v") as string;
}

const video_id = computed(() => getYTVideoId(props.video));
</script>

<template>
    <div v-if="video_id">
        <iframe
            :src="`https://www.youtube.com/embed/${video_id}`"
            frameborder="0"
            allowfullscreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            class="w-full aspect-video rounded-xl"
        ></iframe>
    </div>
    <div v-else>No Video Id or Link from {{ video }}</div>
</template>
<style scoped>
.video-container {
    position: relative;
    width: 100%;
    max-width: 800px;
    margin: auto;
}
iframe {
    width: 100%;
    height: 100%;
}
</style>
