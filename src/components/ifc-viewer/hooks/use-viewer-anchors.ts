import { Children, createElement, useCallback, useEffect, useState, type ReactElement, type ReactNode } from 'react'
import type { IfcElement } from '@/classes'
import { type IfcOverlayProps } from '@/components'
import { IfcAnchor, type IfcAnchorProps } from '@/components/ifc-anchor'
import type { IfcMarkerLink } from '@/types'
import {
	filterIfcElementsByPropertiesAndType,
	getGroupPosition,
	isFragment,
	isIfcMarker,
	transformViewportPositionToScreenPosition,
} from '@/utils'
import type { ViewerRefs } from '../types'

type UseViewerAnchorsParams = {
	refs: ViewerRefs
	children: ReactNode
	select: (ifcElement?: IfcElement) => void
	hover: (ifcElement?: IfcElement) => void
}

type ViewerAnchorsApi = {
	anchors: ReactElement<IfcAnchorProps>[] | undefined
	viewerChildren: ReactNode[] | undefined
	processChildren: () => void
	updateAnchors: () => void
}

const useViewerAnchors = ({ refs, children, select, hover }: UseViewerAnchorsParams): ViewerAnchorsApi => {
	const [anchors, setAnchors] = useState<ReactElement<IfcAnchorProps>[]>()
	const [viewerChildren, setViewerChildren] = useState<ReactNode[]>()

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

			return ifcElements.map(ifcElement => ({ element: ifcElement, props: overlayProps }))
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
		setViewerChildren(nextChildren)
	}, [children, processIfcMarker, refs])

	const updateAnchors = useCallback(() => {
		const camera = refs.cameraRef.current
		const renderer = refs.rendererRef.current
		const model = refs.modelRef.current
		if (!camera || !renderer || !model) {
			return
		}

		const nextAnchors: ReactElement<IfcAnchorProps>[] = []

		const markerLinks = refs.ifcMarkerLinksRef.current
		for (const [index, markerLink] of markerLinks.entries()) {
			const { element, props } = markerLink

			const ifcElementPosition = getGroupPosition(element, model)
			const position = transformViewportPositionToScreenPosition(camera, renderer, ifcElementPosition)

			nextAnchors.push(
				createElement(
					IfcAnchor,
					{
						key: index,
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

		setAnchors(nextAnchors)
	}, [hover, refs, select])

	useEffect(() => {
		processChildren()
	}, [processChildren])

	return {
		anchors,
		viewerChildren,
		processChildren,
		updateAnchors,
	}
}

export { useViewerAnchors }
