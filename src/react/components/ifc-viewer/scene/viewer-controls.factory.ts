import type { PerspectiveCamera } from 'three'
import { OrbitControls } from 'three/examples/jsm/Addons.js'
import type { WebGLRenderer } from 'three'

const createViewerControls = (camera: PerspectiveCamera, renderer: WebGLRenderer): OrbitControls => {
	const controls = new OrbitControls(camera, renderer.domElement)
	controls.enableDamping = true
	controls.maxPolarAngle = Math.PI / 2
	return controls
}

export { createViewerControls }
