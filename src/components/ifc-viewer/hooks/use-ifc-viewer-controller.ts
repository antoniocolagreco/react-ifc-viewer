'use client'

import {
	useCallback,
	useEffect,
	useState,
	type CSSProperties,
	type MouseEvent,
	type ReactElement,
	type ReactNode,
} from 'react'
import { useGlobalState } from '@/hooks/use-global-state'
import { useThrottle } from '@/hooks/use-throttle'
import { isRunningInBrowser } from '@/utils'
import type { IfcAnchorProps } from '@/components/ifc-anchor'
import type { IfcLoadingStatus, IfcViewerProps, MutableRef } from '../types'
import { useViewerRefs } from './use-viewer-refs'
import { useViewerScene } from './use-viewer-scene'
import { useViewerSelection } from './use-viewer-selection'
import { useViewerAnchors } from './use-viewer-anchors'
import { useViewerInteractions } from './use-viewer-interactions'
import { useViewerLoader } from './use-viewer-loader'

type UseIfcViewerControllerResult = {
	containerRef: MutableRef<HTMLDivElement | null>
	canvasRef: MutableRef<HTMLCanvasElement | null>
	cursorStyle: CSSProperties
	anchors: ReactElement<IfcAnchorProps>[] | undefined
	viewerChildren: ReactNode[] | undefined
	debouncedProgress: IfcLoadingStatus
	handleMouseDown: (event: MouseEvent<HTMLCanvasElement>) => void
	handleMouseUp: (event: MouseEvent<HTMLCanvasElement>) => void
	handleMouseMove: (event: MouseEvent<HTMLCanvasElement>) => void
	handleMouseLeave: () => void
}

const useIfcViewerController = (props: IfcViewerProps): UseIfcViewerControllerResult => {
	const {
		url,
		data,
		hoverColor,
		selectedColor,
		onModelLoaded,
		links: linkRequirements,
		selectable: selectableRequirements,
		alwaysVisible: alwaysVisibleRequirements,
		onMeshHover,
		onMeshSelect,
		enableMeshHover = false,
		enableMeshSelection = false,
		showBoundingSphere = false,
		children,
		ref,
	} = props

	const refs = useViewerRefs()

	useEffect(() => {
		if (!ref) {
			return
		}
		if (typeof ref === 'function') {
			ref(refs.containerRef.current)
			return
		}
		ref.current = refs.containerRef.current
	}, [ref, refs.containerRef])

	const [loadingProgress, setLoadingProgress] = useState<IfcLoadingStatus>({ status: 'NOT_INITIALIZED' })
	const debouncedProgress = useThrottle(loadingProgress, 50)

	const { renderScene, resetScene, initializeScene, disposeScene } = useViewerScene({ refs })

	const {
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
	} = useViewerSelection({
		refs,
		renderScene,
		showBoundingSphere,
		hoverColor,
		selectedColor,
		onMeshSelect,
		onMeshHover,
	})

	const { anchors, viewerChildren, processChildren, updateAnchors, scheduleAnchorsUpdate } = useViewerAnchors({
		refs,
		children,
		select,
		hover,
	})

	const { handleMouseDown, handleMouseUp, handleMouseMove, handleMouseLeave } = useViewerInteractions({
		refs,
		renderScene,
		updateAnchors,
		enableMeshSelection,
		enableMeshHover,
		selectableRequirements,
		select,
		hover,
	})

	const { loadFile } = useViewerLoader({
		refs,
		url,
		data,
		alwaysVisibleRequirements,
		selectableRequirements,
		linksRequirements: linkRequirements,
		onModelLoaded,
		renderScene,
		resetScene,
		resetView,
		setLoadingProgress,
	})

	useEffect(() => {
		updateAllMeshesDisplay()
		renderScene()
	}, [renderScene, updateAllMeshesDisplay])

	useEffect(() => {
		processChildren()
		updateAnchors()
	}, [processChildren, updateAnchors])

	const fitViewAndRefreshAnchors = useCallback(() => {
		fitView()
		updateAnchors()
	}, [fitView, updateAnchors])

	const focusViewAndRefreshAnchors = useCallback(() => {
		focusView()
		updateAnchors()
	}, [focusView, updateAnchors])

	const resetViewAndRefreshAnchors = useCallback(() => {
		resetView()
		updateAnchors()
	}, [resetView, updateAnchors])

	const { setGlobalState } = useGlobalState()

	const updateGlobalState = useCallback(() => {
		const model = refs.modelRef.current
		setGlobalState({
			viewPort: {
				focusView: focusViewAndRefreshAnchors,
				fitView: fitViewAndRefreshAnchors,
				resetView: resetViewAndRefreshAnchors,
				changeViewMode,
				viewMode,
			},
			loadingProgress: debouncedProgress,
			model,
			selectableElements: model?.getAllSeletableElements(),
			selectByProperty,
			selectByExpressId,
			getElementByExpressId: model?.getIfcElement,
			getElementsWithData: model?.getAllElementsWithPropertiesOrValues,
			renderScene,
			updateAnchors,
		})
	}, [
		changeViewMode,
		debouncedProgress,
		focusViewAndRefreshAnchors,
		fitViewAndRefreshAnchors,
		resetViewAndRefreshAnchors,
		renderScene,
		selectByExpressId,
		selectByProperty,
		setGlobalState,
		updateAnchors,
		viewMode,
		refs.modelRef,
	])

	useEffect(() => {
		updateGlobalState()
	}, [updateGlobalState])

	useEffect(() => {
		if (!isRunningInBrowser()) {
			return
		}

		initializeScene({
			onResize: () => {
				renderScene()
				updateAnchors()
			},
			onFrame: () => {
				renderScene()
			},
			onControlsStart: () => {
				renderScene({ updateControls: false })
				updateAnchors()
			},
			onControlsChange: () => {
				renderScene({ updateControls: false })
				scheduleAnchorsUpdate()
			},
			onControlsEnd: () => {
				renderScene({ updateControls: false })
				updateAnchors()
			},
		})
	}, [initializeScene, renderScene, scheduleAnchorsUpdate, updateAnchors])

	const currentLoadedUrlRef = refs.currentLoadedUrlRef

	useEffect(() => {
		if (!isRunningInBrowser()) {
			return
		}

		const hydrateAnchors = () => {
			processChildren()
			updateAnchors()
		}

		if (currentLoadedUrlRef.current !== url) {
			currentLoadedUrlRef.current = url
			void loadFile().then(hydrateAnchors)
			return
		}

		hydrateAnchors()
	}, [currentLoadedUrlRef, loadFile, processChildren, updateAnchors, url])

	useEffect(() => {
		return () => {
			disposeScene()
		}
	}, [disposeScene])

	return {
		containerRef: refs.containerRef,
		canvasRef: refs.canvasRef,
		cursorStyle,
		anchors,
		viewerChildren,
		debouncedProgress,
		handleMouseDown,
		handleMouseUp,
		handleMouseMove,
		handleMouseLeave,
	}
}

export { useIfcViewerController }
