<script setup>
import { computed } from 'vue'

const props = defineProps({
	availableFormats: { type: Object, required: true },
})

const model = defineModel({ required: true })

const groups = computed(() => {
	const result = []
	for (const [group, formats] of Object.entries(props.availableFormats)) {
		if (formats.length > 0) {
			result.push({ name: group, formats })
		}
	}
	return result
})
</script>

<template>
	<div class="flex flex-col gap-3">
		<label class="text-teal-400 text-sm font-medium uppercase tracking-wider">Output format</label>

		<div v-for="group in groups" :key="group.name" class="flex flex-col gap-2">
			<span class="text-teal-600 text-xs uppercase tracking-wide">{{ group.name }}</span>
			<div class="flex flex-wrap gap-2">
				<button
					v-for="fmt in group.formats"
					:key="fmt"
					type="button"
					class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border"
					:class="model === fmt
						? 'bg-teal-500 border-teal-500 text-white'
						: 'bg-transparent border-teal-700 text-teal-300 hover:border-teal-500 hover:text-teal-100'"
					@click="model = fmt"
				>
					{{ fmt.toUpperCase() }}
				</button>
			</div>
		</div>
	</div>
</template>
