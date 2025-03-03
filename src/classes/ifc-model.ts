import type { IfcMesh } from '@/classes'
import { IfcElement } from '@/classes'
import type { GeometryId, IfcModelData, MaterialId } from '@/types'
import { Group, type BufferGeometry, type MeshLambertMaterial } from 'three'

class IfcModel extends Group {
	override name: string = 'IfcModel'
	override children: IfcElement[] = []
	override userData: IfcModelData = {
		geometriesMap: new Map<GeometryId, BufferGeometry>(),
		materialsMap: new Map<MaterialId, MeshLambertMaterial>(),
		hoverMaterialsMap: new Map<MaterialId, MeshLambertMaterial>(),
		selectMaterialsMap: new Map<MaterialId, MeshLambertMaterial>(),
	}

	getElementGeometry = (geometryId: GeometryId): BufferGeometry | undefined => {
		return this.userData.geometriesMap.get(geometryId)
	}

	setElementGeometry = (geometryId: GeometryId, geometry: BufferGeometry): void => {
		this.userData.geometriesMap.set(geometryId, geometry)
	}

	getElementMaterial = (materialId: MaterialId): MeshLambertMaterial | undefined => {
		return this.userData.materialsMap.get(materialId)
	}

	setElementMaterial = (materialId: MaterialId, material: MeshLambertMaterial): void => {
		this.userData.materialsMap.set(materialId, material)
	}

	getElementHoverMaterial = (materialId: MaterialId): MeshLambertMaterial | undefined => {
		return this.userData.hoverMaterialsMap.get(materialId)
	}

	setElementHoverMaterial = (materialId: MaterialId, material: MeshLambertMaterial): void => {
		this.userData.hoverMaterialsMap.set(materialId, material)
	}

	getElementSelectMaterial = (materialId: MaterialId): MeshLambertMaterial | undefined => {
		return this.userData.selectMaterialsMap.get(materialId)
	}

	setElementSelectMaterial = (materialId: MaterialId, material: MeshLambertMaterial): void => {
		this.userData.selectMaterialsMap.set(materialId, material)
	}

	getIfcElement = (expressId: number): IfcElement | undefined => {
		return this.children.find(ifcElement => ifcElement.userData.expressId === expressId)
	}

	getAllSeletableElements = (): IfcElement[] => {
		return this.children.filter(ifcElement => ifcElement.isSelectable())
	}

	getAlwaysVisibleIfcElements = (): IfcElement[] => {
		return this.children.filter(ifcElement => ifcElement.isAlwaysVisible())
	}

	getAllMeshes = (): IfcMesh[] => {
		return this.children.flatMap(ifcElement => ifcElement.children)
	}

	getAllElementsWithValues = (): IfcElement[] => {
		return this.children.filter(IfcElement => IfcElement.userData.values)
	}

	getAllElementsWithProperties = (): IfcElement[] => {
		return this.children.filter(IfcElement => IfcElement.userData.properties)
	}

	getAllElementsWithPropertiesOrValues = (): IfcElement[] => {
		return this.children.filter(IfcElement => IfcElement.userData.properties || IfcElement.userData.values)
	}
}

export { IfcModel }
