import { processIfcData } from '@/core/utils/properties-utils'
import type {
	ProcessIfcDataErrorMessage,
	ProcessIfcDataProgressMessage,
	ProcessIfcDataRequest,
	ProcessIfcDataResultMessage,
} from '@/core/workers/types'

const PROCESS_BATCH_SIZE = 100
self.onmessage = (event: MessageEvent<ProcessIfcDataRequest>) => {
	const {
		elements,
		linkRequirements,
		selectableRequirements,
		alwaysVisibleRequirements,
		batchSize = PROCESS_BATCH_SIZE,
	} = event.data

	const total = elements.length

	try {
		for (let index = 0; index < total; index += 1) {
			const element = elements[index]
			if (!element) {
				continue
			}
			processIfcData(element, elements, linkRequirements, selectableRequirements, alwaysVisibleRequirements)
			const processed = index + 1
			if (processed % batchSize === 0 || processed === total) {
				const progressMessage: ProcessIfcDataProgressMessage = {
					type: 'progress',
					processed,
					total,
				}
				self.postMessage(progressMessage)
			}
		}

		const resultMessage: ProcessIfcDataResultMessage = { type: 'result', elements }
		self.postMessage(resultMessage)
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error while processing IFC data'
		const errorMessage: ProcessIfcDataErrorMessage = { type: 'error', message }
		self.postMessage(errorMessage)
	}
}
