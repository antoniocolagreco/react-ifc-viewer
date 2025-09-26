import type { IfcElementData, IfcElementLink, Requirements, SelectableRequirements } from '@/core/types'

type ProcessIfcDataRequest = {
	elements: IfcElementData[]
	linkRequirements?: IfcElementLink[]
	selectableRequirements?: SelectableRequirements[]
	alwaysVisibleRequirements?: Requirements[]
	batchSize?: number
}

type ProcessIfcDataProgressMessage = {
	type: 'progress'
	processed: number
	total: number
}

type ProcessIfcDataResultMessage = {
	type: 'result'
	elements: IfcElementData[]
}

type ProcessIfcDataErrorMessage = {
	type: 'error'
	message: string
}

type ProcessIfcDataWorkerMessage =
	| ProcessIfcDataProgressMessage
	| ProcessIfcDataResultMessage
	| ProcessIfcDataErrorMessage

export type {
	ProcessIfcDataErrorMessage,
	ProcessIfcDataProgressMessage,
	ProcessIfcDataRequest,
	ProcessIfcDataResultMessage,
	ProcessIfcDataWorkerMessage,
}
