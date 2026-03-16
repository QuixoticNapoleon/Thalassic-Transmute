import { ref, reactive, computed } from 'vue'
import { loadFFmpeg, convertFile } from '../lib/ffmpeg.js'

export const FORMATS = {
	video: ['mp4', 'webm', 'avi', 'mov', 'mkv'],
	audio: ['mp3', 'wav', 'aac'],
	image: ['png', 'jpg', 'webp', 'bmp', 'tiff'],
}

let nextId = 0

export function useConverter() {
	const queue = reactive([])
	const outputFormat = ref('mp4')
	const status = ref('idle') // idle | loading | converting | done | error
	const errorMessage = ref('')
	const currentIndex = ref(-1)

	const fileCount = computed(() => queue.length)

	const overallProgress = computed(() => {
		if (queue.length === 0) return 0
		const total = queue.reduce((sum, item) => sum + item.progress, 0)
		return Math.round(total / queue.length)
	})

	const allDone = computed(() =>
		queue.length > 0 && queue.every(item => item.status === 'done' || item.status === 'error')
	)
	const doneCount = computed(() => queue.filter(item => item.status === 'done').length)
	const errorCount = computed(() => queue.filter(item => item.status === 'error').length)

	function addFiles(files) {
		const list = Array.isArray(files) ? files : [files]
		for (const file of list) {
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
	}

	async function convert() {
		if (queue.length === 0) return

		// Update output filenames in case format changed after adding files
		for (const item of queue) {
			if (item.status === 'pending') {
				item.outputFilename = item.file.name.replace(/\.[^.]+$/, '') + '.' + outputFormat.value
			}
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
		fileCount,
		overallProgress,
		allDone,
		doneCount,
		errorCount,
		addFiles,
		removeFile,
		reset,
		convert,
		FORMATS,
	}
}
