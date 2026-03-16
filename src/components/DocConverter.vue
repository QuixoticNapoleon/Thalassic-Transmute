<script setup>
import { useDocConverter } from '../composables/useDocConverter.js'
import DocFormatSelector from './DocFormatSelector.vue'

const {
	file,
	inputFormat,
	outputFormat,
	status,
	errorMessage,
	outputFilename,
	downloadURL,
	inputFormats,
	outputFormats,
	selectFile,
	reset,
	convert,
	DOC_FORMATS,
} = useDocConverter()

import { ref } from 'vue'
const dragging = ref(false)
const fileInput = ref(null)

function onDrop(e) {
	dragging.value = false
	const f = e.dataTransfer?.files?.[0]
	if (f) selectFile(f)
}

function onFileInput(e) {
	const f = e.target.files?.[0]
	if (f) selectFile(f)
	e.target.value = ''
}

function openPicker() {
	fileInput.value?.click()
}

function formatFileSize(bytes) {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
	<div class="flex flex-col gap-6">

		<!-- Done state -->
		<template v-if="status === 'done'">
			<div class="flex flex-col items-center gap-4">
				<div class="flex items-center gap-2 text-teal-400">
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
					</svg>
					<span class="font-medium">Conversion complete</span>
				</div>

				<a
					:href="downloadURL"
					:download="outputFilename"
					class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-semibold transition-colors"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
					Download {{ outputFilename }}
				</a>

				<button
					type="button"
					class="text-teal-600 hover:text-teal-400 text-sm transition-colors"
					@click="reset"
				>
					Convert another document
				</button>
			</div>
		</template>

		<!-- Loading / Converting state -->
		<template v-else-if="status === 'loading' || status === 'converting'">
			<div class="flex flex-col items-center gap-4 py-6">
				<svg class="w-8 h-8 text-teal-400 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
				</svg>
				<p class="text-teal-400 text-sm font-medium">
					<span v-if="status === 'loading'">Loading Pandoc (~35 MB, first time only)...</span>
					<span v-else>Converting...</span>
				</p>
			</div>
		</template>

		<!-- Idle / error state -->
		<template v-else>
			<!-- File drop zone -->
			<div v-if="!file"
				class="relative flex flex-col items-center justify-center gap-3 w-full rounded-2xl border-2 border-dashed border-teal-600 bg-teal-950/30 px-8 py-14 cursor-pointer transition-colors hover:bg-teal-900/40"
				:class="{ 'bg-teal-900/50 border-teal-400': dragging }"
				@dragover.prevent="dragging = true"
				@dragleave.prevent="dragging = false"
				@drop.prevent="onDrop"
				@click="openPicker"
			>
				<input
					ref="fileInput"
					type="file"
					class="hidden"
					accept=".md,.markdown,.html,.htm,.txt,.text,.tex,.latex,.rst,.docx,.odt"
					@change="onFileInput"
				/>

				<svg class="w-10 h-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
				</svg>

				<p class="text-teal-100 font-medium text-base">
					Drop a document or <span class="text-teal-400 underline underline-offset-2">browse</span>
				</p>
				<p class="text-teal-500 text-sm">MD, HTML, TXT, LaTeX, RST, DOCX, ODT</p>
			</div>

			<!-- File selected -->
			<template v-else>
				<div class="flex items-center justify-between gap-3 px-4 py-3 bg-gray-800 rounded-xl">
					<div class="flex items-center gap-3 min-w-0">
						<svg class="w-5 h-5 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
						</svg>
						<div class="min-w-0">
							<p class="text-sm font-medium text-white truncate">{{ file.name }}</p>
							<p class="text-xs text-gray-500">{{ formatFileSize(file.size) }}</p>
						</div>
					</div>
					<button
						type="button"
						class="text-gray-600 hover:text-gray-300 transition-colors shrink-0"
						@click="reset"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Input format (auto-detected, can override) -->
				<DocFormatSelector
					v-model="inputFormat"
					label="Input format"
					:formats="inputFormats"
				/>

				<!-- Output format -->
				<DocFormatSelector
					v-model="outputFormat"
					label="Output format"
					:formats="outputFormats"
				/>

				<!-- Unrecognised format warning -->
				<div v-if="!inputFormat" class="flex items-start gap-2 text-sm text-yellow-500 bg-yellow-950/30 border border-yellow-800/50 rounded-xl px-4 py-3">
					<svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
					<span>Could not detect the input format. Please select it manually above.</span>
				</div>

				<!-- Error -->
				<div v-if="status === 'error'" class="flex items-start gap-2 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">
					<svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
					<span>{{ errorMessage }}</span>
				</div>

				<!-- PDF note -->
				<p v-if="outputFormat === 'pdf'" class="text-xs text-gray-500">
					PDF output will open your browser's print dialog. Save as PDF from there.
				</p>

				<!-- Convert button -->
				<button
					type="button"
					class="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					:disabled="!inputFormat"
					@click="convert"
				>
					Convert to {{ DOC_FORMATS[outputFormat]?.label ?? outputFormat }}
				</button>
			</template>
		</template>
	</div>
</template>
