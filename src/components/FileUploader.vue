<script setup>
import { ref } from 'vue'

const emit = defineEmits(['file-selected'])

const isDragging = ref(false)
const fileInput = ref(null)

const ACCEPTED = [
	'video/mp4', 'video/webm', 'video/x-msvideo', 'video/quicktime',
	'video/x-matroska', 'video/avi', 'video/mov', 'video/mkv',
	'audio/mpeg', 'audio/wav', 'audio/aac',
]

function onDrop(e) {
	isDragging.value = false
	const f = e.dataTransfer?.files?.[0]
	if (f) emit('file-selected', f)
}

function onFileInput(e) {
	const f = e.target.files?.[0]
	if (f) emit('file-selected', f)
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
			:accept="ACCEPTED.join(',')"
			@change="onFileInput"
		/>

		<svg class="w-10 h-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
		</svg>

		<p class="text-teal-100 font-medium text-base">
			Drop a file or <span class="text-teal-400 underline underline-offset-2">browse</span>
		</p>
		<p class="text-teal-500 text-sm">MP4, WebM, AVI, MOV, MKV, MP3, WAV, AAC</p>
	</div>
</template>
