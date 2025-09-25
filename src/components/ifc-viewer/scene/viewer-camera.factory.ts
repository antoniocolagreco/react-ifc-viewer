import { PerspectiveCamera } from 'three'

const DEFAULT_CAMERA_FOV = 45
const DEFAULT_CAMERA_POSITION = { x: 10, y: 20, z: 20 }

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

export { createViewerCamera, DEFAULT_CAMERA_FOV, DEFAULT_CAMERA_POSITION }
