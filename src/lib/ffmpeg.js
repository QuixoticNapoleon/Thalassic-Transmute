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

	function handleProgress({ progress }) {
		if (onProgress) {
			onProgress(Math.min(100, Math.max(0, Math.round(progress * 100))))
		}
	}

	ffmpeg.off('progress', handleProgress)
	ffmpeg.on('progress', handleProgress)

	await ffmpeg.writeFile(inputName, await fetchFile(file))
	await ffmpeg.exec(buildCommand(inputName, outputName, outputFormat))

	ffmpeg.off('progress', handleProgress)

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
		png: 'image/png',
		jpg: 'image/jpeg',
		webp: 'image/webp',
		bmp: 'image/bmp',
		tiff: 'image/tiff',
	}
	return types[format] ?? 'application/octet-stream'
}

const IMAGE_FORMATS = new Set(['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'tif', 'gif'])

// Containers that typically carry H.264/H.265 video + AAC audio.
// Converting between these can be done by remuxing (-c copy) with
// no re-encoding — identical quality, near-instant speed.
const H26X_CONTAINERS = new Set(['mp4', 'mkv', 'mov'])

// AVI can carry many codecs but generally works with -c copy from H.264 sources
const COPY_COMPATIBLE = new Set([...H26X_CONTAINERS, 'avi'])

// WebM requires VP8/VP9 video + Opus/Vorbis audio — always needs re-encoding
// from H.264 sources, and vice-versa.

const threads = Math.min(navigator.hardwareConcurrency ?? 4, 8)

function canRemux(inputExt, outputFormat) {
	// Same format — always remux
	if (inputExt === outputFormat) return true

	// Both containers support the same codec families — remux
	if (COPY_COMPATIBLE.has(inputExt) && COPY_COMPATIBLE.has(outputFormat)) return true

	// WebM ↔ WebM is fine
	if (inputExt === 'webm' && outputFormat === 'webm') return true

	return false
}

function buildCommand(input, output, format) {
	const inputExt = getExtension(input)
	const isImageInput = IMAGE_FORMATS.has(inputExt)
	const isImageOutput = IMAGE_FORMATS.has(format)
	const audioFormats = ['mp3', 'wav', 'aac']
	const isAudioOutput = audioFormats.includes(format)

	// Image → Image: straightforward, ffmpeg handles it natively
	if (isImageInput && isImageOutput) {
		return ['-i', input, output]
	}

	// Video → Image: extract first frame
	if (!isImageInput && isImageOutput) {
		return ['-i', input, '-frames:v', '1', output]
	}

	if (isAudioOutput) {
		if (format === 'aac') {
			// AAC extraction — copy if source likely has AAC audio (mp4/mkv/mov)
			if (H26X_CONTAINERS.has(inputExt)) {
				return ['-i', input, '-vn', '-c:a', 'copy', output]
			}
			return ['-i', input, '-vn', '-threads', String(threads), output]
		}
		// MP3 / WAV — must re-encode but no video processing needed
		return ['-i', input, '-vn', '-threads', String(threads), output]
	}

	// Video → Video
	if (canRemux(inputExt, format)) {
		// Remux: copy all streams, no re-encoding, identical quality, near-instant
		return ['-i', input, '-c', 'copy', output]
	}

	// Must re-encode (e.g. MP4 → WebM or WebM → MP4)
	// Use high-quality settings that preserve source quality
	if (format === 'webm') {
		// VP8 with CRF 10 (near-lossless) + Vorbis audio at high bitrate
		return [
			'-i', input,
			'-c:v', 'libvpx',
			'-crf', '10',
			'-b:v', '0',
			'-c:a', 'libvorbis',
			'-q:a', '6',
			'-threads', String(threads),
			output,
		]
	}

	if (inputExt === 'webm' && H26X_CONTAINERS.has(format)) {
		// WebM → MP4/MKV/MOV: re-encode to H.264 with CRF 18 (visually lossless)
		return [
			'-i', input,
			'-c:v', 'libx264',
			'-crf', '18',
			'-preset', 'fast',
			'-c:a', 'aac',
			'-b:a', '192k',
			'-threads', String(threads),
			output,
		]
	}

	// Fallback: re-encode with quality-preserving defaults
	return ['-i', input, '-threads', String(threads), output]
}
