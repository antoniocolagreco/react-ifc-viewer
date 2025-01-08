import { BufferGeometry, Mesh, type MeshLambertMaterial, type Object3D } from 'three'

/**
 * Disposes of a given MeshLambertMaterial and its associated maps to free up memory.
 *
 * @param material - The MeshLambertMaterial to dispose of.
 *
 * This function checks for the presence of various maps (e.g., map, lightMap, aoMap, emissiveMap, bumpMap, normalMap, specularMap, envMap, alphaMap)
 * associated with the material and disposes of them if they exist. Finally, it disposes of the material itself.
 */
const disposeMaterial = (material: MeshLambertMaterial): void => {
	if (material.map) material.map.dispose()
	if (material.lightMap) material.lightMap.dispose()
	if (material.aoMap) material.aoMap.dispose()
	if (material.emissiveMap) material.emissiveMap.dispose()
	if (material.bumpMap) material.bumpMap.dispose()
	if (material.normalMap) material.normalMap.dispose()
	if (material.specularMap) material.specularMap.dispose()
	if (material.envMap) material.envMap.dispose()
	if (material.alphaMap) material.alphaMap.dispose()
	material.dispose()
}

/**
 * Disposes of a given Object3D and its associated geometries and materials to free up memory.
 *
 * @param object3D - The Object3D to dispose of.
 *
 * This function recursively disposes of the geometries and materials of the given Object3D and its children.
 */
const disposeObjects = (object3D: Object3D | undefined): void => {
	if (!object3D) return

	if (object3D instanceof Mesh) {
		if (object3D.geometry instanceof BufferGeometry) {
			object3D.geometry.dispose()
		}
		const material = object3D.material as MeshLambertMaterial | MeshLambertMaterial[]
		if (Array.isArray(material)) {
			for (const mat of material) {
				disposeMaterial(mat)
			}
		} else {
			disposeMaterial(material)
		}
	}

	while (object3D.children.length > 0) {
		disposeObjects(object3D.children[0])
		if (object3D.children[0]) {
			object3D.remove(object3D.children[0])
		}
	}
}

export { disposeMaterial, disposeObjects }
