import { ref, computed } from 'vue'
import { loadPandoc, convertDocument, outputToBlob, isBinaryInputFormat, isBinaryOutputFormat } from '../lib/pandoc.js'

// Pandoc format identifiers
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

export function useDocConverter() {
	const file = ref(null)
	const inputFormat = ref(null)
	const outputFormat = ref('html')
	const status = ref('idle') // idle | loading | converting | done | error
	const errorMessage = ref('')
	const outputBlob = ref(null)

	const outputFilename = computed(() => {
		if (!file.value || !outputFormat.value) return ''
		const base = file.value.name.replace(/\.[^.]+$/, '')
		const fmt = DOC_FORMATS[outputFormat.value]
		return `${base}.${fmt?.ext ?? outputFormat.value}`
	})

	const downloadURL = computed(() => {
		if (!outputBlob.value) return null
		return URL.createObjectURL(outputBlob.value)
	})

	const inputFormats = computed(() =>
		Object.entries(DOC_FORMATS)
			.filter(([, v]) => v.input)
			.map(([k, v]) => ({ id: k, ...v }))
	)

	const outputFormats = computed(() =>
		Object.entries(DOC_FORMATS)
			.filter(([, v]) => v.output)
			.map(([k, v]) => ({ id: k, ...v }))
	)

	function selectFile(f) {
		file.value = f
		outputBlob.value = null
		status.value = 'idle'
		errorMessage.value = ''

		// Auto-detect input format
		const detected = detectFormat(f.name)
		inputFormat.value = detected

		// Pick a sensible default output format
		if (detected === 'markdown') outputFormat.value = 'html'
		else if (detected === 'html') outputFormat.value = 'markdown'
		else if (detected === 'docx' || detected === 'odt') outputFormat.value = 'markdown'
		else if (detected === 'latex') outputFormat.value = 'html'
		else outputFormat.value = 'html'
	}

	function reset() {
		if (downloadURL.value) URL.revokeObjectURL(downloadURL.value)
		file.value = null
		inputFormat.value = null
		outputFormat.value = 'html'
		outputBlob.value = null
		status.value = 'idle'
		errorMessage.value = ''
	}

	async function convert() {
		if (!file.value || !inputFormat.value || !outputFormat.value) return

		outputBlob.value = null
		errorMessage.value = ''

		try {
			status.value = 'loading'
			await loadPandoc()

			status.value = 'converting'

			// Handle PDF special case: convert to HTML then print
			const actualOutputFormat = outputFormat.value === 'pdf' ? 'html' : outputFormat.value

			let input
			if (isBinaryInputFormat(inputFormat.value)) {
				const buffer = await file.value.arrayBuffer()
				input = new Uint8Array(buffer)
			} else {
				input = await file.value.text()
			}

			const outputBytes = await convertDocument(
				input,
				inputFormat.value,
				actualOutputFormat,
				{ standalone: true }
			)

			if (outputFormat.value === 'pdf') {
				// Convert HTML output to PDF via browser print
				const htmlString = new TextDecoder().decode(outputBytes)
				printAsPdf(htmlString)
				status.value = 'idle'
				return
			}

			outputBlob.value = outputToBlob(outputBytes, actualOutputFormat)
			status.value = 'done'
		} catch (err) {
			status.value = 'error'
			errorMessage.value = err?.message ?? 'Conversion failed.'
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
		file,
		inputFormat,
		outputFormat,
		status,
		errorMessage,
		outputBlob,
		outputFilename,
		downloadURL,
		inputFormats,
		outputFormats,
		selectFile,
		reset,
		convert,
		DOC_FORMATS,
	}
}
