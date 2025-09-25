import type { IfcElement, IfcModel } from '@/classes'
import type { IfcPosition } from '@/components'
import { Color, MeshLambertMaterial, type PerspectiveCamera, type Vector3, type WebGLRenderer } from 'three'

/**
 * Transforms a 3D position in the viewport to a 2D screen position.
 *
 * @param camera - The perspective camera used for the scene.
 * @param renderer - The WebGL renderer used to render the scene.
 * @param position - The 3D position in the viewport to be transformed.
 * @returns The 2D screen position corresponding to the given 3D viewport position.
 */
const transformViewportPositionToScreenPosition = (
	camera: PerspectiveCamera,
	renderer: WebGLRenderer,
	position: Vector3,
): IfcPosition => {
	const vector = position.clone()
	vector.project(camera)

	vector.setX(vector.x)
	vector.setY(vector.y)
	vector.setZ(vector.z)

	const widthHalf = renderer.domElement.clientWidth / 2
	const heightHalf = renderer.domElement.clientHeight / 2

	const x = vector.x * widthHalf + widthHalf
	const y = -(vector.y * heightHalf) + heightHalf

	return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 }
}

const setMaterialToSelected = (
	ifcElement: IfcElement,
	ifcModel: IfcModel,
	color: number = 0x16a34a,
	depthTest = true,
): void => {
	ifcElement.visible = true
	const mixingColor = new Color()
	for (const record of ifcElement.getInstanceRecords()) {
		const baseMaterial = ifcModel.getElementMaterial(record.materialId)
		if (!baseMaterial) {
			continue
		}
		let selectedMaterial = ifcModel.getElementSelectMaterial(record.materialId)
		if (!selectedMaterial) {
			selectedMaterial = new MeshLambertMaterial()
			ifcModel.setElementSelectMaterial(record.materialId, selectedMaterial)
		}
		mixingColor.lerpColors(baseMaterial.color, selectedMaterial.color, 0.5)
		selectedMaterial.color.copy(mixingColor)
		selectedMaterial.emissive.setHex(color)
		selectedMaterial.emissiveIntensity = 1
		selectedMaterial.depthTest = depthTest
		selectedMaterial.transparent = baseMaterial.transparent
		selectedMaterial.opacity = baseMaterial.opacity
		selectedMaterial.needsUpdate = true

		ifcModel.moveRecordToState(record, 'selected', () => selectedMaterial)
		if (record.handle) {
			record.handle.mesh.renderOrder = 1
		}
	}
}

const setMaterialToHovered = (
	ifcElement: IfcElement,
	ifcModel: IfcModel,
	color: number = 0xffffff,
	depthTest = true,
): void => {
	ifcElement.visible = true
	const mixingColor = new Color()
	for (const record of ifcElement.getInstanceRecords()) {
		const baseMaterial = ifcModel.getElementMaterial(record.materialId)
		if (!baseMaterial) {
			continue
		}
		let hoveredMaterial = ifcModel.getElementHoverMaterial(record.materialId)
		if (!hoveredMaterial) {
			hoveredMaterial = new MeshLambertMaterial()
			ifcModel.setElementHoverMaterial(record.materialId, hoveredMaterial)
		}
		mixingColor.lerpColors(baseMaterial.color, hoveredMaterial.color, 0.1)
		hoveredMaterial.color.copy(mixingColor)
		hoveredMaterial.emissive.setHex(color)
		hoveredMaterial.emissiveIntensity = 0.1
		hoveredMaterial.depthTest = depthTest
		hoveredMaterial.transparent = baseMaterial.transparent
		hoveredMaterial.opacity = baseMaterial.opacity
		hoveredMaterial.needsUpdate = true

		ifcModel.moveRecordToState(record, 'hovered', () => hoveredMaterial)
		if (record.handle) {
			record.handle.mesh.renderOrder = 1
		}
	}
}

const setMaterialToTransparent = (ifcElement: IfcElement, ifcModel: IfcModel): void => {
	ifcElement.visible = true
	for (const record of ifcElement.getInstanceRecords()) {
		const baseMaterial = ifcModel.getElementMaterial(record.materialId)
		if (!baseMaterial) {
			continue
		}
		let transparentMaterial = ifcModel.getElementTransparentMaterial(record.materialId)
		if (!transparentMaterial) {
			transparentMaterial = baseMaterial.clone()
			ifcModel.setElementTransparentMaterial(record.materialId, transparentMaterial)
		}
		transparentMaterial.transparent = true
		transparentMaterial.opacity = 0.3
		transparentMaterial.depthWrite = false
		transparentMaterial.needsUpdate = true

		ifcModel.moveRecordToState(record, 'transparent', () => transparentMaterial)
		if (record.handle) {
			record.handle.mesh.renderOrder = 0
		}
	}
}

const setMaterialToDefault = (ifcElement: IfcElement, ifcModel: IfcModel): void => {
	ifcElement.visible = true
	for (const record of ifcElement.getInstanceRecords()) {
		ifcModel.setRecordToDefault(record)
		if (record.handle) {
			record.handle.mesh.renderOrder = 0
		}
	}
}

const setMaterialToHidden = (ifcElement: IfcElement, ifcModel: IfcModel): void => {
	ifcElement.visible = false
	for (const record of ifcElement.getInstanceRecords()) {
		ifcModel.hideRecord(record)
	}
}

export {
	setMaterialToDefault,
	setMaterialToHidden,
	setMaterialToHovered,
	setMaterialToSelected,
	setMaterialToTransparent,
	transformViewportPositionToScreenPosition,
}
