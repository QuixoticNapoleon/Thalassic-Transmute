import { ref, reactive, computed } from 'vue'
import { loadFFmpeg, convertFile } from '../lib/ffmpeg.js'

export const FORMATS = {
	video: ['mp4', 'webm', 'avi', 'mov', 'mkv'],
	audio: ['mp3', 'wav', 'aac'],
	image: ['png', 'jpg', 'webp', 'bmp', 'tiff'],
}

const ALL_FORMATS = Object.values(FORMATS).flat()

const VIDEO_EXTS = new Set(['mp4', 'webm', 'avi', 'mov', 'mkv', 'm4v', 'flv', 'wmv', 'mpeg', 'mpg', '3gp'])
const AUDIO_EXTS = new Set(['mp3', 'wav', 'aac', 'ogg', 'flac', 'wma', 'm4a', 'opus'])
const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'tif', 'gif', 'heif', 'heic'])

// Conversion compatibility:
// video → video, audio
// audio → audio, video (black screen)
// image → image
const COMPATIBLE_OUTPUT = {
	video: new Set([...FORMATS.video, ...FORMATS.audio]),
	audio: new Set([...FORMATS.audio, ...FORMATS.video]),
	image: new Set(FORMATS.image),
}

export function getMediaType(filename) {
	const ext = filename.split('.').pop().toLowerCase()
	if (VIDEO_EXTS.has(ext)) return 'video'
	if (AUDIO_EXTS.has(ext)) return 'audio'
	if (IMAGE_EXTS.has(ext)) return 'image'
	return 'unknown'
}

export function canConvertTo(mediaType, format) {
	const allowed = COMPATIBLE_OUTPUT[mediaType]
	return allowed ? allowed.has(format) : false
}

let nextId = 0

export function useConverter() {
	const queue = reactive([])
	const outputFormat = ref('mp4')
	const status = ref('idle') // idle | loading | converting | done | error
	const errorMessage = ref('')
	const currentIndex = ref(-1)

	const fileCount = computed(() => queue.length)

	// Media types present in the queue
	const mediaTypesInQueue = computed(() => {
		const types = new Set()
		for (const item of queue) {
			types.add(item.mediaType)
		}
		return types
	})

	// Available output formats — union of all formats any queued file can convert to
	const availableFormats = computed(() => {
		if (queue.length === 0) return { video: [], audio: [], image: [] }

		const available = new Set()
		for (const item of queue) {
			const allowed = COMPATIBLE_OUTPUT[item.mediaType]
			if (allowed) {
				for (const fmt of allowed) available.add(fmt)
			}
		}

		return {
			video: FORMATS.video.filter(f => available.has(f)),
			audio: FORMATS.audio.filter(f => available.has(f)),
			image: FORMATS.image.filter(f => available.has(f)),
		}
	})

	// How many files are compatible with the current output format
	const compatibleCount = computed(() =>
		queue.filter(item => canConvertTo(item.mediaType, outputFormat.value)).length
	)
	const incompatibleCount = computed(() => queue.length - compatibleCount.value)

	const overallProgress = computed(() => {
		const convertible = queue.filter(item => item.status !== 'skipped')
		if (convertible.length === 0) return 0
		const total = convertible.reduce((sum, item) => sum + item.progress, 0)
		return Math.round(total / convertible.length)
	})

	const doneCount = computed(() => queue.filter(item => item.status === 'done').length)
	const errorCount = computed(() => queue.filter(item => item.status === 'error').length)
	const skippedCount = computed(() => queue.filter(item => item.status === 'skipped').length)

	function addFiles(files) {
		const list = Array.isArray(files) ? files : [files]
		for (const file of list) {
			const mediaType = getMediaType(file.name)
			queue.push({
				id: nextId++,
				file,
				mediaType,
				status: 'pending',
				progress: 0,
				outputBlob: null,
				outputFilename: file.name.replace(/\.[^.]+$/, '') + '.' + outputFormat.value,
				downloadURL: null,
				error: '',
			})
		}

		// If the current output format is no longer available, switch to the first available one
		const af = availableFormats.value
		const allAvailable = [...af.video, ...af.audio, ...af.image]
		if (allAvailable.length > 0 && !allAvailable.includes(outputFormat.value)) {
			outputFormat.value = allAvailable[0]
		}
	}

	function removeFile(id) {
		const idx = queue.findIndex(item => item.id === id)
		if (idx !== -1 && (queue[idx].status === 'pending' || queue[idx].status === 'skipped')) {
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

		const fmt = outputFormat.value

		// Mark compatible/incompatible files
		for (const item of queue) {
			if (item.status === 'done') continue
			if (!canConvertTo(item.mediaType, fmt)) {
				item.status = 'skipped'
				item.error = `Cannot convert ${item.mediaType} to ${fmt.toUpperCase()}`
				item.progress = 0
			} else {
				item.outputFilename = item.file.name.replace(/\.[^.]+$/, '') + '.' + fmt
			}
		}

		const convertible = queue.filter(item => item.status !== 'skipped' && item.status !== 'done')
		if (convertible.length === 0) {
			status.value = 'done'
			return
		}

		try {
			status.value = 'loading'
			await loadFFmpeg()
			status.value = 'converting'

			for (let i = 0; i < queue.length; i++) {
				const item = queue[i]
				if (item.status === 'skipped' || item.status === 'done') continue

				currentIndex.value = i
				item.status = 'converting'
				item.progress = 0

				try {
					item.outputBlob = await convertFile(
						item.file,
						fmt,
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

	function downloadAll() {
		const done = queue.filter(item => item.status === 'done' && item.downloadURL)
		done.forEach((item, i) => {
			setTimeout(() => {
				const a = document.createElement('a')
				a.href = item.downloadURL
				a.download = item.outputFilename
				a.click()
			}, i * 200)
		})
	}

	return {
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
		downloadAll,
		FORMATS,
	}
}
