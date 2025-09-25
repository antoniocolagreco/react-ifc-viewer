import { useCallback } from 'react'
import { IfcMesh, type IfcElement } from '@/classes'
import type { IfcInstanceRecord, SelectableRequirements } from '@/types'
import type { ViewerRefs, SelectableIntersection, RenderScene } from '../types'
import type { MouseEvent } from 'react'

const isSelectableElementAllowed = (
	selectableRequirements: SelectableRequirements[] | undefined,
	ifcElement: IfcElement | undefined,
): boolean => {
	if (!selectableRequirements || selectableRequirements.length === 0 || !ifcElement) {
		return true
	}
	return ifcElement.isSelectable()
}

type UseViewerInteractionsParams = {
	refs: ViewerRefs
	renderScene: RenderScene
	updateAnchors: () => void
	enableMeshSelection: boolean
	enableMeshHover: boolean
	selectableRequirements?: SelectableRequirements[]
	select: (ifcElement?: IfcElement, instanceRecord?: IfcInstanceRecord) => void
	hover: (ifcElement?: IfcElement, instanceRecord?: IfcInstanceRecord) => void
}

type ViewerInteractionsApi = {
	handleMouseDown: (event: MouseEvent<HTMLCanvasElement>) => void
	handleMouseUp: (event: MouseEvent<HTMLCanvasElement>) => void
	handleMouseMove: (event: MouseEvent<HTMLCanvasElement>) => void
	handleMouseLeave: () => void
}

const useViewerInteractions = ({
	refs,
	renderScene,
	updateAnchors,
	enableMeshSelection,
	enableMeshHover,
	selectableRequirements,
	select,
	hover,
}: UseViewerInteractionsParams): ViewerInteractionsApi => {
	const updateMousePointer = useCallback(
		(event: MouseEvent) => {
			const canvasElement = refs.canvasRef.current
			if (!canvasElement) {
				throw new Error('Canvas not loaded')
			}

			const boundingRect = canvasElement.getBoundingClientRect()
			const pointerX = event.clientX - boundingRect.left
			const pointerY = event.clientY - boundingRect.top

			refs.pointerRef.current.x = (pointerX / canvasElement.clientWidth) * 2 - 1
			refs.pointerRef.current.y = -(pointerY / canvasElement.clientHeight) * 2 + 1
		},
		[refs],
	)

	const updateIntersections = useCallback(() => {
		const camera = refs.cameraRef.current
		if (!camera) {
			throw new Error('Camera not found')
		}

		const model = refs.modelRef.current
		if (!model) {
			refs.selectableIntersectionsRef.current = []
			return
		}

		refs.rayCasterRef.current.setFromCamera(refs.pointerRef.current, camera)
		const intersections = refs.rayCasterRef.current.intersectObjects(refs.sceneRef.current.children, true)

		const selectableIntersections: SelectableIntersection[] = []
		for (const intersection of intersections) {
			if (!(intersection.object instanceof IfcMesh)) {
				continue
			}
			const instanceId = intersection.instanceId
			if (typeof instanceId !== 'number') {
				continue
			}
			const instanceRecord = model.getInstanceRecord(intersection.object, instanceId)
			if (!instanceRecord) {
				continue
			}
			const element = instanceRecord.element
			if (!element.isSelectable()) {
				continue
			}
			selectableIntersections.push({
				element,
				instance: instanceRecord,
				intersection: intersection as SelectableIntersection['intersection'],
			})
		}

		refs.selectableIntersectionsRef.current = selectableIntersections
	}, [refs])

	const handleMouseLeave = useCallback(() => {
		hover()
	}, [hover])

	const handleMouseDown = useCallback(
		(event: MouseEvent<HTMLCanvasElement>) => {
			refs.mouseStatusRef.current = { clicked: true, x: event.clientX, y: event.clientY }
			refs.renderingEnabledRef.current = true
		},
		[refs],
	)

	const handleMouseUp = useCallback(
		(event: MouseEvent<HTMLCanvasElement>) => {
			refs.renderingEnabledRef.current = false
			if (!refs.mouseStatusRef.current.clicked) {
				return
			}

			const { x: originX, y: originY } = refs.mouseStatusRef.current
			const currentX = event.clientX
			const currentY = event.clientY

			refs.mouseStatusRef.current = { clicked: false, x: 0, y: 0 }

			if (Math.abs(currentX - originX) > 8 || Math.abs(currentY - originY) > 8) {
				return
			}

			if (!enableMeshSelection) {
				return
			}

			updateMousePointer(event)
			updateIntersections()

			if (refs.selectableIntersectionsRef.current.length === 0) {
				select()
				return
			}

			const [firstSelectable] = refs.selectableIntersectionsRef.current
			const ifcElement = firstSelectable?.element
			const instanceRecord = firstSelectable?.instance

			if (!isSelectableElementAllowed(selectableRequirements, ifcElement)) {
				select()
				return
			}

			select(ifcElement, instanceRecord)
			renderScene()
			updateAnchors()
		},
		[
			enableMeshSelection,
			renderScene,
			select,
			selectableRequirements,
			updateAnchors,
			updateIntersections,
			updateMousePointer,
			refs,
		],
	)

	const handleMouseMove = useCallback(
		(event: MouseEvent<HTMLCanvasElement>) => {
			refs.renderingEnabledRef.current = true
			if (refs.renderingTimeoutRef.current) {
				clearTimeout(refs.renderingTimeoutRef.current)
			}
			refs.renderingTimeoutRef.current = setTimeout(() => {
				refs.renderingEnabledRef.current = false
			}, 1000)

			if (!enableMeshHover) {
				return
			}

			updateMousePointer(event)
			updateIntersections()

			const [firstSelectable] = refs.selectableIntersectionsRef.current
			const ifcElement = firstSelectable?.element
			const instanceRecord = firstSelectable?.instance

			if (!isSelectableElementAllowed(selectableRequirements, ifcElement)) {
				hover()
				return
			}

			hover(ifcElement, instanceRecord)
		},
		[enableMeshHover, hover, selectableRequirements, updateIntersections, updateMousePointer, refs],
	)

	return {
		handleMouseDown,
		handleMouseUp,
		handleMouseMove,
		handleMouseLeave,
	}
}

export { useViewerInteractions }
