let worker = null
let loaded = false
let msgId = 0

function getWorker() {
	if (!worker) {
		worker = new Worker(
			new URL('../workers/pandoc.worker.js', import.meta.url),
			{ type: 'module' }
		)
	}
	return worker
}

function send(type, payload) {
	return new Promise((resolve, reject) => {
		const id = msgId++
		const w = getWorker()

		function handler(e) {
			if (e.data.id !== id) return
			w.removeEventListener('message', handler)

			if (e.data.type === 'error') {
				reject(new Error(e.data.payload))
			} else {
				resolve(e.data)
			}
		}

		w.addEventListener('message', handler)
		w.postMessage({ id, type, payload })
	})
}

export async function loadPandoc() {
	if (loaded) return
	await send('load')
	loaded = true
}

// Binary formats that produce/consume raw bytes rather than text
const BINARY_OUTPUT_FORMATS = new Set(['docx', 'odt', 'epub'])
const BINARY_INPUT_FORMATS = new Set(['docx', 'odt'])

export function isBinaryInputFormat(format) {
	return BINARY_INPUT_FORMATS.has(format)
}

export function isBinaryOutputFormat(format) {
	return BINARY_OUTPUT_FORMATS.has(format)
}

/**
 * Convert a document.
 *
 * @param {string|Uint8Array} input — text string or binary file bytes
 * @param {string} fromFormat — pandoc input format name
 * @param {string} toFormat — pandoc output format name
 * @param {object} options — { standalone: boolean }
 * @returns {Promise<Uint8Array>} — output bytes
 */
export async function convertDocument(input, fromFormat, toFormat, options = {}) {
	const isBinaryIn = input instanceof Uint8Array
	const isBinaryOut = BINARY_OUTPUT_FORMATS.has(toFormat)

	// Build pandoc argument string
	const parts = []
	parts.push(`-f ${fromFormat}`)
	parts.push(`-t ${toFormat}`)

	if (isBinaryIn) {
		parts.push('-i /in')
	} else {
		parts.push('-i /in')
	}

	parts.push('-o /out')

	if (options.standalone || isBinaryOut) {
		parts.push('-s')
	}

	const argsStr = parts.join(' ')

	const inputBytes = isBinaryIn ? input : new TextEncoder().encode(input)

	const response = await send('convert', { argsStr, inputBytes })
	return response.payload
}

/**
 * Build a download Blob from pandoc output bytes.
 */
export function outputToBlob(bytes, format) {
	const mimeTypes = {
		markdown: 'text/markdown',
		html: 'text/html',
		plain: 'text/plain',
		latex: 'application/x-latex',
		rst: 'text/x-rst',
		docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		odt: 'application/vnd.oasis.opendocument.text',
		epub: 'application/epub+zip',
	}
	return new Blob([bytes], { type: mimeTypes[format] ?? 'application/octet-stream' })
}
