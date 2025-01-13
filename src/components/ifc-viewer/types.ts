type IfcViewerStatus =
	| 'NOT_INITIALIZED'
	| 'FETCHING'
	| 'LOADING_MESHES'
	| 'LOADING_PROPERTIES'
	| 'PROCESSING'
	| 'SETTING_DATA'
	| 'DONE'
	| 'ERROR'
	| 'ERROR_FETCHING'
	| 'ERROR_LOADING_MESHES'
	| 'ERROR_LOADING_PROPERTIES'
	| 'ERROR_PROCESSING'
	| 'ERROR_SETTING_DATA'

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
