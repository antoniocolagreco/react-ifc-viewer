import type { GeometryId, IfcMeshData, MaterialId } from '@/types'
import { Mesh, type BufferGeometry, type MeshLambertMaterial } from 'three'
import type { IfcElement } from '@/classes'

class IfcMesh extends Mesh<BufferGeometry, MeshLambertMaterial> {
	override name: string = 'IfcMesh'
	override parent: IfcElement
	override userData: IfcMeshData

	constructor(
		geometry: BufferGeometry,
		material: MeshLambertMaterial,
		parent: IfcElement,
		geometryId: GeometryId,
		materialId: MaterialId,
	) {
		super(geometry, material)
		this.parent = parent
		this.userData = {
			geometryId: geometryId,
			materialId: materialId,
		}
	}

	getLinkedMeshes = (): IfcMesh[] => {
		return this.parent.children
	}

	getifcElement = (): IfcElement => {
		return this.parent
	}
}

export { IfcMesh }
