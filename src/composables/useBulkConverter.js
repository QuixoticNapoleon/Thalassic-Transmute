import { ref, reactive, computed } from 'vue'
import { loadFFmpeg, convertFile } from '../lib/ffmpeg.js'
import { FORMATS } from './useConverter.js'

/**
 * Each entry in the queue:
 * {
 *   id: number,
 *   file: File,
 *   status: 'pending' | 'converting' | 'done' | 'error',
 *   progress: number,
 *   outputBlob: Blob | null,
 *   outputFilename: string,
 *   downloadURL: string | null,
 *   error: string,
 * }
 */

let nextId = 0

export function useBulkConverter() {
	const queue = reactive([])
	const outputFormat = ref('mp4')
	const status = ref('idle') // idle | loading | converting | done | error
	const errorMessage = ref('')
	const currentIndex = ref(-1)

	const overallProgress = computed(() => {
		if (queue.length === 0) return 0
		const total = queue.reduce((sum, item) => sum + item.progress, 0)
		return Math.round(total / queue.length)
	})

	const allDone = computed(() => queue.length > 0 && queue.every(item => item.status === 'done' || item.status === 'error'))
	const doneCount = computed(() => queue.filter(item => item.status === 'done').length)
	const errorCount = computed(() => queue.filter(item => item.status === 'error').length)

	function addFiles(files) {
		for (const file of files) {
			queue.push({
				id: nextId++,
				file,
				status: 'pending',
				progress: 0,
				outputBlob: null,
				outputFilename: file.name.replace(/\.[^.]+$/, '') + '.' + outputFormat.value,
				downloadURL: null,
				error: '',
			})
		}
	}

	function removeFile(id) {
		const idx = queue.findIndex(item => item.id === id)
		if (idx !== -1 && queue[idx].status === 'pending') {
			if (queue[idx].downloadURL) URL.revokeObjectURL(queue[idx].downloadURL)
			queue.splice(idx, 1)
		}
	}

	function reset() {
		for (const item of queue) {
			if (item.downloadURL) URL.revokeObjectURL(item.downloadURL)
		}
		queue.splice(0, queue.length)
		status.value = 'idle'
		errorMessage.value = ''
		currentIndex.value = -1
		outputFormat.value = 'mp4'
	}

	async function convertAll() {
		if (queue.length === 0) return

		// Update output filenames in case format changed after adding files
		for (const item of queue) {
			item.outputFilename = item.file.name.replace(/\.[^.]+$/, '') + '.' + outputFormat.value
		}

		try {
			status.value = 'loading'
			await loadFFmpeg()
			status.value = 'converting'

			for (let i = 0; i < queue.length; i++) {
				const item = queue[i]
				if (item.status === 'done') continue

				currentIndex.value = i
				item.status = 'converting'
				item.progress = 0

				try {
					item.outputBlob = await convertFile(
						item.file,
						outputFormat.value,
						(p) => { item.progress = p }
					)
					item.progress = 100
					item.downloadURL = URL.createObjectURL(item.outputBlob)
					item.status = 'done'
				} catch (err) {
					item.status = 'error'
					item.error = err?.message ?? 'Conversion failed.'
					console.error(`Failed to convert ${item.file.name}:`, err)
				}
			}

			status.value = 'done'
		} catch (err) {
			status.value = 'error'
			errorMessage.value = err?.message ?? 'Failed to load FFmpeg.'
			console.error(err)
		}
	}

	return {
		queue,
		outputFormat,
		status,
		errorMessage,
		currentIndex,
		overallProgress,
		allDone,
		doneCount,
		errorCount,
		addFiles,
		removeFile,
		reset,
		convertAll,
		FORMATS,
	}
}
