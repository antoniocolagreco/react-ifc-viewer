import type { IfcElement } from '@/classes'
import type { IfcModel } from '@/classes'
import type { Property } from '@/types'

type IfcViewerStatus =
	| 'NOT_INITIALIZED'
	| 'FETCHING_PROGRESS'
	| 'FETCHING_ERROR'
	| 'LOADING_MESHES_PROGRESS'
	| 'LOADING_MESHES_ERROR'
	| 'LOADING_PROPERTIES_PROGRESS'
	| 'LOADING_PROPERTIES_ERROR'
	| 'PROCESSING_PROGRESS'
	| 'PROCESSING_ERROR'
	| 'RESTORING_DATA_PROGRESS'
	| 'RESTORING_DATA_ERROR'
	| 'INITIALIZING_VIEWPORT'
	| 'READY'
	| 'GENERIC_ERROR'

type On3DModelLoadedType = (ifc: {
	model?: IfcModel
	selectableItems: IfcElement[]
	selectByProperty: (property: Property) => IfcElement | undefined
	selectByExpressId: (expressId: number | undefined) => void
}) => void

type ViewMode = 'VIEW_MODE_ALL' | 'VIEW_MODE_TRANSPARENT' | 'VIEW_MODE_SELECTABLE'

type LoadingStatus = {
	status: IfcViewerStatus
	loaded?: number
	total?: number
}
type Position = { x: number; y: number }

type MouseState = Position & { clicked: boolean }

export type { IfcViewerStatus, LoadingStatus, MouseState, On3DModelLoadedType, Position, ViewMode }
