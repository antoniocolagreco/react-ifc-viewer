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
	for (const ifcMesh of ifcElement.children) {
		let selectedMaterial = ifcModel.getElementSelectMaterial(ifcMesh.userData.materialId)
		if (!selectedMaterial) {
			selectedMaterial = new MeshLambertMaterial()
			ifcModel.setElementSelectMaterial(ifcMesh.userData.materialId, selectedMaterial)
		}
		let originalMaterial = ifcModel.getElementMaterial(ifcMesh.userData.materialId)
		if (!originalMaterial) {
			originalMaterial = ifcMesh.material
		}
		const mixedColor = new Color()
		mixedColor.lerpColors(originalMaterial.color, selectedMaterial.color, 0.5)
		selectedMaterial.color = mixedColor
		selectedMaterial.emissive.setHex(color)
		selectedMaterial.emissiveIntensity = 1
		selectedMaterial.depthTest = depthTest

		ifcMesh.material = selectedMaterial
		ifcMesh.renderOrder = 1
	}
}

const setMaterialToHovered = (
	ifcElement: IfcElement,
	ifcModel: IfcModel,
	color: number = 0xffffff,
	depthTest = true,
): void => {
	ifcElement.visible = true

	for (const ifcMesh of ifcElement.children) {
		let hoveredMaterial = ifcModel.getElementHoverMaterial(ifcMesh.userData.materialId)
		if (!hoveredMaterial) {
			hoveredMaterial = new MeshLambertMaterial()
			ifcModel.setElementHoverMaterial(ifcMesh.userData.materialId, hoveredMaterial)
		}
		let originalMaterial = ifcModel.getElementMaterial(ifcMesh.userData.materialId)
		if (!originalMaterial) {
			originalMaterial = ifcMesh.material
		}
		const mixedColor = new Color()
		mixedColor.lerpColors(originalMaterial.color, hoveredMaterial.color, 0.1)

		hoveredMaterial.color = mixedColor
		hoveredMaterial.emissive.setHex(color)
		hoveredMaterial.emissiveIntensity = 0.1
		hoveredMaterial.depthTest = depthTest

		ifcMesh.material = hoveredMaterial
		ifcMesh.renderOrder = 1
	}
}

const setMaterialToTransparent = (ifcElement: IfcElement, ifcModel: IfcModel): void => {
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
		// transparentMaterial.depthTest = false
		// transparentMaterial.depthWrite = false
		ifcMesh.material = transparentMaterial
		ifcMesh.renderOrder = 0
	}
}

const setMaterialToDefault = (ifcElement: IfcElement, ifcModel: IfcModel): void => {
	ifcElement.visible = true
	for (const ifcMesh of ifcElement.children) {
		const originalMaterial = ifcModel.getElementMaterial(ifcMesh.userData.materialId)
		if (originalMaterial) {
			ifcMesh.material = originalMaterial
		}
		ifcMesh.renderOrder = 0
	}
}

const setMaterialToHidden = (ifcElement: IfcElement): void => {
	ifcElement.visible = false
}

export {
	setMaterialToDefault,
	setMaterialToHidden,
	setMaterialToHovered,
	setMaterialToSelected,
	setMaterialToTransparent,
	transformViewportPositionToScreenPosition,
}
