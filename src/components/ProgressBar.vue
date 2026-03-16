<script setup>
import { computed } from 'vue'

const props = defineProps({
	progress: { type: Number, default: 0 },
	status: { type: String, default: 'idle' },
})

const clamped = computed(() => Math.min(100, Math.max(0, props.progress)))
</script>

<template>
	<div class="flex flex-col gap-2">
		<div class="flex justify-between text-sm">
			<span class="text-teal-400">
				<span v-if="status === 'loading'">Loading FFmpeg...</span>
				<span v-else-if="status === 'converting'">Converting...</span>
				<span v-else-if="status === 'done'">Done</span>
			</span>
			<span class="text-teal-300 font-medium tabular-nums">{{ clamped }}%</span>
		</div>

		<div class="w-full h-2 rounded-full bg-teal-950">
			<div
				class="h-2 rounded-full bg-teal-500 transition-all duration-200"
				:style="{ width: `${clamped}%` }"
			/>
		</div>
	</div>
</template>
