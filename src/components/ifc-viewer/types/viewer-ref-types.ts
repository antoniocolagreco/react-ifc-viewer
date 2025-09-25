import type { IfcElement, IfcMesh, IfcModel } from '@/classes'
import type { IfcInstanceRecord, IfcMarkerLink, LambertMesh } from '@/types'
import { Raycaster, Scene, Sphere, Vector2, type Intersection, type PerspectiveCamera, type WebGLRenderer } from 'three'
import type { OrbitControls } from 'three/examples/jsm/Addons.js'
import type { RenderLoop } from '../scene'
import type { IfcMouseState } from './ifc-viewer-types'

type MutableRef<TValue> = {
	current: TValue
}

type SelectableIntersection = {
	element: IfcElement
	instance: IfcInstanceRecord
	intersection: Intersection<IfcMesh>
}

type ControlsListener = {
	type: 'start' | 'end' | 'change'
	handler: () => void
}

type RenderSceneOptions = {
	updateControls?: boolean
}

type RenderScene = (options?: RenderSceneOptions) => void

type ViewerRefs = {
	containerRef: MutableRef<HTMLDivElement | null>
	canvasRef: MutableRef<HTMLCanvasElement | null>
	rendererRef: MutableRef<WebGLRenderer | undefined>
	cameraRef: MutableRef<PerspectiveCamera | undefined>
	controlsRef: MutableRef<OrbitControls | undefined>
	renderLoopRef: MutableRef<RenderLoop | undefined>
	rayCasterRef: MutableRef<Raycaster>
	sceneRef: MutableRef<Scene>
	modelRef: MutableRef<IfcModel | undefined>
	pointerRef: MutableRef<Vector2>
	boundingSphereRef: MutableRef<Sphere | undefined>
	boundingSphereMeshRef: MutableRef<LambertMesh | undefined>
	selectedIfcElementRef: MutableRef<IfcElement | undefined>
	previousSelectedIfcElementRef: MutableRef<IfcElement | undefined>
	selectedInstanceRecordRef: MutableRef<IfcInstanceRecord | undefined>
	hoveredIfcElementRef: MutableRef<IfcElement | undefined>
	previousHoveredIfcElementRef: MutableRef<IfcElement | undefined>
	selectableIntersectionsRef: MutableRef<SelectableIntersection[]>
	mouseStatusRef: MutableRef<IfcMouseState>
	resizeObserverRef: MutableRef<ResizeObserver | undefined>
	renderingEnabledRef: MutableRef<boolean>
	renderingTimeoutRef: MutableRef<ReturnType<typeof setTimeout> | undefined>
	ifcMarkerLinksRef: MutableRef<IfcMarkerLink[]>
	currentLoadedUrlRef: MutableRef<string>
	controlsListenersRef: MutableRef<ControlsListener[]>
}

export type { ControlsListener, MutableRef, RenderScene, RenderSceneOptions, SelectableIntersection, ViewerRefs }
