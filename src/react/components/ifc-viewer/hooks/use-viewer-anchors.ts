import type { IfcElement } from '@/core/models'
import type { IfcInstanceRecord, IfcMarkerLink } from '@/core/types'
import {
	filterIfcElementsByPropertiesAndType,
	getGroupPosition,
	isFragment,
	isIfcMarker,
	transformViewportPositionToScreenPosition,
} from '@/core/utils'
import { type IfcOverlayProps } from '@/react/components'
import type { IfcPosition } from '@/react/components/ifc-viewer/types'
import { IfcAnchor, type IfcAnchorProps } from '@/react/components/ifc-anchor'
import {
	Children,
	createElement,
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactElement,
	type ReactNode,
} from 'react'
import type { ViewerRefs } from '../types'

type UseViewerAnchorsParams = {
	refs: ViewerRefs
	children: ReactNode
	select: (ifcElement?: IfcElement, instanceRecord?: IfcInstanceRecord) => void
	hover: (ifcElement?: IfcElement, instanceRecord?: IfcInstanceRecord) => void
}

type ViewerAnchorsApi = {
	anchors: ReactElement<IfcAnchorProps>[] | undefined
	viewerChildren: ReactNode[] | undefined
	processChildren: () => void
	updateAnchors: () => void
	scheduleAnchorsUpdate: () => void
}

const MATRIX_ELEMENTS = 16
const MATRIX_EPSILON = 1e-4

const createMarkerSignature = (markerLinks: IfcMarkerLink[]): string => {
	if (markerLinks.length === 0) {
		return ''
	}
	return markerLinks.map(link => link.element.userData.expressId).join('|')
}

const areMatrixElementsEqual = (previous: Float32Array | undefined, next: ArrayLike<number>): boolean => {
	if (!previous) {
		return false
	}
	for (let index = 0; index < MATRIX_ELEMENTS; index += 1) {
		const difference = (previous[index] ?? 0) - (next[index] ?? 0)
		if (Math.abs(difference) > MATRIX_EPSILON) {
			return false
		}
	}
	return true
}

