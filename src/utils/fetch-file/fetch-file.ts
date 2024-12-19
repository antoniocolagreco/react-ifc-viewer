import type { ProgressStatus } from '@/types'
import { isRunningInBrowser } from '@/utils'

type FetchFileFunctionType = (
	url: string,
	onLoad: (file: Uint8Array) => void,
	onProgress: (status: ProgressStatus) => void,
	onError: (error: Error) => void,
) => Promise<void>

const fetchFile: FetchFileFunctionType = async (url: string, onLoad, onProgress, onError): Promise<void> => {
	let total = -1
	let loaded = 0

	try {
		const chunks: Uint8Array[] = []

		if (!isRunningInBrowser()) {
			throw new Error('This function is only available in the browser')
		}
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
			onProgress({ state: 'PROGRESS', loaded, total })
		}

		const fileBuffer = new Uint8Array(loaded)
		let position = 0
		for (const chunk of chunks) {
			fileBuffer.set(chunk, position)
			position += chunk.length
		}

		onProgress({ state: 'DONE', loaded, total })
		onLoad(fileBuffer)
	} catch (error: unknown) {
		onError(error as Error)
		onProgress({ state: 'ERROR', loaded, total })
	}
}

export { fetchFile }
