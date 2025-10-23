<template>
    <div class="py-12 px-4 relative">
        <div
            class="relative max-w-6xl mx-auto container"
            @click="isOpen = true"
        >
            <div class="relative">
                <button class="play">
                    <UIcon name="i-mdi-play" class="play__button" />
                </button>
            </div>
            <UModal
                :open="isOpen"
                @update:open="isOpen = $event"
                :ui="{
                    content: 'sm:max-w-3xl',
                    container: 'items-center',
                    overlay: ' backdrop-blur-sm',
                }"
                title="How to join the community"
            >
                <template #content>
                    <YoutubePlayer
                        :video="$config.public.media.tutorial.landingVideo"
                    />
                </template>
            </UModal>
        </div>
    </div>
</template>

<script setup>
const isOpen = ref(false);
</script>
<style scoped>
@keyframes bubble {
    to {
        box-shadow: 0 0 0 20px #1741955c;
    }
}

.container {
    background:
        linear-gradient(to top, #00000063, #0006), url("/resources.png");
    background-size: cover;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 56px;
    background-position: bottom;
}

.play {
    animation: bubble 1s infinite alternate;
    height: 45px;
    width: 45px;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.486);
    border: none;
    outline: none;
    cursor: pointer;
    margin-top: 0.4rem;

    .play__button {
        font-size: 30px;
        color: #fff;
        cursor: pointer;
        margin-left: 0.66rem;
    }
}
</style>
