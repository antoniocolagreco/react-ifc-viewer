import type { IfcModel } from '@/classes'
import { IfcElement, IfcMesh } from '@/classes'
import type { GeometryId, MaterialId } from '@/types'
import { Box3, BufferAttribute, BufferGeometry, Color, Group, Matrix4, MeshLambertMaterial, Vector3 } from 'three'
import type { FlatMesh, IfcAPI } from 'web-ifc'

/**
 * Builds a mesh or group of meshes from the given IFC data.
 *
 * @param ifcAPI - The IFC API instance used to retrieve geometry data.
 * @param modelID - The ID of the model to retrieve geometry from.
 * @param flatMesh - The flat mesh data containing geometries and transformations.
 * @param geometriesMap - A map of geometry IDs to BufferGeometry objects.
 * @param materialsMap - A map of material IDs to MeshLambertMaterial objects.
 * @returns An IfcMesh if there is only one mesh, otherwise an IfcGroup containing multiple meshes.
 */
const buildifcElement = (ifcAPI: IfcAPI, modelID: number, flatMesh: FlatMesh, model: IfcModel): IfcElement => {
	const { geometries, expressID } = flatMesh

	const ifcElement = new IfcElement(expressID)
	ifcElement.userData.expressId = expressID

	for (let index = 0; index < geometries.size(); index++) {
		const {
			color: { w, x, y, z },
			flatTransformation,
			geometryExpressID,
		} = flatMesh.geometries.get(index)
		const transparent = w !== 1
		const opacity = 0.5

		// Create a unique id for the geometry taking into account if it is transparent or opaque
		const geometryId: GeometryId = getGeometryId(geometryExpressID, transparent)

		let geometry = model.getElementGeometry(geometryId)
		// If geometryRecord is not found, create a new one
		if (!geometry) {
			geometry = getBufferGeometry(ifcAPI, modelID, geometryExpressID)
			model.setElementGeometry(geometryId, geometry)
		}
		const matrix = new Matrix4()
		matrix.fromArray(flatTransformation)
		// geometry.applyMatrix4(matrix)

		const color = new Color(x, y, z)
		const materialId = getMaterialId(x, y, z, transparent)
		let material = model.getElementMaterial(materialId)

		if (!material) {
			material = new MeshLambertMaterial({ color, transparent, opacity })
			if (transparent) {
				material.polygonOffset = true
				material.polygonOffsetFactor = -1
				material.polygonOffsetUnits = -1
				material.depthWrite = false
			}
			model.setElementMaterial(materialId, material)
		}

		const ifcMesh = new IfcMesh(geometry, material, ifcElement, geometryId, materialId)

		ifcMesh.applyMatrix4(matrix)

		ifcElement.add(ifcMesh)
	}

	return ifcElement
}

/**
 * Generates a unique identifier for a geometry based on its express ID and transparency.
 *
 * @param geometryExpressID - The express ID of the geometry.
 * @param transparent - A boolean indicating whether the geometry is transparent.
 * @returns A unique identifier string for the geometry.
 */
const getGeometryId = (geometryExpressID: number, transparent: boolean): GeometryId => {
	return `${geometryExpressID.toString()}${transparent ? 'T' : 'O'}`
}

/**
 * Generates a material ID string based on the provided RGB values and transparency.
 *
 * @param r - The red component of the color (0-255).
 * @param g - The green component of the color (0-255).
 * @param b - The blue component of the color (0-255).
 * @param transparent - A boolean indicating whether the material is transparent.
 * @returns A string representing the material ID in the format "r-g-b-T/O".
 */
const getMaterialId = (x: number, y: number, z: number, transparent: boolean): MaterialId => {
	const stringArray = [x.toString(), y.toString(), z.toString(), transparent ? 'T' : 'O']
	return stringArray.join('-')
}

/**
 * Retrieves a BufferGeometry object from the given IFC model and geometry express ID.
 *
 * @param ifcAPI - The instance of the IfcAPI to interact with the IFC model.
 * @param modelID - The ID of the IFC model from which to retrieve the geometry.
 * @param geometryExpressID - The express ID of the geometry to retrieve.
 * @returns A BufferGeometry object containing the vertices and indices of the specified geometry.
 */
const getBufferGeometry = (ifcAPI: IfcAPI, modelID: number, geometryExpressID: number): BufferGeometry => {
	const geometry = ifcAPI.GetGeometry(modelID, geometryExpressID)
	const verts = ifcAPI.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize())
	const indices = ifcAPI.GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize())
	const bufferGeometry = convertGeometryToBuffer(verts, indices)
	geometry.delete()
	return bufferGeometry
}

/**
 * Converts vertex and index data into a `BufferGeometry` object.
 *
 * @param vertexData - A `Float32Array` containing vertex positions and normals.
 * Each vertex is represented by 6 consecutive floats: 3 for position (x, y, z) and 3 for normal (nx, ny, nz).
 * @param indexData - A `Uint32Array` containing the indices that define the geometry's faces.
 * @returns A `BufferGeometry` object with the provided vertex positions, normals, and indices.
 */
const convertGeometryToBuffer = (vertexData: Float32Array, indexData: Uint32Array): BufferGeometry => {
	const geometry = new BufferGeometry()

	const posFloats = new Float32Array(vertexData.length / 2)
	const normFloats = new Float32Array(vertexData.length / 2)

	for (let i = 0; i < vertexData.length; i += 6) {
		posFloats[i / 2 + 0] = vertexData[i + 0] ?? 0
		posFloats[i / 2 + 1] = vertexData[i + 1] ?? 0
		posFloats[i / 2 + 2] = vertexData[i + 2] ?? 0

		normFloats[i / 2 + 0] = vertexData[i + 3] ?? 0
		normFloats[i / 2 + 1] = vertexData[i + 4] ?? 0
		normFloats[i / 2 + 2] = vertexData[i + 5] ?? 0
	}

	geometry.setAttribute('position', new BufferAttribute(posFloats, 3))
	geometry.setAttribute('normal', new BufferAttribute(normFloats, 3))
	geometry.setIndex(new BufferAttribute(indexData, 1))
	return geometry
}

const cloneMesh = (mesh: IfcMesh): IfcMesh => {
	const clone = new IfcMesh(
		mesh.geometry,
		mesh.material,
		mesh.parent,
		mesh.userData.geometryId,
		mesh.userData.materialId,
	)
	clone.applyMatrix4(mesh.matrix)
	return clone
}

const getGroupPosition = (group: Group): Vector3 => {
	const boundingBox = new Box3()
	for (const child of group.children) {
		boundingBox.expandByObject(child)
	}
	const center = new Vector3()
	boundingBox.getCenter(center)
	return center
}

export { buildifcElement, cloneMesh, getGroupPosition }
