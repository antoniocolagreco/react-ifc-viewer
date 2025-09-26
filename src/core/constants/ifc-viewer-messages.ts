import type { IfcViewerStatus } from '@/react/components'

const IFCViewerLoadingMessages: Record<IfcViewerStatus, string> = {
	NOT_INITIALIZED: 'Viewport not initialized',
	FETCHING: 'Fetching file...',
	ERROR_FETCHING: 'Error fetching file',
	LOADING_MESHES: 'Loading meshes...',
	ERROR_LOADING_MESHES: 'Error loading meshes',
	LOADING_PROPERTIES: 'Loading properties...',
	ERROR_LOADING_PROPERTIES: 'Error loading properties',
	PROCESSING: 'Processing data...',
	ERROR_PROCESSING: 'Error Processing data',
	SETTING_DATA: 'Setting data...',
	ERROR_SETTING_DATA: 'Error settings data',
	DONE: 'Done',
	ERROR: 'An error occurred',
}

export { IFCViewerLoadingMessages }
