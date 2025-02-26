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

type IfcViewMode = 'VIEW_MODE_ALL' | 'VIEW_MODE_TRANSPARENT' | 'VIEW_MODE_SELECTABLE'

type IfcLoadingStatus = {
	status: IfcViewerStatus
	loaded?: number
	total?: number
	percentage?: string
}
type IfcPosition = { x: number; y: number }

type IfcMouseState = IfcPosition & { clicked: boolean }

export type { IfcLoadingStatus, IfcMouseState, IfcPosition, IfcViewerStatus, IfcViewMode }
