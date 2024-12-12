import type IfcElement from '@/classes/ifc-element'
import type IfcModel from '@/classes/ifc-model'
import type { Position } from '@/components/ifc-viewer/types'
import { MeshLambertMaterial, type PerspectiveCamera, type Vector3, type WebGLRenderer } from 'three'

const transformViewportPositionToScreenPosition = (
	camera: PerspectiveCamera,
	renderer: WebGLRenderer,
	position: Vector3,
): Position => {
	const vector = position.clone()
	vector.project(camera)

	vector.setX(vector.x)
	vector.setY(vector.y)
	vector.setZ(vector.z)

	const widthHalf = renderer.domElement.clientWidth / 2
	const heightHalf = renderer.domElement.clientHeight / 2

	const x = vector.x * widthHalf + widthHalf
	const y = -(vector.y * heightHalf) + heightHalf
	return { x, y }
}

const setElementToSelectedMaterial = (ifcElement: IfcElement, ifcModel: IfcModel, color: number): void => {
	ifcElement.visible = true
	for (const ifcMesh of ifcElement.children) {
		let selectedMaterial = ifcModel.getElementSelectMaterial(ifcMesh.userData.materialId)
		if (!selectedMaterial) {
			selectedMaterial = new MeshLambertMaterial()
			ifcModel.setElementSelectMaterial(ifcMesh.userData.materialId, selectedMaterial)
		}
		selectedMaterial.transparent = false
		selectedMaterial.emissive.setHex(color)
		selectedMaterial.color.setHex(color)
		selectedMaterial.depthTest = false
		ifcMesh.material = selectedMaterial
		ifcMesh.renderOrder = 1
	}
}

const setElementToHoveredMaterial = (ifcElement: IfcElement, ifcModel: IfcModel, color: number): void => {
	ifcElement.visible = true

	for (const ifcMesh of ifcElement.children) {
		let hoveredMaterial = ifcModel.getElementHoverMaterial(ifcMesh.userData.materialId)
		if (!hoveredMaterial) {
			hoveredMaterial = new MeshLambertMaterial()
			ifcModel.setElementHoverMaterial(ifcMesh.userData.materialId, hoveredMaterial)
		}
		hoveredMaterial.opacity = 1
		hoveredMaterial.transparent = false
		hoveredMaterial.emissive.setHex(color)
		hoveredMaterial.color.setHex(color)
		hoveredMaterial.depthTest = false
		ifcMesh.material = hoveredMaterial
		ifcMesh.renderOrder = 1
	}
}

const setElementToTransparentMaterial = (ifcElement: IfcElement, ifcModel: IfcModel): void => {
	ifcElement.visible = true

	for (const ifcMesh of ifcElement.children) {
		const originalMaterial = ifcModel.getElementMaterial(ifcMesh.userData.materialId)
		const transparentMaterial = new MeshLambertMaterial()
		if (originalMaterial) {
			transparentMaterial.copy(originalMaterial)
		} else {
			transparentMaterial.copy(ifcMesh.material)
		}
		transparentMaterial.transparent = true
		transparentMaterial.opacity = 0.3
		transparentMaterial.depthTest = false
		transparentMaterial.depthWrite = false
		ifcMesh.material = transparentMaterial
		ifcMesh.renderOrder = 0
	}
}

const setElementToOriginalMaterial = (ifcElement: IfcElement, ifcModel: IfcModel): void => {
	ifcElement.visible = true
	for (const ifcMesh of ifcElement.children) {
		const originalMaterial = ifcModel.getElementMaterial(ifcMesh.userData.materialId)
		if (originalMaterial) {
			ifcMesh.material = originalMaterial
		}
		ifcMesh.renderOrder = 0
	}
}

const setElementToHidden = (ifcElement: IfcElement): void => {
	ifcElement.visible = false
}

export {
	setElementToHidden,
	setElementToHoveredMaterial,
	setElementToOriginalMaterial,
	setElementToSelectedMaterial,
	setElementToTransparentMaterial,
	transformViewportPositionToScreenPosition,
}
