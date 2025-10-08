<template>
	<div @mousedown="onMouseDown" @mouseup="onMouseUp">
		<Icon :name="icon" />
	</div>
</template>
<script setup lang="ts">
const icon = ref<"i-lucide-hand" | "i-lucide-hand-grab">("i-lucide-hand");

function onMouseDown() {
	icon.value = "i-lucide-hand-grab";
}

function onMouseUp() {
	icon.value = "i-lucide-hand";
}
</script>
