import { useMemo, useRef } from 'react'
import { Raycaster, Scene, Sphere, Vector2, type PerspectiveCamera, type WebGLRenderer } from 'three'
import type { OrbitControls } from 'three/examples/jsm/Addons.js'
import type { IfcElement, IfcMesh, IfcModel } from '@/core/models'
import type { IfcInstanceRecord, IfcMarkerLink, LambertMesh } from '@/core/types'
import type { IfcMouseState } from '../types'
import type { RenderLoop } from '../scene'
import type { ControlsListener, MutableRef, SelectableIntersection, ViewerRefs } from '../types'

type MutableVector2Ref = MutableRef<Vector2>

type ViewerRefsFactory = () => ViewerRefs

const useViewerRefs: ViewerRefsFactory = () => {
	const containerRef = useRef<HTMLDivElement | null>(null)
	const canvasRef = useRef<HTMLCanvasElement | null>(null)

	const rendererRef = useRef<WebGLRenderer | undefined>(undefined)
	const cameraRef = useRef<PerspectiveCamera | undefined>(undefined)
	const controlsRef = useRef<OrbitControls | undefined>(undefined)
	const renderLoopRef = useRef<RenderLoop | undefined>(undefined)

	const sceneRef = useRef<Scene>(new Scene())
	const modelRef = useRef<IfcModel | undefined>(undefined)
	const rayCasterRef = useRef<Raycaster>(new Raycaster())
	// Store reusable raycast targets so callers never traverse the whole scene graph.
	const raycastTargetsRef = useRef<IfcMesh[]>([])

	const pointerRef = useRef<Vector2>(new Vector2()) as MutableVector2Ref

	const boundingSphereRef = useRef<Sphere | undefined>(undefined)
	const boundingSphereMeshRef = useRef<LambertMesh | undefined>(undefined)

	const selectedIfcElementRef = useRef<IfcElement | undefined>(undefined)
	const previousSelectedIfcElementRef = useRef<IfcElement | undefined>(undefined)
	const selectedInstanceRecordRef = useRef<IfcInstanceRecord | undefined>(undefined)
	const hoveredIfcElementRef = useRef<IfcElement | undefined>(undefined)
	const previousHoveredIfcElementRef = useRef<IfcElement | undefined>(undefined)

	const selectableIntersectionsRef = useRef<SelectableIntersection[]>([])
	const mouseStatusRef = useRef<IfcMouseState>({ clicked: false, x: 0, y: 0 })

	const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined)

	const renderingEnabledRef = useRef(false)
	const renderingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	const ifcMarkerLinksRef = useRef<IfcMarkerLink[]>([])
	const currentLoadedUrlRef = useRef<string>('')
	const controlsListenersRef = useRef<ControlsListener[]>([])
	// Keep the latest viewport size cached to avoid redundant DOM reads inside the render loop.
	const viewportSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })

	const viewerRefs = useMemo<ViewerRefs>(
		() => ({
			containerRef,
			canvasRef,
			rendererRef,
			cameraRef,
			controlsRef,
			renderLoopRef,
			rayCasterRef,
			raycastTargetsRef,
			sceneRef,
			modelRef,
			pointerRef,
			boundingSphereRef,
			boundingSphereMeshRef,
			selectedIfcElementRef,
			previousSelectedIfcElementRef,
			selectedInstanceRecordRef,
			hoveredIfcElementRef,
			previousHoveredIfcElementRef,
			selectableIntersectionsRef,
			mouseStatusRef,
			resizeObserverRef,
			renderingEnabledRef,
			renderingTimeoutRef,
			ifcMarkerLinksRef,
			currentLoadedUrlRef,
			controlsListenersRef,
			viewportSizeRef,
		}),
		[],
	)

	return viewerRefs
}

export { useViewerRefs }
