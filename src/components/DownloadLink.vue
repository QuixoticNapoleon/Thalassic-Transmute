<script setup>
defineProps({
	url: { type: String, required: true },
	filename: { type: String, required: true },
})

const emit = defineEmits(['reset'])
</script>

<template>
	<div class="flex flex-col items-center gap-4">
		<div class="flex items-center gap-2 text-teal-400">
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
			</svg>
			<span class="font-medium">Conversion complete</span>
		</div>

		<a
			:href="url"
			:download="filename"
			class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold transition-colors"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
			</svg>
			Download {{ filename }}
		</a>

		<button
			type="button"
			class="text-teal-600 hover:text-teal-400 text-sm transition-colors"
			@click="emit('reset')"
		>
			Convert another file
		</button>
	</div>
</template>
