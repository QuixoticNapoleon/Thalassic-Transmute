import {
	WASI,
	OpenFile,
	File,
	ConsoleStdout,
	PreopenDirectory,
} from '@bjorn3/browser_wasi_shim'

const PANDOC_WASM_URL = '/pandoc.wasm'

let instance = null
let inFile = null
let outFile = null

const args = ['pandoc.wasm', '+RTS', '-H64m', '-RTS']

function memoryDataView() {
	return new DataView(instance.exports.memory.buffer)
}

async function loadPandoc() {
	if (instance) return

	inFile = new File(new Uint8Array(), { readonly: true })
	outFile = new File(new Uint8Array(), { readonly: false })

	const fds = [
		new OpenFile(new File(new Uint8Array(), { readonly: true })),
		ConsoleStdout.lineBuffered((msg) => console.log(`[pandoc stdout] ${msg}`)),
		ConsoleStdout.lineBuffered((msg) => console.warn(`[pandoc stderr] ${msg}`)),
		new PreopenDirectory('/', [
			['in', inFile],
			['out', outFile],
		]),
	]

	const wasi = new WASI(args, [], fds, { debug: false })

	const response = await fetch(PANDOC_WASM_URL)
	if (!response.ok) {
		throw new Error(`Failed to fetch pandoc.wasm: ${response.status} ${response.statusText}`)
	}

	const result = await WebAssembly.instantiateStreaming(
		response,
		{ wasi_snapshot_preview1: wasi.wasiImport }
	)

	instance = result.instance
	wasi.initialize(instance)
	instance.exports.__wasm_call_ctors()

	// Initialise Haskell RTS
	const argcPtr = instance.exports.malloc(4)
	memoryDataView().setUint32(argcPtr, args.length, true)

	const argv = instance.exports.malloc(4 * (args.length + 1))
	for (let i = 0; i < args.length; i++) {
		const arg = instance.exports.malloc(args[i].length + 1)
		new TextEncoder().encodeInto(
			args[i],
			new Uint8Array(instance.exports.memory.buffer, arg, args[i].length)
		)
		memoryDataView().setUint8(arg + args[i].length, 0)
		memoryDataView().setUint32(argv + 4 * i, arg, true)
	}
	memoryDataView().setUint32(argv + 4 * args.length, 0, true)

	const argvPtr = instance.exports.malloc(4)
	memoryDataView().setUint32(argvPtr, argv, true)

	instance.exports.hs_init_with_rtsopts(argcPtr, argvPtr)
}

function runPandoc(argsStr, inputBytes) {
	// Write input to virtual filesystem
	inFile.data = inputBytes instanceof Uint8Array ? inputBytes : new TextEncoder().encode(inputBytes)
	outFile.data = new Uint8Array()

	// Pass args string to pandoc
	const argsPtr = instance.exports.malloc(argsStr.length)
	new TextEncoder().encodeInto(
		argsStr,
		new Uint8Array(instance.exports.memory.buffer, argsPtr, argsStr.length)
	)

	instance.exports.wasm_main(argsPtr, argsStr.length)

	// Return output bytes
	return new Uint8Array(outFile.data)
}

// Message protocol
self.onmessage = async (e) => {
	const { id, type, payload } = e.data

	try {
		if (type === 'load') {
			await loadPandoc()
			self.postMessage({ id, type: 'loaded' })
		} else if (type === 'convert') {
			const { argsStr, inputBytes } = payload
			const outputBytes = runPandoc(argsStr, inputBytes)
			self.postMessage(
				{ id, type: 'result', payload: outputBytes },
				[outputBytes.buffer]
			)
		}
	} catch (err) {
		self.postMessage({ id, type: 'error', payload: err?.message ?? String(err) })
	}
}
