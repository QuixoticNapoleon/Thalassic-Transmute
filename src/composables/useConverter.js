import { ref, computed } from 'vue'
import { loadFFmpeg, convertFile } from '../lib/ffmpeg.js'

export const FORMATS = {
	video: ['mp4', 'webm', 'avi', 'mov', 'mkv'],
	audio: ['mp3', 'wav', 'aac'],
}

export function useConverter() {
	const file = ref(null)
	const outputFormat = ref('mp4')
	const progress = ref(0)
	const status = ref('idle') // idle | loading | converting | done | error
	const errorMessage = ref('')
	const outputBlob = ref(null)
	const outputFilename = computed(() => {
		if (!file.value) return ''
		const base = file.value.name.replace(/\.[^.]+$/, '')
		return `${base}.${outputFormat.value}`
	})
	const downloadURL = computed(() => {
		if (!outputBlob.value) return null
		return URL.createObjectURL(outputBlob.value)
	})

	function selectFile(f) {
		file.value = f
		outputBlob.value = null
		progress.value = 0
		status.value = 'idle'
		errorMessage.value = ''
	}

	function reset() {
		file.value = null
		outputBlob.value = null
		progress.value = 0
		status.value = 'idle'
		errorMessage.value = ''
		outputFormat.value = 'mp4'
	}

	async function convert() {
		if (!file.value) return

		outputBlob.value = null
		progress.value = 0
		errorMessage.value = ''

		try {
			status.value = 'loading'
			await loadFFmpeg()

			status.value = 'converting'
			outputBlob.value = await convertFile(
				file.value,
				outputFormat.value,
				(p) => { progress.value = p }
			)
			progress.value = 100
			status.value = 'done'
		} catch (err) {
			status.value = 'error'
			errorMessage.value = err?.message ?? 'Conversion failed.'
			console.error(err)
		}
	}

	return {
		file,
		outputFormat,
		progress,
		status,
		errorMessage,
		outputBlob,
		outputFilename,
		downloadURL,
		selectFile,
		reset,
		convert,
		FORMATS,
	}
}
