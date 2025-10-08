<script setup lang="ts">
import { VueDraggableNext } from "vue-draggable-next";
interface DraggableOptionsProps {
	modelValue: string[];
}

const props = defineProps<DraggableOptionsProps>();
const emit = defineEmits<{
	"update:modelValue": [value: string[]];
	remove: [index: number];
}>();

const localOptions = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});

function removeOption(index: number) {
	emit("remove", index);
}
</script>

<template>
	<VueDraggableNext v-model="localOptions" item-key="id" class="space-y-2">
		<div class="flex items-center gap-2 group" v-for="(_, index) in localOptions">
			<UDragHandle class="cursor-move opacity-0 group-hover:opacity-100 transition-opacity" />
			<UInput v-model="localOptions[index]" placeholder="Option text" class="flex-1" />
			<UButton
				icon="i-heroicons-trash"
				color="error"
				variant="ghost"
				size="sm"
				@click="removeOption(index)"
			/>
		</div>
	</VueDraggableNext>
</template>
