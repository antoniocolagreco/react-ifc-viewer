import { useCallback, useState, type CSSProperties } from 'react'
import { Sphere } from 'three'
import type { IfcElement } from '@/core/models'
import type { IfcInstanceRecord, Property } from '@/core/types'
import {
	createBoundingSphere,
	createBoundingSphereFromElement,
	createBoundingSphereFromInstanceRecord,
	createSphereMesh,
	filterIfcElementsByPropertiesAndType,
	fitBoundingSphere,
	setMaterialToDefault,
	setMaterialToHidden,
	setMaterialToHovered,
	setMaterialToSelected,
	setMaterialToTransparent,
} from '@/core/utils'
import type { IfcViewMode, RenderScene, ViewerRefs } from '../types'
import { VIEWER_LAYER_HELPERS } from '../constants'

type UseViewerSelectionParams = {
	refs: ViewerRefs
	renderScene: RenderScene
	showBoundingSphere: boolean
	hoverColor?: number
	selectedColor?: number
	onMeshSelect?: (ifcElement?: IfcElement) => void
	onMeshHover?: (ifcElement?: IfcElement) => void
}

type ViewerSelectionApi = {
	cursorStyle: CSSProperties
	viewMode: IfcViewMode
	changeViewMode: (mode?: IfcViewMode) => void
	updateAllMeshesDisplay: () => void
	select: (ifcElement?: IfcElement, instanceRecord?: IfcInstanceRecord) => void
	hover: (ifcElement?: IfcElement, instanceRecord?: IfcInstanceRecord) => void
	fitView: () => void
	focusView: () => void
	resetView: () => void
	selectByExpressId: (expressId: number | undefined) => void
	selectByProperty: (property: Property | undefined) => IfcElement | undefined
}

