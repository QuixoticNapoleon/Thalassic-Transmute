<script setup>
import { computed } from 'vue'

const props = defineProps({
	label: { type: String, required: true },
	formats: { type: Array, required: true },
})

const model = defineModel({ required: true })

// Split formats into text and binary groups
const textFormats = computed(() => props.formats.filter(f => !['docx', 'odt', 'epub', 'pdf'].includes(f.id)))
const binaryFormats = computed(() => props.formats.filter(f => ['docx', 'odt', 'epub', 'pdf'].includes(f.id)))
</script>

<template>
	<div class="flex flex-col gap-2">
		<label class="text-teal-400 text-sm font-medium uppercase tracking-wider">{{ label }}</label>

		<div v-if="textFormats.length > 0" class="flex flex-col gap-1.5">
			<span class="text-teal-600 text-xs uppercase tracking-wide">Text</span>
			<div class="flex flex-wrap gap-2">
				<button
					v-for="fmt in textFormats"
					:key="fmt.id"
					type="button"
					class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border"
					:class="model === fmt.id
						? 'bg-teal-500 border-teal-500 text-white'
						: 'bg-transparent border-teal-700 text-teal-300 hover:border-teal-500 hover:text-teal-100'"
					@click="model = fmt.id"
				>
					{{ fmt.label }}
				</button>
			</div>
		</div>

		<div v-if="binaryFormats.length > 0" class="flex flex-col gap-1.5">
			<span class="text-teal-600 text-xs uppercase tracking-wide">Binary</span>
			<div class="flex flex-wrap gap-2">
				<button
					v-for="fmt in binaryFormats"
					:key="fmt.id"
					type="button"
					class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border"
					:class="model === fmt.id
						? 'bg-teal-500 border-teal-500 text-white'
						: 'bg-transparent border-teal-700 text-teal-300 hover:border-teal-500 hover:text-teal-100'"
					@click="model = fmt.id"
				>
					{{ fmt.label }}
				</button>
			</div>
		</div>
	</div>
</template>
