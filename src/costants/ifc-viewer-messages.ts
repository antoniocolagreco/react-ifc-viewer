import type { IfcViewerStatus } from '@/components/ifc-viewer/types'

const IFCViewerLoadingMessages: Record<IfcViewerStatus, string> = {
	NOT_INITIALIZED: 'Viewer not initialized',
	FETCHING_PROGRESS: 'Fetching file...',
	FETCHING_ERROR: 'Error fetching file',
	LOADING_MESHES_PROGRESS: 'Loading meshes...',
	LOADING_MESHES_ERROR: 'Error loading meshes',
	LOADING_PROPERTIES_PROGRESS: 'Loading properties...',
	LOADING_PROPERTIES_ERROR: 'Error loading properties',
	PROCESSING_PROGRESS: 'Processing data...',
	PROCESSING_ERROR: 'Error Processing data',
	RESTORING_DATA_PROGRESS: 'Restoring data...',
	RESTORING_DATA_ERROR: 'Error restoring data',
	READY: 'Ready',
	INITIALIZING_VIEWPORT: 'Initializing viewport...',
	GENERIC_ERROR: 'An error occurred',
}

export { IFCViewerLoadingMessages }
