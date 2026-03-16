<script setup>
import { ref } from 'vue'
import { useDocConverter } from '../composables/useDocConverter.js'
import DocFormatSelector from './DocFormatSelector.vue'
import FileList from './FileList.vue'

const {
	queue,
	outputFormat,
	status,
	errorMessage,
	currentIndex,
	fileCount,
	doneCount,
	errorCount,
	skippedCount,
	convertibleCount,
	unrecognisedCount,
	outputFormats,
	addFiles,
	removeFile,
	reset,
	convert,
	downloadAll,
	DOC_FORMATS,
} = useDocConverter()

const dragging = ref(false)
const fileInput = ref(null)

function onDrop(e) {
	dragging.value = false
	const files = Array.from(e.dataTransfer?.files ?? [])
	if (files.length) addFiles(files)
}

function onFileInput(e) {
	const files = Array.from(e.target.files ?? [])
	if (files.length) addFiles(files)
	e.target.value = ''
}

function openPicker() {
	fileInput.value?.click()
}
</script>

<template>
	<div class="flex flex-col gap-6">

		<!-- Done state -->
		<template v-if="status === 'done'">
			<div class="flex flex-col gap-4">
				<div class="flex items-center gap-2 text-teal-400">
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
					</svg>
					<span class="font-medium">
						{{ doneCount }} converted
						<span v-if="errorCount > 0" class="text-red-400">({{ errorCount }} failed)</span>
						<span v-if="skippedCount > 0" class="text-yellow-500">({{ skippedCount }} skipped)</span>
					</span>
				</div>

				<FileList :queue="queue" :can-remove="false" />

				<button
					v-if="doneCount >= 2"
					type="button"
					class="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors inline-flex items-center justify-center gap-2"
					@click="downloadAll"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
					</svg>
					Download all
				</button>

				<button
					type="button"
					class="text-teal-600 hover:text-teal-400 text-sm transition-colors"
					@click="reset"
				>
					Convert more documents
				</button>
			</div>
		</template>

		<!-- Loading / Converting state -->
		<template v-else-if="status === 'loading' || status === 'converting'">
			<div class="flex flex-col gap-4">
				<div class="flex items-center gap-3">
					<svg class="w-5 h-5 text-teal-400 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
					<span class="text-sm text-gray-400">
						<span v-if="status === 'loading'">Loading Pandoc (~51 MB, first time only)...</span>
						<span v-else>Converting {{ currentIndex + 1 }} of {{ convertibleCount }}...</span>
					</span>
				</div>

				<FileList :queue="queue" :can-remove="false" />
			</div>
		</template>

		<!-- Idle / error state -->
		<template v-else>
			<!-- File drop zone -->
			<div
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
					multiple
					accept=".md,.markdown,.html,.htm,.txt,.text,.tex,.latex,.rst,.docx,.odt"
					@change="onFileInput"
				/>

				<svg class="w-10 h-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
				</svg>

				<p class="text-teal-100 font-medium text-base">
					Drop documents or <span class="text-teal-400 underline underline-offset-2">browse</span>
				</p>
				<p class="text-teal-500 text-sm">MD, HTML, TXT, LaTeX, RST, DOCX, ODT — one or many</p>
			</div>

			<template v-if="fileCount > 0">
				<div class="flex items-center justify-between">
					<span class="text-sm text-gray-400">{{ fileCount }} file{{ fileCount === 1 ? '' : 's' }}</span>
					<button
						type="button"
						class="text-xs text-gray-600 hover:text-gray-300 transition-colors"
						@click="reset"
					>
						Clear all
					</button>
				</div>

				<FileList :queue="queue" :can-remove="true" @remove="removeFile" />

				<DocFormatSelector
					v-model="outputFormat"
					label="Output format"
					:formats="outputFormats"
				/>

				<!-- Unrecognised files warning -->
				<div v-if="unrecognisedCount > 0" class="flex items-start gap-2 text-sm text-yellow-500 bg-yellow-950/30 border border-yellow-800/50 rounded-xl px-4 py-3">
					<svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
					<span>{{ unrecognisedCount }} file{{ unrecognisedCount === 1 ? '' : 's' }} could not be detected and will be skipped.</span>
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

				<button
					type="button"
					class="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					:disabled="convertibleCount === 0"
					@click="convert"
				>
					<template v-if="convertibleCount === 0">
						No files can be converted
					</template>
					<template v-else>
						Convert {{ convertibleCount === 1 ? '' : 'all ' }}{{ convertibleCount }} file{{ convertibleCount === 1 ? '' : 's' }} to {{ DOC_FORMATS[outputFormat]?.label ?? outputFormat }}
					</template>
				</button>
			</template>
		</template>
	</div>
</template>
