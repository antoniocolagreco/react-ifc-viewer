import { AmbientLight, DirectionalLight, Scene } from 'three'
import { Grid } from '@/3d-components/grid'

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

export { populateSceneWithDefaults }
