<template>
    <div class="py-12 relative">
        <div
            class="bg-[url('/How-To.png')] h-[80px] flex items-center justify-center bg-no-repeat bg-center bg-cover rounded-4xl"
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
        box-shadow: 0 0 0 20px #ff000032;
    }
}

.container {
    background: linear-gradient(to top, #00000063, #0006), url("/How-To.jpg");
    background-size: cover;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 56px;
    background-position: 0 5%;
}

.play {
    animation: bubble 1s infinite alternate;
    height: 45px;
    width: 45px;
    border-radius: 50%;
    background: #DC2626;
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
