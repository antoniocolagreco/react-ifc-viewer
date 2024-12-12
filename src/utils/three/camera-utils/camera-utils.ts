import type { LambertMesh } from '@/types/types'
import {
	Box3,
	Mesh,
	MeshLambertMaterial,
	Sphere,
	SphereGeometry,
	type Camera,
	type Object3D,
	type PerspectiveCamera,
	type Vector3,
} from 'three'
import type { OrbitControls } from 'three/examples/jsm/Addons.js'
import { DEG2RAD } from 'three/src/math/MathUtils.js'

/**
 * Creates a mesh representing a bounding sphere with a Lambert material.
 *
 * @param {Sphere} sphere - The sphere object containing the radius and center of the bounding sphere.
 * @returns {LambertMesh} - The mesh representing the bounding sphere.
 */
const createSphereMesh = (sphere: Sphere): LambertMesh => {
	const sphereGeometry = new SphereGeometry(sphere.radius)
	const sphereMaterial = new MeshLambertMaterial({
		transparent: true,
		opacity: 0.5,
		emissive: 0x00498a,
	})
	const mesh = new Mesh(sphereGeometry, sphereMaterial)
	mesh.position.copy(sphere.center)
	return mesh
}

/**
 * Creates a bounding sphere that encompasses the given object(s).
 *
 * @param object - A single Object3D or an array of Object3D instances to calculate the bounding sphere for.
 * @returns A Sphere that bounds the provided object(s).
 */
const createBoundingSphere = (object: Object3D | Object3D[]): Sphere => {
	const meshes = Array.isArray(object) ? object : [object]
	const bb = new Box3()
	for (const mesh of meshes) {
		bb.expandByObject(mesh)
	}
	const sphere = new Sphere()
	bb.getBoundingSphere(sphere)
	return sphere
}

/**
 * Calculates the minimum distance required between a camera and a bounding sphere
 * to ensure the entire sphere is visible within the camera's field of view.
 *
 * @param sphere - The bounding sphere for which the minimum distance is calculated.
 * @param camera - The perspective camera used to view the bounding sphere.
 * @returns The minimum distance required between the camera and the bounding sphere.
 */
const findMinimumDistanceForBoundingSphere = (sphere: Sphere, camera: PerspectiveCamera): number => {
	const vFOV = camera.getEffectiveFOV() * DEG2RAD
	const hFOV = Math.atan(Math.tan(vFOV * 0.5) * camera.aspect) * 2
	const fov = camera.aspect > 1 ? vFOV : hFOV
	return sphere.radius / Math.sin(fov * 0.5)
}

/**
 * Adjusts the camera position and controls to fit a bounding sphere within the view.
 *
 * @param sphere - The bounding sphere to fit within the camera view.
 * @param camera - The perspective camera to adjust.
 * @param controls - The orbit controls to update.
 * @param margin - Optional. A multiplier to add some margin around the sphere. Default is 1.1.
 * @param minDistance - Optional. The minimum distance to maintain from the sphere. Default is 1.
 */
const fitBoundingSphere = (
	sphere: Sphere,
	camera: PerspectiveCamera,
	controls: OrbitControls,
	margin = 1.1,
	minDistance = 1,
): void => {
	const distance = findMinimumDistanceForBoundingSphere(sphere, camera)
	const finalDistance = Math.max(distance, minDistance) * margin
	const cameraPosition = camera.position
	const direction = sphere.center.clone().sub(cameraPosition).normalize()
	const distanceVector = direction.multiplyScalar(-finalDistance)
	const newCoordinates = sphere.center.clone().add(distanceVector)
	camera.position.copy(newCoordinates)
	controls.target.copy(sphere.center)
	controls.update()
}

/**
 * Moves the camera to a specified destination while maintaining a certain distance.
 *
 * @param destination - The target position to move the camera towards.
 * @param camera - The camera to be moved.
 * @param controls - The orbit controls associated with the camera.
 * @param distance - The distance to maintain from the destination.
 */
const moveTo = (destination: Vector3, camera: Camera, controls: OrbitControls, distance: number): void => {
	const cameraPosition = camera.position
	const direction = destination.clone().sub(cameraPosition).normalize()
	const distanceVector = direction.multiplyScalar(-distance)
	const newCoordinates = destination.clone().add(distanceVector)
	camera.position.copy(newCoordinates)
	controls.target.copy(destination)
	controls.update()
}

export { createBoundingSphere, createSphereMesh, fitBoundingSphere, findMinimumDistanceForBoundingSphere, moveTo }
