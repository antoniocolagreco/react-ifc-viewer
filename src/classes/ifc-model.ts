import type { GeometryId, IfcElementData, IfcModelData, MaterialId } from '@/types'
import { Group, type BufferGeometry, type MeshLambertMaterial } from 'three'
import { IfcElement } from './ifc-element'
import type { IfcMesh } from './ifc-mesh'

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

	getSeletableIfcElements = (): IfcElement[] => {
		return this.children.filter(ifcElement => ifcElement.isSelectable())
	}

	getAlwaysVisibleIfcElements = (): IfcElement[] => {
		return this.children.filter(ifcElement => ifcElement.isAlwaysVisible())
	}

	getAllMeshes = (): IfcMesh[] => {
		return this.children.flatMap(ifcElement => ifcElement.children)
	}

	getAllElementsData = (): IfcElementData[] => {
		return this.children.map(IfcElement => IfcElement.userData)
	}
}

export { IfcModel }
