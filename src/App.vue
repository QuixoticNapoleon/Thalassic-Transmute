<script setup>
import { ref } from 'vue'
import { useConverter } from './composables/useConverter.js'
import { useBulkConverter } from './composables/useBulkConverter.js'
import FileUploader from './components/FileUploader.vue'
import BulkUploader from './components/BulkUploader.vue'
import FormatSelector from './components/FormatSelector.vue'
import ProgressBar from './components/ProgressBar.vue'
import DownloadLink from './components/DownloadLink.vue'
import FileList from './components/FileList.vue'

const mode = ref('single') // single | bulk

// Single file converter
const single = useConverter()

// Bulk converter
const bulk = useBulkConverter()

function switchMode(m) {
	if (mode.value === m) return
	single.reset()
	bulk.reset()
	mode.value = m
}

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
				<h1 class="text-3xl font-bold text-teal-400 tracking-tight">Atlassic Convert</h1>
				<p class="text-gray-400 text-sm mt-1">Browser-based video &amp; audio converter. Your files never leave your device.</p>
			</div>

			<!-- Mode toggle -->
			<div class="flex gap-1 p-1 bg-gray-900 rounded-xl w-fit border border-gray-800">
				<button
					type="button"
					class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
					:class="mode === 'single' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'"
					@click="switchMode('single')"
				>
					Single file
				</button>
				<button
					type="button"
					class="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
					:class="mode === 'bulk' ? 'bg-teal-600 text-white' : 'text-gray-400 hover:text-white'"
					@click="switchMode('bulk')"
				>
					Bulk convert
				</button>
			</div>

			<!-- ==================== SINGLE MODE ==================== -->
			<div v-if="mode === 'single'" class="bg-gray-900 rounded-2xl p-6 flex flex-col gap-6 border border-gray-800">

				<!-- Done state -->
				<template v-if="single.status.value === 'done'">
					<DownloadLink
						:url="single.downloadURL.value"
						:filename="single.outputFilename.value"
						@reset="single.reset"
					/>
				</template>

				<!-- Working state -->
				<template v-else-if="single.status.value === 'loading' || single.status.value === 'converting'">
					<div class="text-sm text-gray-400 flex items-center gap-2">
						<span class="font-medium text-white">{{ single.file.value.name }}</span>
						<span class="text-gray-600">&middot;</span>
						<span>{{ formatFileSize(single.file.value.size) }}</span>
						<span class="text-gray-600">&rarr;</span>
						<span class="text-teal-400 uppercase font-medium">{{ single.outputFormat.value }}</span>
					</div>
					<ProgressBar :progress="single.progress.value" :status="single.status.value" />
				</template>

				<!-- Idle / error state -->
				<template v-else>
					<div v-if="!single.file.value">
						<FileUploader @file-selected="single.selectFile" />
					</div>

					<div v-else class="flex items-center justify-between gap-3 px-4 py-3 bg-gray-800 rounded-xl">
						<div class="flex items-center gap-3 min-w-0">
							<svg class="w-5 h-5 text-teal-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
							</svg>
							<div class="min-w-0">
								<p class="text-sm font-medium text-white truncate">{{ single.file.value.name }}</p>
								<p class="text-xs text-gray-500">{{ formatFileSize(single.file.value.size) }}</p>
							</div>
						</div>
						<button
							type="button"
							class="text-gray-600 hover:text-gray-300 transition-colors shrink-0"
							@click="single.reset"
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>

					<FormatSelector v-if="single.file.value" v-model="single.outputFormat.value" />

					<div v-if="single.status.value === 'error'" class="flex items-start gap-2 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">
						<svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
						</svg>
						<span>{{ single.errorMessage.value }}</span>
					</div>

					<button
						v-if="single.file.value"
						type="button"
						class="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
						:disabled="!single.file.value"
						@click="single.convert"
					>
						Convert to {{ single.outputFormat.value.toUpperCase() }}
					</button>
				</template>

			</div>

			<!-- ==================== BULK MODE ==================== -->
			<div v-else class="bg-gray-900 rounded-2xl p-6 flex flex-col gap-6 border border-gray-800">

				<!-- Done state -->
				<template v-if="bulk.status.value === 'done'">
					<div class="flex flex-col gap-4">
						<div class="flex items-center gap-2 text-teal-400">
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
							</svg>
							<span class="font-medium">
								{{ bulk.doneCount.value }} of {{ bulk.queue.length }} converted
								<span v-if="bulk.errorCount.value > 0" class="text-red-400">({{ bulk.errorCount.value }} failed)</span>
							</span>
						</div>

						<FileList :queue="bulk.queue" :can-remove="false" />

						<button
							type="button"
							class="text-teal-600 hover:text-teal-400 text-sm transition-colors"
							@click="bulk.reset"
						>
							Convert more files
						</button>
					</div>
				</template>

				<!-- Working state -->
				<template v-else-if="bulk.status.value === 'loading' || bulk.status.value === 'converting'">
					<div class="text-sm text-gray-400">
						<span v-if="bulk.status.value === 'loading'">Loading FFmpeg...</span>
						<span v-else>
							Converting {{ bulk.currentIndex.value + 1 }} of {{ bulk.queue.length }}...
						</span>
					</div>
					<ProgressBar :progress="bulk.overallProgress.value" :status="bulk.status.value" />
					<FileList :queue="bulk.queue" :can-remove="false" />
				</template>

				<!-- Idle state -->
				<template v-else>
					<BulkUploader @files-selected="bulk.addFiles" />

					<!-- File queue -->
					<template v-if="bulk.queue.length > 0">
						<div class="flex items-center justify-between">
							<span class="text-sm text-gray-400">{{ bulk.queue.length }} file{{ bulk.queue.length === 1 ? '' : 's' }} queued</span>
							<button
								type="button"
								class="text-xs text-gray-600 hover:text-gray-300 transition-colors"
								@click="bulk.reset"
							>
								Clear all
							</button>
						</div>

						<FileList :queue="bulk.queue" :can-remove="true" @remove="bulk.removeFile" />

						<FormatSelector v-model="bulk.outputFormat.value" />

						<!-- Error -->
						<div v-if="bulk.status.value === 'error'" class="flex items-start gap-2 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">
							<svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
							</svg>
							<span>{{ bulk.errorMessage.value }}</span>
						</div>

						<button
							type="button"
							class="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors"
							@click="bulk.convertAll"
						>
							Convert all to {{ bulk.outputFormat.value.toUpperCase() }}
						</button>
					</template>
				</template>

			</div>

			<!-- Footer -->
			<p class="text-center text-xs text-gray-700">
				Runs entirely in your browser &middot; No uploads &middot; No servers
			</p>

		</div>
	</div>
</template>
