import { IfcElement } from './ifc-element'
import { IfcMesh } from './ifc-mesh'
import type { GeometryId, IfcInstanceRecord, IfcModelData, InstanceState, MaterialId } from '@/core/types'
import { Group, type BufferGeometry, type MeshLambertMaterial, type Matrix4 } from 'three'
import type { Object3D } from 'three'

type InstanceCreationData = {
	element: IfcElement
	geometry: BufferGeometry
	geometryId: GeometryId
	material: MeshLambertMaterial
	materialId: MaterialId
	matrix: Matrix4
}

const DEFAULT_STATE: InstanceState = 'default'

const createStateKey = (state: InstanceState, geometryId: GeometryId, materialId: MaterialId): string => {
	return `${state}:${geometryId}:${materialId}`
}

const createHandleKey = (mesh: IfcMesh, instanceId: number): string => {
	return `${mesh.uuid}:${instanceId.toString()}`
}

class IfcModel extends Group {
	override name: string = 'IfcModel'
	override userData: IfcModelData = {
		geometriesMap: new Map<GeometryId, BufferGeometry>(),
		materialsMap: new Map<MaterialId, MeshLambertMaterial>(),
		hoverMaterialsMap: new Map<MaterialId, MeshLambertMaterial>(),
		selectMaterialsMap: new Map<MaterialId, MeshLambertMaterial>(),
		transparentMaterialsMap: new Map<MaterialId, MeshLambertMaterial>(),
	}

	private readonly elementsGroup: Group = new Group()
	private readonly meshesGroup: Group = new Group()
	private readonly ifcElements: IfcElement[] = []

	private instancedMeshes: Map<string, IfcMesh> = new Map()
	private instanceLookup: Map<string, IfcInstanceRecord> = new Map()

	getElements = (): IfcElement[] => {
		return this.ifcElements
	}

	constructor() {
		super()
		this.elementsGroup.name = 'IfcElements'
		this.meshesGroup.name = 'IfcMeshes'
		super.add(this.elementsGroup)
		super.add(this.meshesGroup)
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

	getElementTransparentMaterial = (materialId: MaterialId): MeshLambertMaterial | undefined => {
		return this.userData.transparentMaterialsMap.get(materialId)
	}

	setElementTransparentMaterial = (materialId: MaterialId, material: MeshLambertMaterial): void => {
		this.userData.transparentMaterialsMap.set(materialId, material)
	}

	addInstanceRecord = (data: InstanceCreationData): IfcInstanceRecord => {
		const { element, geometry, geometryId, material, materialId, matrix } = data
		const recordMatrix = matrix.clone()
		const record: IfcInstanceRecord = {
			element,
			geometryId,
			materialId,
			matrix: recordMatrix,
			state: DEFAULT_STATE,
		}
		const mesh = this.getOrCreateInstancedMesh(DEFAULT_STATE, geometryId, materialId, geometry, material)
		const instanceId = mesh.allocateInstance(recordMatrix)
		record.handle = { mesh, instanceId }
		this.instanceLookup.set(createHandleKey(mesh, instanceId), record)
		element.addInstanceRecord(record)
		return record
	}

	moveRecordToState = (
		record: IfcInstanceRecord,
		targetState: InstanceState,
		resolveMaterial: () => MeshLambertMaterial,
	): void => {
		if (record.state === targetState) {
			return
		}
		this.detachRecord(record)
		record.state = targetState
		if (targetState === 'hidden') {
			return
		}
		const geometry = this.getElementGeometry(record.geometryId)
		if (!geometry) {
			throw new Error(`Geometry ${record.geometryId} not found`)
		}
		const material = resolveMaterial()
		const mesh = this.getOrCreateInstancedMesh(
			targetState,
			record.geometryId,
			record.materialId,
			geometry,
			material,
		)
		const instanceId = mesh.allocateInstance(record.matrix)
		record.handle = { mesh, instanceId }
		this.instanceLookup.set(createHandleKey(mesh, instanceId), record)
	}

	setRecordToDefault = (record: IfcInstanceRecord): void => {
		this.moveRecordToState(record, DEFAULT_STATE, () => {
			const material = this.getElementMaterial(record.materialId)
			if (!material) {
				throw new Error(`Material ${record.materialId} not found`)
			}
			return material
		})
	}

	hideRecord = (record: IfcInstanceRecord): void => {
		this.detachRecord(record)
		record.state = 'hidden'
	}

	getInstanceRecord = (mesh: IfcMesh, instanceId: number): IfcInstanceRecord | undefined => {
		return this.instanceLookup.get(createHandleKey(mesh, instanceId))
	}

	getIfcElement = (expressId: number): IfcElement | undefined => {
		return this.ifcElements.find(ifcElement => ifcElement.userData.expressId === expressId)
	}

	getAllSeletableElements = (): IfcElement[] => {
		return this.ifcElements.filter(ifcElement => ifcElement.isSelectable())
	}

	getAlwaysVisibleIfcElements = (): IfcElement[] => {
		return this.ifcElements.filter(ifcElement => ifcElement.isAlwaysVisible())
	}

	getAllMeshes = (): IfcMesh[] => {
		return [...this.instancedMeshes.values()]
	}

	getAllElementsWithValues = (): IfcElement[] => {
		return this.ifcElements.filter(ifcElement => ifcElement.userData.values)
	}

	getAllElementsWithProperties = (): IfcElement[] => {
		return this.ifcElements.filter(ifcElement => ifcElement.userData.properties)
	}

	getAllElementsWithPropertiesOrValues = (): IfcElement[] => {
		return this.ifcElements.filter(ifcElement => ifcElement.userData.properties || ifcElement.userData.values)
	}

	override add(...objects: Object3D[]): this {
		for (const object of objects) {
			if (object instanceof IfcElement) {
				this.ifcElements.push(object)
				this.elementsGroup.add(object)
				continue
			}
			this.meshesGroup.add(object)
		}
		return this
	}

	private getOrCreateInstancedMesh = (
		state: InstanceState,
		geometryId: GeometryId,
		materialId: MaterialId,
		geometry: BufferGeometry,
		material: MeshLambertMaterial,
	): IfcMesh => {
		const key = createStateKey(state, geometryId, materialId)
		const existing = this.instancedMeshes.get(key)
		if (existing) {
			return existing
		}
		const mesh = new IfcMesh(geometry, material)
		this.instancedMeshes.set(key, mesh)
		this.add(mesh)
		return mesh
	}

	private detachRecord = (record: IfcInstanceRecord): void => {
		const handle = record.handle
		if (!handle) {
			return
		}
		const { mesh, instanceId } = handle
		const recordKey = createHandleKey(mesh, instanceId)
		const lastIndex = mesh.count - 1
		const lastKey = createHandleKey(mesh, lastIndex)
		const swappedRecord = instanceId === lastIndex ? undefined : this.instanceLookup.get(lastKey)
		mesh.releaseInstance(instanceId)
		this.instanceLookup.delete(recordKey)
		if (swappedRecord && swappedRecord !== record) {
			this.instanceLookup.delete(lastKey)
			swappedRecord.handle = { mesh, instanceId }
			this.instanceLookup.set(createHandleKey(mesh, instanceId), swappedRecord)
		}
		record.handle = undefined
	}
}

export { IfcModel }
