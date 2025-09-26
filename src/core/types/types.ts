import type { IfcElement, IfcMesh } from '@/core/models'
import type { IfcOverlayProps } from '@/react/components'
import type { ReactNode } from 'react'
import { type Matrix4, type BufferGeometry, type Mesh, type MeshLambertMaterial, type ShaderMaterial } from 'three'

type ExpressId = number

type IfcElementData = {
	expressId: ExpressId
	tag?: Tag
	type?: string
	name?: string | undefined
	properties?: PropertySet[] | undefined
	links?: IfcLink
	values?: Record<string, PropertyValue>
	selectable?: boolean | undefined
	alwaysVisible?: boolean | undefined
}

type IfcModelData = {
	geometriesMap: Map<GeometryId, BufferGeometry>
	materialsMap: Map<MaterialId, MeshLambertMaterial>
	hoverMaterialsMap: Map<MaterialId, MeshLambertMaterial>
	selectMaterialsMap: Map<MaterialId, MeshLambertMaterial>
	transparentMaterialsMap: Map<MaterialId, MeshLambertMaterial>
}

type IfcMeshData = {
	geometryId: GeometryId
	materialId: MaterialId
}

type IfcLink = Record<string, ExpressId[]>

type LambertMesh = Mesh<BufferGeometry, MeshLambertMaterial>

type ShaderMesh = Mesh<BufferGeometry, ShaderMaterial>

type Tag = { value?: string; type?: number; name?: string }

type PropertyValue = string | number | number[] | boolean | undefined

type Property = { name: string; value?: PropertyValue }

type PropertySet = {
	name: string | undefined
	properties: Property[]
}

type Requirements = { type?: string; properties?: Property[]; tag?: Tag; expressId?: ExpressId }

type SelectableRequirements = Requirements & { links?: string[] }
type MarkerRequirements = Requirements & { children: ReactNode }

type LinkRequirement = Requirements & { linkName: string }

type IfcElementLink = {
	sharedProperty: string
	source: LinkRequirement
	target: LinkRequirement
}

type IfcMarkerLink = {
	element: IfcElement
	props: IfcOverlayProps
}

type GeometryId = string
type MaterialId = string

type InstanceState = 'default' | 'hovered' | 'selected' | 'transparent' | 'hidden'

type IfcInstanceHandle = {
	instanceId: number
	mesh: IfcMesh
}

type IfcInstanceRecord = {
	element: IfcElement
	geometryId: GeometryId
	handle?: IfcInstanceHandle
	materialId: MaterialId
	matrix: Matrix4
	state: InstanceState
}

type ProgressStatus = {
	state: 'PROGRESS' | 'DONE' | 'ERROR'
	loaded?: number
	total?: number
}

export type {
	ExpressId,
	GeometryId,
	IfcElementData,
	IfcElementLink,
	IfcLink,
	IfcInstanceHandle,
	IfcInstanceRecord,
	IfcMarkerLink,
	IfcMeshData,
	IfcModelData,
	InstanceState,
	LambertMesh,
	LinkRequirement,
	MarkerRequirements,
	MaterialId,
	ProgressStatus,
	Property,
	PropertySet,
	PropertyValue,
	Requirements,
	SelectableRequirements,
	ShaderMesh,
	Tag,
}
