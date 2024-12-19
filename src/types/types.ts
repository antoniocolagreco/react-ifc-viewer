import type { IfcElement } from '@/classes'
import type { ReactNode } from 'react'
import { type BufferGeometry, type Mesh, type MeshLambertMaterial, type ShaderMaterial } from 'three'

type ExpressId = number

type IfcElementData = {
	expressId: ExpressId
	type?: string
	name?: string | undefined
	properties?: PropertySet[] | undefined
	links?: IfcLink
	selectable?: boolean | undefined
	alwaysVisible?: boolean | undefined
}

type IfcModelData = {
	geometriesMap: Map<GeometryId, BufferGeometry>
	materialsMap: Map<MaterialId, MeshLambertMaterial>
	hoverMaterialsMap: Map<MaterialId, MeshLambertMaterial>
	selectMaterialsMap: Map<MaterialId, MeshLambertMaterial>
}

type IfcMeshData = {
	geometryId: GeometryId
	materialId: MaterialId
}

type IfcLink = Record<string, ExpressId[]>

type LambertMesh = Mesh<BufferGeometry, MeshLambertMaterial>

type ShaderMesh = Mesh<BufferGeometry, ShaderMaterial>

type PropertyValue = string | number | number[] | boolean | undefined

type Property = { name: string; value?: PropertyValue }

type PropertySet = {
	name: string | undefined
	properties: Property[]
}

type Requirements = { requiredType?: string; requiredProperties?: Property[] }

type SelectableRequirements = Requirements & { linkRequirements?: LinkRequirements }
type MarkerRequirements = Requirements & { children: ReactNode }
type LinkRequirements = Requirements & { linkPropertyName: string }

type IfcMarkerLink = { element: IfcElement; content: ReactNode }

type GeometryId = string
type MaterialId = string

export type {
	ExpressId,
	GeometryId,
	IfcElementData,
	IfcLink,
	IfcMarkerLink,
	IfcMeshData,
	IfcModelData,
	LambertMesh,
	LinkRequirements,
	MarkerRequirements,
	MaterialId,
	Property,
	PropertySet,
	PropertyValue,
	Requirements,
	SelectableRequirements,
	ShaderMesh,
}
