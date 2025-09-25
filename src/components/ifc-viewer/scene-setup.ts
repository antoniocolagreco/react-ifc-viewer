import { Grid } from '@/3d-components/grid'
import { AmbientLight, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'

const DEFAULT_CAMERA_FOV = 45
const DEFAULT_CAMERA_POSITION = { x: 10, y: 20, z: 20 }
const MAX_PIXEL_RATIO = 2

/**
 * Create a WebGL renderer configured for the IFC viewer canvas.
 */
const createViewerRenderer = (canvas: HTMLCanvasElement): WebGLRenderer => {
	const renderer = new WebGLRenderer({
		canvas,
		antialias: true,
		alpha: true,
	})
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
	renderer.setSize(canvas.clientWidth, canvas.clientHeight)
	renderer.setClearColor(0x000000, 0)
	return renderer
}

/**
 * Create the default viewer camera with the expected clipping distances and layers.
 */
const createViewerCamera = (
	canvas: HTMLCanvasElement,
	layers: { meshes: number; helpers: number },
): PerspectiveCamera => {
	const camera = new PerspectiveCamera()
	camera.fov = DEFAULT_CAMERA_FOV
	camera.aspect = canvas.clientWidth / canvas.clientHeight
	camera.near = 0.1
	camera.far = 5000
	camera.position.set(DEFAULT_CAMERA_POSITION.x, DEFAULT_CAMERA_POSITION.y, DEFAULT_CAMERA_POSITION.z)
	camera.updateProjectionMatrix()
	camera.layers.set(layers.meshes)
	camera.layers.enable(layers.helpers)
	return camera
}

/**
 * Create orbit controls tuned for the viewer experience.
 */
const createViewerControls = (camera: PerspectiveCamera, renderer: WebGLRenderer): OrbitControls => {
	const controls = new OrbitControls(camera, renderer.domElement)
	controls.enableDamping = true
	controls.maxPolarAngle = Math.PI / 2
	return controls
}

/**
 * Create a resize observer that triggers re-render logic when the container changes size.
 */
const createResizeObserver = (container: Element, onResize: () => void): ResizeObserver => {
	const observer = new ResizeObserver(onResize)
	observer.observe(container)
	return observer
}

/**
 * Populate the scene with baseline lights and grid helpers.
 */
const populateSceneWithDefaults = (scene: Scene, helpersLayer: number): void => {
	const ambientLight = new AmbientLight(0xffffff, 0.5)
	scene.add(ambientLight)

	const directionalLight = new DirectionalLight(0xffffff, 1.5)
	directionalLight.position.set(5, 10, 3)
	scene.add(directionalLight)

	const grid = new Grid()
	grid.position.y = -0.3
	grid.layers.set(helpersLayer)
	scene.add(grid)
}

type RenderLoop = {
	start: () => void
	stop: () => void
}

/**
 * Create a managed requestAnimationFrame loop with start/stop controls.
 */
const createRenderLoop = (callback: () => void): RenderLoop => {
	let animationFrameId: number | undefined

	const frame = (): void => {
		callback()
		animationFrameId = requestAnimationFrame(frame)
	}

	return {
		start() {
			if (animationFrameId !== undefined) {
				return
			}
			animationFrameId = requestAnimationFrame(frame)
		},
		stop() {
			if (animationFrameId === undefined) {
				return
			}
			cancelAnimationFrame(animationFrameId)
			animationFrameId = undefined
		},
	}
}

export {
	createRenderLoop,
	createViewerCamera,
	createViewerControls,
	createViewerRenderer,
	createResizeObserver,
	populateSceneWithDefaults,
	type RenderLoop,
}
