import { IfcElement, IfcModel } from '@/core/models'
import { BoxGeometry, Matrix4, MeshLambertMaterial } from 'three'
import { describe, expect, it } from 'vitest'
import { setMaterialToDefault, setMaterialToHovered, setMaterialToSelected } from './viewer-utils'

const createModelWithElement = () => {
	const model = new IfcModel()
	const element = new IfcElement(1)
	model.add(element)
	const geometry = new BoxGeometry(1, 1, 1)
	const material = new MeshLambertMaterial({ color: 0xff0000 })
	model.setElementGeometry('geom-O', geometry)
	model.setElementMaterial('mat-O', material)
	model.addInstanceRecord({
		element,
		geometry,
		geometryId: 'geom-O',
		material,
		materialId: 'mat-O',
		matrix: new Matrix4(),
	})
	return { model, element }
}

describe('viewer materials', () => {
	it('keeps the selected colour stable across selections', () => {
		const { model, element } = createModelWithElement()

		setMaterialToSelected(element, model)
		const firstColor = model.getElementSelectMaterial('mat-O')?.color.getHex()
		setMaterialToDefault(element, model)
		setMaterialToSelected(element, model)
		setMaterialToDefault(element, model)
		setMaterialToSelected(element, model)

		expect(model.getElementSelectMaterial('mat-O')?.color.getHex()).toBe(firstColor)
	})

	it('keeps the hovered colour stable across hovers', () => {
		const { model, element } = createModelWithElement()

		setMaterialToHovered(element, model)
		const firstColor = model.getElementHoverMaterial('mat-O')?.color.getHex()
		setMaterialToDefault(element, model)
		setMaterialToHovered(element, model)
		setMaterialToDefault(element, model)
		setMaterialToHovered(element, model)

		expect(model.getElementHoverMaterial('mat-O')?.color.getHex()).toBe(firstColor)
	})
})
