import { IfcProgressEvent } from '@/classes/ifc-progress-event'
import { isRunningInBrowser } from '@/utils'

type FetchFileFunctionType = (
	url: string,
	onLoad: (file: Uint8Array) => void,
	onProgress: (event: IfcProgressEvent) => void,
	onError: (error: Error) => void,
	wasm?: { path: string; absolute: boolean },
) => Promise<void>

const fetchFile: FetchFileFunctionType = async (url: string, onLoad, onProgress, onError): Promise<void> => {
	let total = -1
	let loaded = 0

	try {
		const chunks: Uint8Array[] = []

		if (isRunningInBrowser()) {
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error(`File not found at "${url}"`)
			}

			const contentLength = response.headers.get('Content-Length')
			if (contentLength) {
				total = Number.parseInt(contentLength, 10)
			}

			const reader = response.body?.getReader()

			while (true) {
				if (!reader) {
					throw new Error('Response body is missing')
				}
				const { done, value } = await reader.read()
				if (done) break

				chunks.push(value)
				loaded += value.length
				onProgress(new IfcProgressEvent('PROGRESS', { loaded, total }))
			}
		} else {
			const fs = await import('node:fs')
			const stats = fs.statSync(url)
			const total = stats.size

			const stream = fs.createReadStream(url, { highWaterMark: 64 * 1024 })

			for await (const streamChunk of stream) {
				const chunk = streamChunk as Uint8Array
				chunks.push(chunk)
				loaded += chunk.length
				onProgress(new IfcProgressEvent('PROGRESS', { loaded, total }))
			}
		}
		const fileBuffer = new Uint8Array(loaded)
		let position = 0
		for (const chunk of chunks) {
			fileBuffer.set(chunk, position)
			position += chunk.length
		}

		onProgress(new IfcProgressEvent('DONE', { loaded, total }))
		onLoad(fileBuffer)
	} catch (error: unknown) {
		onError(error as Error)
		onProgress(new IfcProgressEvent('ERROR', { loaded, total }))
	}
}

export { fetchFile }
