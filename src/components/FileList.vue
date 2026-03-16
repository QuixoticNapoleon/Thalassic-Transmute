<script setup>
defineProps({
	queue: { type: Array, required: true },
	canRemove: { type: Boolean, default: true },
})

const emit = defineEmits(['remove'])

function formatFileSize(bytes) {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
	<div class="flex flex-col gap-2">
		<div
			v-for="item in queue"
			:key="item.id"
			class="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gray-800"
		>
			<!-- Status indicator -->
			<div class="shrink-0">
				<!-- Pending -->
				<div v-if="item.status === 'pending'" class="w-2 h-2 rounded-full bg-gray-600" />
				<!-- Converting -->
				<svg v-else-if="item.status === 'converting'" class="w-4 h-4 text-teal-400 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
				</svg>
				<!-- Done -->
				<svg v-else-if="item.status === 'done'" class="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
				</svg>
				<!-- Error -->
				<svg v-else-if="item.status === 'error'" class="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</div>

			<!-- File info -->
			<div class="min-w-0 flex-1">
				<p class="text-sm text-white truncate">{{ item.file.name }}</p>
				<div class="flex items-center gap-2">
					<span class="text-xs text-gray-500">{{ formatFileSize(item.file.size) }}</span>
					<span v-if="item.status === 'converting'" class="text-xs text-teal-500 tabular-nums">{{ item.progress }}%</span>
					<span v-if="item.status === 'error'" class="text-xs text-red-400">{{ item.error }}</span>
				</div>

				<!-- Progress bar for converting items -->
				<div v-if="item.status === 'converting'" class="mt-1.5 w-full h-1 rounded-full bg-gray-700">
					<div
						class="h-1 rounded-full bg-teal-500 transition-all duration-200"
						:style="{ width: `${Math.min(100, Math.max(0, item.progress))}%` }"
					/>
				</div>
			</div>

			<!-- Download link (when done) -->
			<a
				v-if="item.status === 'done' && item.downloadURL"
				:href="item.downloadURL"
				:download="item.outputFilename"
				class="shrink-0 text-teal-400 hover:text-teal-300 transition-colors"
				@click.stop
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
				</svg>
			</a>

			<!-- Remove button (only when pending and allowed) -->
			<button
				v-if="item.status === 'pending' && canRemove"
				type="button"
				class="shrink-0 text-gray-600 hover:text-gray-300 transition-colors"
				@click.stop="emit('remove', item.id)"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	</div>
</template>
