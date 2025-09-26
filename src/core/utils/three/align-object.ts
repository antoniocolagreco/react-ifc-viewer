import { Box3, Object3D, Vector3 } from 'three'

type CenterObjectSettings = {
	x: 'left' | 'center' | 'right'
	y: 'top' | 'center' | 'bottom'
	z: 'front' | 'center' | 'back'
}

const centerAlignment: CenterObjectSettings = { x: 'center', y: 'center', z: 'center' }

// Shared scratch objects ensure repeated alignment calls stay allocation-free.
const boundingBoxScratch = new Box3()
const centerVectorScratch = new Vector3()

const alignObject = (object: Object3D, position: CenterObjectSettings = centerAlignment): void => {
	const box = boundingBoxScratch
	box.setFromObject(object)
	const center = box.getCenter(centerVectorScratch)

	// Offsets for each axis
	let xOffset = 0
	let yOffset = 0
	let zOffset = 0

	// Calculate x offset
	switch (position.x) {
		case 'left': {
			xOffset = -box.min.x // Align left side to 0
			break
		}
		case 'center': {
			xOffset = -center.x // Center along x-axis
			break
		}
		case 'right': {
			xOffset = -box.max.x // Align right side to 0
			break
		}
		// No default
	}

	// Calculate y offset
	switch (position.y) {
		case 'top': {
			yOffset = -box.max.y // Align top side to 0
			break
		}
		case 'center': {
			yOffset = -center.y // Center along y-axis
			break
		}
		case 'bottom': {
			yOffset = -box.min.y // Align bottom side to 0
			break
		}
		// No default
	}

	// Calculate z offset
	switch (position.z) {
		case 'front': {
			zOffset = -box.min.z // Align front side to 0
			break
		}
		case 'center': {
			zOffset = -center.z // Center along z-axis
			break
		}
		case 'back': {
			zOffset = -box.max.z // Align back side to 0
			break
		}
		// No default
	}

	// Apply the offsets to the object's position
	object.position.x += xOffset
	object.position.y += yOffset
	object.position.z += zOffset
}

export { alignObject }