const useViewerSelection = ({
	refs,
	renderScene,
	showBoundingSphere,
	hoverColor,
	selectedColor,
	onMeshSelect,
	onMeshHover,
}: UseViewerSelectionParams): ViewerSelectionApi => {
	const [viewMode, setViewMode] = useState<IfcViewMode>('VIEW_MODE_ALL')
	const [cursorStyle, setCursorStyle] = useState<CSSProperties>({ cursor: 'default' })

	const updateBoundingSphere = useCallback(() => {
		const model = refs.modelRef.current
		if (!model) {
			return
		}

		const selectedInstanceRecord = refs.selectedInstanceRecordRef.current
		const selectedElement = refs.selectedIfcElementRef.current

		let boundingSphere: Sphere
		if (selectedInstanceRecord) {
			boundingSphere = createBoundingSphereFromInstanceRecord(selectedInstanceRecord, model)
		} else if (selectedElement) {
			boundingSphere = createBoundingSphereFromElement(selectedElement, model)
		} else {
			const meshes = model.getAllMeshes()
			boundingSphere = meshes.length === 0 ? new Sphere() : createBoundingSphere(meshes)
		}

		refs.boundingSphereRef.current = boundingSphere

		if (!showBoundingSphere) {
			return
		}

		if (refs.boundingSphereMeshRef.current) {
			refs.sceneRef.current.remove(refs.boundingSphereMeshRef.current)
		}

		const sphereMesh = createSphereMesh(boundingSphere)
		sphereMesh.layers.set(VIEWER_LAYER_HELPERS)
		refs.boundingSphereMeshRef.current = sphereMesh
		refs.sceneRef.current.add(sphereMesh)
	}, [refs, showBoundingSphere])

	const updateMeshDisplay = useCallback(
		(ifcElement: IfcElement) => {
			const model = refs.modelRef.current
			if (!model) {
				return
			}

			if (ifcElement === refs.selectedIfcElementRef.current) {
				setMaterialToSelected(ifcElement, model, selectedColor)
				return
			}
			if (ifcElement === refs.hoveredIfcElementRef.current) {
				setMaterialToHovered(ifcElement, model, hoverColor)
				return
			}

			switch (viewMode) {
				case 'VIEW_MODE_ALL': {
					setMaterialToDefault(ifcElement, model)
					return
				}
				case 'VIEW_MODE_TRANSPARENT': {
					if (ifcElement.userData.alwaysVisible || ifcElement.userData.selectable) {
						setMaterialToDefault(ifcElement, model)
						return
					}
					setMaterialToTransparent(ifcElement, model)
					return
				}
				case 'VIEW_MODE_SELECTABLE': {
					if (ifcElement.userData.alwaysVisible || ifcElement.userData.selectable) {
						setMaterialToDefault(ifcElement, model)
						return
					}
					setMaterialToHidden(ifcElement, model)
					return
				}
			}
		},
		[hoverColor, refs, selectedColor, viewMode],
	)

	const updateAllMeshesDisplay = useCallback(() => {
		const model = refs.modelRef.current
		if (!model) {
			return
		}
		for (const ifcElement of model.getElements()) {
			updateMeshDisplay(ifcElement)
		}
	}, [refs, updateMeshDisplay])

	const switchSelectedMesh = useCallback(() => {
		if (refs.previousSelectedIfcElementRef.current) {
			updateMeshDisplay(refs.previousSelectedIfcElementRef.current)
		}
		if (refs.selectedIfcElementRef.current) {
			updateMeshDisplay(refs.selectedIfcElementRef.current)
		}
	}, [refs, updateMeshDisplay])

	const switchHoveredMesh = useCallback(() => {
		if (refs.previousHoveredIfcElementRef.current) {
			updateMeshDisplay(refs.previousHoveredIfcElementRef.current)
		}
		if (refs.hoveredIfcElementRef.current) {
			updateMeshDisplay(refs.hoveredIfcElementRef.current)
		}
	}, [refs, updateMeshDisplay])

	const select = useCallback(
		(ifcElement?: IfcElement, instanceRecord?: IfcInstanceRecord) => {
			refs.previousSelectedIfcElementRef.current = refs.selectedIfcElementRef.current
			refs.selectedIfcElementRef.current = ifcElement
			refs.selectedInstanceRecordRef.current = instanceRecord
			updateBoundingSphere()
			switchSelectedMesh()
			renderScene()

			if (ifcElement && onMeshSelect) {
				onMeshSelect(ifcElement)
			}
		},
		[onMeshSelect, renderScene, switchSelectedMesh, updateBoundingSphere, refs],
	)

	const hover = useCallback(
		(ifcElement?: IfcElement, _instanceRecord?: IfcInstanceRecord) => {
			void _instanceRecord
			refs.previousHoveredIfcElementRef.current = refs.hoveredIfcElementRef.current
			refs.hoveredIfcElementRef.current = ifcElement

			switchHoveredMesh()
			renderScene()

			if (refs.hoveredIfcElementRef.current) {
				setCursorStyle({ cursor: 'pointer' })
			} else {
				setCursorStyle({ cursor: 'default' })
			}

			if (ifcElement && onMeshHover) {
				onMeshHover(ifcElement)
			}
		},
		[onMeshHover, renderScene, switchHoveredMesh, refs],
	)

	const fitView = useCallback(() => {
		if (!refs.boundingSphereRef.current) {
			return
		}
		const camera = refs.cameraRef.current
		const controls = refs.controlsRef.current
		if (!camera) {
			throw new Error('Camera not found')
		}
		if (!controls) {
			throw new Error('Controls not found')
		}
		fitBoundingSphere(refs.boundingSphereRef.current, camera, controls)
		renderScene()
	}, [refs, renderScene])

	const focusView = useCallback(() => {
		const boundingSphere = refs.boundingSphereRef.current
		const controls = refs.controlsRef.current
		if (!boundingSphere) {
			return
		}
		if (!controls) {
			throw new Error('Controls not found')
		}
		controls.target.copy(boundingSphere.center)
		renderScene()
	}, [refs, renderScene])

	const resetView = useCallback(() => {
		const camera = refs.cameraRef.current
		const controls = refs.controlsRef.current
		if (!camera || !controls) {
			return
		}
		select()
		updateBoundingSphere()
		if (refs.boundingSphereRef.current) {
			camera.position.set(10, 20, 20)
			fitBoundingSphere(refs.boundingSphereRef.current, camera, controls)
		}
		renderScene()
	}, [refs, renderScene, select, updateBoundingSphere])

	const selectByExpressId = useCallback(
		(expressId: number | undefined) => {
			const model = refs.modelRef.current
			if (!model || !expressId) {
				select()
				return
			}

			const ifcElement = model.getIfcElement(expressId)
			const instanceRecord = ifcElement?.getInstanceRecords()[0]
			select(ifcElement, instanceRecord)
		},
		[refs, select],
	)

	const selectByProperty = useCallback(
		(property: Property | undefined) => {
			const model = refs.modelRef.current
			if (!model || !property) {
				select()
				return
			}

			const foundElements = filterIfcElementsByPropertiesAndType(model, [property])
			if (foundElements.length === 0) {
				return
			}
			const [foundElement] = foundElements
			if (!foundElement) {
				return
			}
			const instanceRecord = foundElement.getInstanceRecords()[0]
			select(foundElement, instanceRecord)
			fitView()
			return foundElement
		},
		[fitView, refs, select],
	)

	const changeViewMode = useCallback((mode?: IfcViewMode) => {
		setViewMode(currentMode => {
			if (mode) {
				return mode
			}
			switch (currentMode) {
				case 'VIEW_MODE_SELECTABLE': {
					return 'VIEW_MODE_ALL'
				}
				case 'VIEW_MODE_ALL': {
					return 'VIEW_MODE_TRANSPARENT'
				}
				case 'VIEW_MODE_TRANSPARENT': {
					return 'VIEW_MODE_SELECTABLE'
				}
			}
		})
	}, [])

	return {
		cursorStyle,
		viewMode,
		changeViewMode,
		updateAllMeshesDisplay,
		select,
		hover,
		fitView,
		focusView,
		resetView,
		selectByExpressId,
		selectByProperty,
	}
}

export { useViewerSelection }