const useViewerAnchors = ({ refs, children, select, hover }: UseViewerAnchorsParams): ViewerAnchorsApi => {
	const [anchors, setAnchors] = useState<ReactElement<IfcAnchorProps>[]>()
	const [viewerChildren, setViewerChildren] = useState<ReactNode[]>()
	const anchorAnimationFrameRef = useRef<number | undefined>(undefined)
	// Cache screen projections and camera state so anchors only recompute when something truly changes.
	const screenPositionCacheRef = useRef<Map<number, IfcPosition>>(new Map())
	const anchorStateRef = useRef<
		| {
				cameraMatrix: Float32Array
				viewportWidth: number
				viewportHeight: number
				signature: string
		  }
		| undefined
	>(undefined)

	const processIfcMarker = useCallback(
		(markerElement: ReactElement<IfcOverlayProps>): IfcMarkerLink[] => {
			const model = refs.modelRef.current
			if (!model) {
				return []
			}

			const markerRequirements = markerElement.props.requirements
			const overlayProps = markerElement.props

			const ifcElements = filterIfcElementsByPropertiesAndType(
				model,
				markerRequirements.properties,
				markerRequirements.type,
				markerRequirements.tag,
				markerRequirements.expressId,
			)

			return ifcElements.map(ifcElement => ({
				element: ifcElement,
				props: overlayProps,
				worldPosition: getGroupPosition(ifcElement, model),
			}))
		},
		[refs],
	)

	const processChildren = useCallback(() => {
		const nextMarkerLinks: IfcMarkerLink[] = []
		const nextChildren: ReactNode[] = []

		const childrenStack = Children.toArray(children)

		while (childrenStack.length > 0) {
			const child = childrenStack.pop()
			if (!child) {
				continue
			}

			if (isFragment(child)) {
				childrenStack.push(...Children.toArray(child.props.children))
				continue
			}

			if (isIfcMarker(child)) {
				nextMarkerLinks.push(...processIfcMarker(child))
				continue
			}

			nextChildren.push(child)
		}

		refs.ifcMarkerLinksRef.current = nextMarkerLinks
		screenPositionCacheRef.current.clear()
		anchorStateRef.current = undefined
		setViewerChildren(nextChildren)
	}, [children, processIfcMarker, refs])

	const updateAnchors = useCallback(() => {
		const camera = refs.cameraRef.current
		const renderer = refs.rendererRef.current
		if (!camera || !renderer) {
			return
		}

		const markerLinks = refs.ifcMarkerLinksRef.current
		const viewportWidth = renderer.domElement.clientWidth
		const viewportHeight = renderer.domElement.clientHeight
		const markerSignature = createMarkerSignature(markerLinks)
		const cameraMatrixElements = camera.matrixWorld.elements

		const previousState = anchorStateRef.current
		const cameraChanged = !areMatrixElementsEqual(previousState?.cameraMatrix, cameraMatrixElements)
		const viewportChanged =
			!previousState ||
			previousState.viewportWidth !== viewportWidth ||
			previousState.viewportHeight !== viewportHeight
		const markersChanged = !previousState || previousState.signature !== markerSignature

		if (!cameraChanged && !viewportChanged && !markersChanged) {
			return
		}

		const screenPositions = screenPositionCacheRef.current
		const processedExpressIds = new Set<number>()
		const nextAnchors: ReactElement<IfcAnchorProps>[] = []

		for (const [markerIndex, markerLink] of markerLinks.entries()) {
			const { element, props, worldPosition } = markerLink
			const expressId = element.userData.expressId
			let position = screenPositions.get(expressId)
			if (!position) {
				position = { x: 0, y: 0 }
				screenPositions.set(expressId, position)
			}

			transformViewportPositionToScreenPosition(camera, renderer, worldPosition, position)
			processedExpressIds.add(expressId)

			nextAnchors.push(
				createElement(
					IfcAnchor,
					{
						key: markerIndex,
						position,
						onSelect: () => {
							select(element)
							if (!props.onSelect) {
								return
							}
							props.onSelect(element.userData)
						},
						onHover: () => {
							hover(element)
							if (!props.onHover) {
								return
							}
							props.onHover(element.userData)
						},
					},
					props.children,
				),
			)
		}

		for (const expressId of Array.from(screenPositions.keys())) {
			if (!processedExpressIds.has(expressId)) {
				screenPositions.delete(expressId)
			}
		}

		if (!previousState) {
			anchorStateRef.current = {
				cameraMatrix: Float32Array.from(cameraMatrixElements),
				viewportWidth,
				viewportHeight,
				signature: markerSignature,
			}
		} else {
			previousState.cameraMatrix.set(cameraMatrixElements)
			previousState.viewportWidth = viewportWidth
			previousState.viewportHeight = viewportHeight
			previousState.signature = markerSignature
		}

		setAnchors(nextAnchors)
	}, [hover, refs, select])

	const scheduleAnchorsUpdate = useCallback(() => {
		if (typeof window === 'undefined') {
			return
		}
		if (anchorAnimationFrameRef.current !== undefined) {
			return
		}
		anchorAnimationFrameRef.current = requestAnimationFrame(() => {
			anchorAnimationFrameRef.current = undefined
			updateAnchors()
		})
	}, [updateAnchors])

	useEffect(() => {
		return () => {
			if (typeof window === 'undefined') {
				return
			}
			if (anchorAnimationFrameRef.current !== undefined) {
				cancelAnimationFrame(anchorAnimationFrameRef.current)
				anchorAnimationFrameRef.current = undefined
			}
		}
	}, [])

	useEffect(() => {
		processChildren()
	}, [processChildren])

	return {
		anchors,
		viewerChildren,
		processChildren,
		updateAnchors,
		scheduleAnchorsUpdate,
	}
}

export { useViewerAnchors }
