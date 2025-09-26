import type { IfcElement, IfcModel } from '@/core/models'
import type { IfcElementData, IfcElementLink, Requirements, SelectableRequirements } from '@/core/types'
import type { ComponentPropsWithRef } from 'react'

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

type IfcViewerProps = ComponentPropsWithRef<'div'> & {
	url: string
	data?: IfcElementData[]

	onModelLoaded?: (model: IfcModel) => void

	hoverColor?: number
	selectedColor?: number

	links?: IfcElementLink[]
	selectable?: SelectableRequirements[]
	alwaysVisible?: Requirements[]

	highlightedSelectables?: SelectableRequirements[]

	onMeshSelect?: (ifcElement?: IfcElement) => void
	onMeshHover?: (ifcElement?: IfcElement) => void

	enableMeshSelection?: boolean
	enableMeshHover?: boolean
	showBoundingSphere?: boolean
}

export type { IfcLoadingStatus, IfcMouseState, IfcPosition, IfcViewerProps, IfcViewerStatus, IfcViewMode }
