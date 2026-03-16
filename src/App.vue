<script setup>
import { useConverter } from './composables/useConverter.js'
import FileUploader from './components/FileUploader.vue'
import FormatSelector from './components/FormatSelector.vue'
import ProgressBar from './components/ProgressBar.vue'
import DownloadLink from './components/DownloadLink.vue'

const {
	file,
	outputFormat,
	progress,
	status,
	errorMessage,
	outputFilename,
	downloadURL,
	selectFile,
	reset,
	convert,
} = useConverter()

function formatFileSize(bytes) {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
</script>

<template>
	<div class="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-12">
		<div class="w-full max-w-xl flex flex-col gap-8">

			<!-- Header -->
			<div>
				<h1 class="text-3xl font-bold text-teal-400 tracking-tight">Convert</h1>
				<p class="text-gray-400 text-sm mt-1">Browser-based video &amp; audio converter. Your files never leave your device.</p>
			</div>

			<!-- Main card -->
			<div class="bg-gray-900 rounded-2xl p-6 flex flex-col gap-6 border border-gray-800">

				<!-- Done state -->
				<template v-if="status === 'done'">
					<DownloadLink
						:url="downloadURL"
						:filename="outputFilename"
						@reset="reset"
					/>
				</template>

				<!-- Working state -->
				<template v-else-if="status === 'loading' || status === 'converting'">
					<div class="text-sm text-gray-400 flex items-center gap-2">
						<span class="font-medium text-white">{{ file.name }}</span>
						<span class="text-gray-600">·</span>
						<span>{{ formatFileSize(file.size) }}</span>
						<span class="text-gray-600">→</span>
						<span class="text-teal-400 uppercase font-medium">{{ outputFormat }}</span>
					</div>
					<ProgressBar :progress="progress" :status="status" />
				</template>

				<!-- Idle / error state -->
				<template v-else>
					<!-- File uploader or selected file info -->
					<div v-if="!file">
						<FileUploader @file-selected="selectFile" />
					</div>

					<div v-else class="flex items-center justify-between gap-3 px-4 py-3 bg-gray-800 rounded-xl">
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

					<!-- Format selector — only when file is picked -->
					<FormatSelector v-if="file" v-model="outputFormat" />

					<!-- Error -->
					<div v-if="status === 'error'" class="flex items-start gap-2 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">
						<svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
						</svg>
						<span>{{ errorMessage }}</span>
					</div>

					<!-- Convert button -->
					<button
						v-if="file"
						type="button"
						class="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						:disabled="!file"
						@click="convert"
					>
						Convert to {{ outputFormat.toUpperCase() }}
					</button>
				</template>

			</div>

			<!-- Footer -->
			<p class="text-center text-xs text-gray-700">
				Runs entirely in your browser · No uploads · No servers
			</p>

		</div>
	</div>
</template>
