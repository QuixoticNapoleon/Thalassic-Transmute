<script setup>
import { useConverter } from '../composables/useConverter.js'
import FileUploader from './FileUploader.vue'
import FormatSelector from './FormatSelector.vue'
import ProgressBar from './ProgressBar.vue'
import FileList from './FileList.vue'

const {
	queue,
	outputFormat,
	status,
	errorMessage,
	currentIndex,
	fileCount,
	overallProgress,
	doneCount,
	errorCount,
	skippedCount,
	compatibleCount,
	incompatibleCount,
	availableFormats,
	addFiles,
	removeFile,
	reset,
	convert,
} = useConverter()
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
					type="button"
					class="text-teal-600 hover:text-teal-400 text-sm transition-colors"
					@click="reset"
				>
					Convert more files
				</button>
			</div>
		</template>

		<!-- Working state -->
		<template v-else-if="status === 'loading' || status === 'converting'">
			<div class="text-sm text-gray-400">
				<span v-if="status === 'loading'">Loading FFmpeg...</span>
				<span v-else>
					Converting {{ currentIndex + 1 }} of {{ compatibleCount }}...
				</span>
			</div>
			<ProgressBar :progress="overallProgress" :status="status" />
			<FileList :queue="queue" :can-remove="false" />
		</template>

		<!-- Idle / error state -->
		<template v-else>
			<FileUploader @files-selected="addFiles" />

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

				<FormatSelector v-model="outputFormat" :available-formats="availableFormats" />

				<!-- Incompatibility warning -->
				<div v-if="incompatibleCount > 0" class="flex items-start gap-2 text-sm text-yellow-500 bg-yellow-950/30 border border-yellow-800/50 rounded-xl px-4 py-3">
					<svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
					<span>{{ incompatibleCount }} file{{ incompatibleCount === 1 ? '' : 's' }} can't be converted to {{ outputFormat.toUpperCase() }} and will be skipped.</span>
				</div>

				<!-- Error -->
				<div v-if="status === 'error'" class="flex items-start gap-2 text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-xl px-4 py-3">
					<svg class="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
					</svg>
					<span>{{ errorMessage }}</span>
				</div>

				<button
					type="button"
					class="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					:disabled="compatibleCount === 0"
					@click="convert"
				>
					<template v-if="compatibleCount === 0">
						No files can be converted to {{ outputFormat.toUpperCase() }}
					</template>
					<template v-else>
						Convert {{ compatibleCount === 1 ? '' : 'all ' }}{{ compatibleCount }} file{{ compatibleCount === 1 ? '' : 's' }} to {{ outputFormat.toUpperCase() }}
					</template>
				</button>
			</template>
		</template>

	</div>
</template>
