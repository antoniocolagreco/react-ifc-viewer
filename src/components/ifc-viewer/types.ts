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

type ViewMode = 'VIEW_MODE_ALL' | 'VIEW_MODE_TRANSPARENT' | 'VIEW_MODE_SELECTABLE'

type LoadingStatus = {
	status: IfcViewerStatus
	loaded?: number
	total?: number
	percentage?: string
}
type Position = { x: number; y: number }

type MouseState = Position & { clicked: boolean }

export type { IfcViewerStatus, LoadingStatus, MouseState, Position, ViewMode }
