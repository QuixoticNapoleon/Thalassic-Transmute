import { ref, reactive, computed } from 'vue'
import { loadPandoc, convertDocument, outputToBlob, isBinaryInputFormat } from '../lib/pandoc.js'

export const DOC_FORMATS = {
	markdown: { label: 'Markdown', ext: 'md', input: true, output: true },
	html: { label: 'HTML', ext: 'html', input: true, output: true },
	plain: { label: 'Plain Text', ext: 'txt', input: true, output: true },
	latex: { label: 'LaTeX', ext: 'tex', input: true, output: true },
	rst: { label: 'RST', ext: 'rst', input: true, output: true },
	docx: { label: 'DOCX', ext: 'docx', input: true, output: true },
	odt: { label: 'ODT', ext: 'odt', input: true, output: true },
	epub: { label: 'EPUB', ext: 'epub', input: false, output: true },
	pdf: { label: 'PDF', ext: 'pdf', input: false, output: true },
}

const EXT_TO_FORMAT = {
	md: 'markdown',
	markdown: 'markdown',
	html: 'html',
	htm: 'html',
	txt: 'plain',
	text: 'plain',
	tex: 'latex',
	latex: 'latex',
	rst: 'rst',
	docx: 'docx',
	odt: 'odt',
}

export function detectFormat(filename) {
	const ext = filename.split('.').pop().toLowerCase()
	return EXT_TO_FORMAT[ext] ?? null
}

let nextId = 0

export function useDocConverter() {
	const queue = reactive([])
	const outputFormat = ref('html')
	const status = ref('idle') // idle | loading | converting | done | error
	const errorMessage = ref('')
	const currentIndex = ref(-1)

	const fileCount = computed(() => queue.length)
	const doneCount = computed(() => queue.filter(item => item.status === 'done').length)
	const errorCount = computed(() => queue.filter(item => item.status === 'error').length)
	const skippedCount = computed(() => queue.filter(item => item.status === 'skipped').length)
	const convertibleCount = computed(() => queue.filter(item => item.inputFormat !== null).length)
	const unrecognisedCount = computed(() => queue.filter(item => item.inputFormat === null).length)

	const outputFormats = computed(() =>
		Object.entries(DOC_FORMATS)
			.filter(([, v]) => v.output)
			.map(([k, v]) => ({ id: k, ...v }))
	)

	function addFiles(files) {
		const list = Array.isArray(files) ? files : [files]
		for (const file of list) {
			const inputFormat = detectFormat(file.name)
			queue.push({
				id: nextId++,
				file,
				inputFormat,
				mediaType: inputFormat ? DOC_FORMATS[inputFormat]?.label ?? inputFormat : 'Unknown',
				status: inputFormat ? 'pending' : 'skipped',
				progress: 0,
				outputBlob: null,
				outputFilename: file.name.replace(/\.[^.]+$/, '') + '.' + (DOC_FORMATS[outputFormat.value]?.ext ?? outputFormat.value),
				downloadURL: null,
				error: inputFormat ? '' : 'Unrecognised format',
			})
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
		const ext = DOC_FORMATS[fmt]?.ext ?? fmt

		// Update output filenames and mark unrecognised files as skipped
		for (const item of queue) {
			if (item.status === 'done') continue
			if (!item.inputFormat) {
				item.status = 'skipped'
				item.error = 'Unrecognised format'
			} else {
				item.outputFilename = item.file.name.replace(/\.[^.]+$/, '') + '.' + ext
			}
		}

		const convertible = queue.filter(item => item.status === 'pending')
		if (convertible.length === 0) {
			status.value = 'done'
			return
		}

		try {
			status.value = 'loading'
			await loadPandoc()
			status.value = 'converting'

			for (let i = 0; i < queue.length; i++) {
				const item = queue[i]
				if (item.status === 'skipped' || item.status === 'done') continue

				currentIndex.value = i
				item.status = 'converting'
				item.progress = 0

				try {
					const actualOutputFormat = fmt === 'pdf' ? 'html' : fmt

					let input
					if (isBinaryInputFormat(item.inputFormat)) {
						const buffer = await item.file.arrayBuffer()
						input = new Uint8Array(buffer)
					} else {
						input = await item.file.text()
					}

					const outputBytes = await convertDocument(
						input,
						item.inputFormat,
						actualOutputFormat,
						{ standalone: true }
					)

					if (fmt === 'pdf') {
						// For PDF: convert to HTML then trigger print
						const htmlString = new TextDecoder().decode(outputBytes)
						printAsPdf(htmlString)
						item.progress = 100
						item.status = 'done'
						item.error = 'Opened in print dialog'
					} else {
						item.outputBlob = outputToBlob(outputBytes, actualOutputFormat)
						item.downloadURL = URL.createObjectURL(item.outputBlob)
						item.progress = 100
						item.status = 'done'
					}
				} catch (err) {
					item.status = 'error'
					item.error = err?.message ?? 'Conversion failed.'
					console.error(`Failed to convert ${item.file.name}:`, err)
				}
			}

			status.value = 'done'
		} catch (err) {
			status.value = 'error'
			errorMessage.value = err?.message ?? 'Failed to load Pandoc.'
			console.error(err)
		}
	}

	function printAsPdf(htmlContent) {
		const iframe = document.createElement('iframe')
		iframe.style.position = 'fixed'
		iframe.style.left = '-9999px'
		iframe.style.top = '-9999px'
		iframe.style.width = '0'
		iframe.style.height = '0'
		document.body.appendChild(iframe)

		iframe.contentDocument.open()
		iframe.contentDocument.write(htmlContent)
		iframe.contentDocument.close()

		iframe.onload = () => {
			iframe.contentWindow.focus()
			iframe.contentWindow.print()
			setTimeout(() => document.body.removeChild(iframe), 1000)
		}
	}

	return {
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
		DOC_FORMATS,
	}
}
