import { useCallback } from 'react'
import type { ControlsListener, RenderScene, RenderSceneOptions, ViewerRefs } from '../types'
import { disposeObjects } from '@/utils'
import {
	createRenderLoop,
	createResizeObserver,
	createViewerCamera,
	createViewerControls,
	createViewerRenderer,
	populateSceneWithDefaults,
} from '../scene'
import { VIEWER_LAYER_HELPERS, VIEWER_LAYER_MESHES } from '../constants'

type SceneInitializationCallbacks = {
	onResize: () => void
	onFrame: () => void
	onControlsStart: () => void
	onControlsChange: () => void
	onControlsEnd: () => void
}

type UseViewerSceneParams = {
	refs: ViewerRefs
}

type ViewerSceneApi = {
	renderScene: RenderScene
	resetScene: () => void
	initializeScene: (callbacks: SceneInitializationCallbacks) => void
	disposeScene: () => void
}

const useViewerScene = ({ refs }: UseViewerSceneParams): ViewerSceneApi => {
	const renderScene = useCallback<RenderScene>(
		({ updateControls = true }: RenderSceneOptions = {}) => {
			const containerElement = refs.containerRef.current
			const renderer = refs.rendererRef.current
			const camera = refs.cameraRef.current
			const controls = refs.controlsRef.current

			if (!containerElement || !renderer || !camera || !controls) {
				return
			}

			const width = containerElement.clientWidth
			const height = containerElement.clientHeight
			camera.aspect = width / height
			camera.updateProjectionMatrix()
			renderer.setSize(width, height)
			if (updateControls) {
				controls.update()
			}
			renderer.render(refs.sceneRef.current, camera)
		},
		[refs],
	)

	const resetScene = useCallback(() => {
		disposeObjects(refs.sceneRef.current)
		refs.sceneRef.current.children.length = 0
		populateSceneWithDefaults(refs.sceneRef.current, VIEWER_LAYER_HELPERS)
	}, [refs])

	const initializeScene = useCallback(
		({ onResize, onFrame, onControlsStart, onControlsChange, onControlsEnd }: SceneInitializationCallbacks) => {
			if (refs.rendererRef.current) {
				return
			}

			const canvasElement = refs.canvasRef.current
			if (!canvasElement) {
				throw new Error('Canvas not found')
			}

			const renderer = createViewerRenderer(canvasElement)
			refs.rendererRef.current = renderer

			const camera = createViewerCamera(canvasElement, {
				meshes: VIEWER_LAYER_MESHES,
				helpers: VIEWER_LAYER_HELPERS,
			})
			refs.cameraRef.current = camera
			refs.sceneRef.current.add(camera)

			const controls = createViewerControls(camera, renderer)
			refs.controlsRef.current = controls

			const controlsListeners: ControlsListener[] = [
				{ type: 'start', handler: onControlsStart },
				{ type: 'change', handler: onControlsChange },
				{ type: 'end', handler: onControlsEnd },
			]
			for (const listener of controlsListeners) {
				controls.addEventListener(listener.type, listener.handler)
			}
			refs.controlsListenersRef.current = controlsListeners

			refs.rayCasterRef.current.layers.set(VIEWER_LAYER_MESHES)

			const containerElement = refs.containerRef.current
			if (!containerElement) {
				throw new Error('Container not found')
			}

			refs.resizeObserverRef.current = createResizeObserver(containerElement, onResize)

			resetScene()

			const renderLoop = createRenderLoop(() => {
				if (!refs.renderingEnabledRef.current) {
					return
				}
				onFrame()
			})
			renderLoop.start()
			refs.renderLoopRef.current = renderLoop
		},
		[refs, resetScene],
	)

	const disposeScene = useCallback(() => {
		refs.boundingSphereMeshRef.current = undefined
		disposeObjects(refs.sceneRef.current)
		refs.renderLoopRef.current?.stop()
		refs.renderLoopRef.current = undefined
		refs.resizeObserverRef.current?.disconnect()
		refs.rendererRef.current?.dispose()
		refs.rendererRef.current = undefined
		const controls = refs.controlsRef.current
		if (controls) {
			for (const listener of refs.controlsListenersRef.current) {
				controls.removeEventListener(listener.type, listener.handler)
			}
			refs.controlsListenersRef.current = []
		}
		refs.cameraRef.current = undefined
		refs.controlsRef.current = undefined
	}, [refs])

	return {
		renderScene,
		resetScene,
		initializeScene,
		disposeScene,
	}
}

export { useViewerScene }
