<script setup>
import { ref } from 'vue'

const emit = defineEmits(['files-selected'])

const isDragging = ref(false)
const fileInput = ref(null)

function onDrop(e) {
	isDragging.value = false
	const files = Array.from(e.dataTransfer?.files ?? [])
	if (files.length) emit('files-selected', files)
}

function onFileInput(e) {
	const files = Array.from(e.target.files ?? [])
	if (files.length) emit('files-selected', files)
	e.target.value = ''
}

function openPicker() {
	fileInput.value?.click()
}
</script>

<template>
	<div
		class="relative flex flex-col items-center justify-center gap-3 w-full rounded-2xl border-2 border-dashed border-teal-600 bg-teal-950/30 px-8 py-14 cursor-pointer transition-colors hover:bg-teal-900/40"
		:class="{ 'bg-teal-900/50 border-teal-400': isDragging }"
		@dragover.prevent="isDragging = true"
		@dragleave.prevent="isDragging = false"
		@drop.prevent="onDrop"
		@click="openPicker"
	>
		<input
			ref="fileInput"
			type="file"
			class="hidden"
			multiple
			accept="video/*,audio/*,image/*"
			@change="onFileInput"
		/>

		<svg class="w-10 h-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
		</svg>

		<p class="text-teal-100 font-medium text-base">
			Drop files or <span class="text-teal-400 underline underline-offset-2">browse</span>
		</p>
		<p class="text-teal-500 text-sm">Video, audio, or images — one or many</p>
	</div>
</template>
