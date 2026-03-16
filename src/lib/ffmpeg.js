import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

const ffmpeg = new FFmpeg()
let loaded = false

const BASE_URL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.9/dist/esm'

export async function loadFFmpeg(onLog) {
	if (loaded) return

	if (onLog) {
		ffmpeg.on('log', ({ message }) => onLog(message))
	}

	await ffmpeg.load({
		coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
		wasmURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
		workerURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.worker.js`, 'text/javascript'),
	})

	loaded = true
}

export async function convertFile(file, outputFormat, onProgress) {
	const inputName = `input.${getExtension(file.name)}`
	const outputName = `output.${outputFormat}`

	ffmpeg.on('progress', ({ progress }) => {
		if (onProgress) onProgress(Math.round(progress * 100))
	})

	await ffmpeg.writeFile(inputName, await fetchFile(file))
	await ffmpeg.exec(buildCommand(inputName, outputName, outputFormat))

	const data = await ffmpeg.readFile(outputName)

	await ffmpeg.deleteFile(inputName)
	await ffmpeg.deleteFile(outputName)

	return new Blob([data.buffer], { type: getMimeType(outputFormat) })
}

function getExtension(filename) {
	return filename.split('.').pop().toLowerCase()
}

function getMimeType(format) {
	const types = {
		mp4: 'video/mp4',
		webm: 'video/webm',
		avi: 'video/x-msvideo',
		mov: 'video/quicktime',
		mkv: 'video/x-matroska',
		mp3: 'audio/mpeg',
		wav: 'audio/wav',
		aac: 'audio/aac',
	}
	return types[format] ?? 'application/octet-stream'
}

function buildCommand(input, output, format) {
	const audioFormats = ['mp3', 'wav', 'aac']
	const isAudioOutput = audioFormats.includes(format)

	if (isAudioOutput) {
		// Extract audio
		return ['-i', input, '-vn', output]
	}

	// Video conversion — reasonable defaults
	return ['-i', input, output]
}
