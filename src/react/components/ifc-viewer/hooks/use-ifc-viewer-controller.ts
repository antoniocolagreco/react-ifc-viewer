'use client'

import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type CSSProperties,
	type MouseEvent,
	type ReactElement,
	type ReactNode,
} from 'react'
import { useGlobalState } from '@/react/hooks/use-global-state'
import { useThrottle } from '@/react/hooks/use-throttle'
import { isRunningInBrowser } from '@/core/utils'
import type { IfcAnchorProps } from '@/react/components/ifc-anchor'
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

	const { loadFile, cancelLoading } = useViewerLoader({
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

	const latestCallbacksRef = useRef({
		renderScene,
		updateAnchors,
		scheduleAnchorsUpdate,
		processChildren,
		updateAllMeshesDisplay,
	})

	useEffect(() => {
		latestCallbacksRef.current = {
			renderScene,
			updateAnchors,
			scheduleAnchorsUpdate,
			processChildren,
			updateAllMeshesDisplay,
		}
	})

	useEffect(() => {
		if (!isRunningInBrowser()) {
			return
		}

		const latestCallbacks = latestCallbacksRef

		initializeScene({
			onResize: () => {
				latestCallbacks.current.renderScene()
				latestCallbacks.current.updateAnchors()
			},
			onFrame: () => {
				latestCallbacks.current.renderScene()
			},
			onControlsStart: () => {
				latestCallbacks.current.renderScene({ updateControls: false })
				latestCallbacks.current.updateAnchors()
			},
			onControlsChange: () => {
				latestCallbacks.current.renderScene({ updateControls: false })
				latestCallbacks.current.scheduleAnchorsUpdate()
			},
			onControlsEnd: () => {
				latestCallbacks.current.renderScene({ updateControls: false })
				latestCallbacks.current.updateAnchors()
			},
		})
	}, [initializeScene])

	const currentLoadedUrlRef = refs.currentLoadedUrlRef

	useEffect(() => {
		if (!isRunningInBrowser()) {
			return
		}

		if (currentLoadedUrlRef.current !== url) {
			currentLoadedUrlRef.current = url
			const latestCallbacks = latestCallbacksRef
			loadFile()
				.then(loaded => {
					if (!loaded) {
						return
					}
					latestCallbacks.current.updateAllMeshesDisplay()
					latestCallbacks.current.processChildren()
					latestCallbacks.current.updateAnchors()
					latestCallbacks.current.renderScene()
				})
				.catch((error: unknown) => {
					console.error(error)
				})
			return
		}

		processChildren()
		updateAnchors()
	}, [currentLoadedUrlRef, loadFile, processChildren, updateAnchors, url])

	useEffect(() => {
		return () => {
			cancelLoading()
			disposeScene()
			currentLoadedUrlRef.current = ''
		}
	}, [cancelLoading, currentLoadedUrlRef, disposeScene])

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
