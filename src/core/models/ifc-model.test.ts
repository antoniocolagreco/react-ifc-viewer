import { IfcElement, IfcModel } from '@/core/models'
import { createBoundingSphereFromElement } from '@/core/utils'
import { Box3, BoxGeometry, Matrix4, MeshLambertMaterial } from 'three'
import { describe, expect, it } from 'vitest'

describe('IfcModel instanced mesh management', () => {
	it('finds elements by express id', () => {
		const model = new IfcModel()
		const first = new IfcElement(3)
		const second = new IfcElement(4)
		model.add(first, second)

		expect(model.getIfcElement(3)).toBe(first)
		expect(model.getIfcElement(4)).toBe(second)
		expect(model.getIfcElement(5)).toBeUndefined()
	})

	it('keeps instanced mesh bounds in sync with added instances', () => {
		const model = new IfcModel()
		const geometry = new BoxGeometry(1, 1, 1)
		const material = new MeshLambertMaterial()
		const geometryId = 'geom-bounds-O'
		const materialId = 'mat-bounds-O'
		model.setElementGeometry(geometryId, geometry)
		model.setElementMaterial(materialId, material)

		const near = new IfcElement(1)
		const far = new IfcElement(2)
		model.add(near, far)
		model.addInstanceRecord({
			element: near,
			geometry,
			geometryId,
			material,
			materialId,
			matrix: new Matrix4(),
		})
		model.updateMatrixWorld(true)
		const initialBox = new Box3().setFromObject(model)
		expect(initialBox.max.x).toBeCloseTo(0.5)

		model.addInstanceRecord({
			element: far,
			geometry,
			geometryId,
			material,
			materialId,
			matrix: new Matrix4().makeTranslation(10, 0, 0),
		})
		const updatedBox = new Box3().setFromObject(model)

		expect(updatedBox.max.x).toBeCloseTo(10.5)
	})

	it('creates instance records and moves between states', () => {
		const model = new IfcModel()
		const element = new IfcElement(1)
		model.add(element)

		const geometry = new BoxGeometry(1, 1, 1)
		geometry.computeBoundingBox()

		const baseMaterial = new MeshLambertMaterial({ color: 0xff0000 })

		const geometryId = 'geom-1-O'
		const materialId = 'mat-1-O'

		model.setElementGeometry(geometryId, geometry)
		model.setElementMaterial(materialId, baseMaterial)

		const modelMatrix = new Matrix4().makeTranslation(2, 0, 0)

		const record = model.addInstanceRecord({
			element,
			geometry,
			geometryId,
			material: baseMaterial,
			materialId,
			matrix: modelMatrix,
		})

		expect(element.getInstanceRecords()).toHaveLength(1)
		expect(model.getElements()).toHaveLength(1)
		expect(record.handle?.mesh.count).toBe(1)
		expect(model.getAllMeshes()).toHaveLength(1)

		const selectedMaterial = new MeshLambertMaterial({ color: 0x00ff00 })
		model.moveRecordToState(record, 'selected', () => selectedMaterial)
		expect(record.state).toBe('selected')
		expect(record.handle?.mesh.material).toBe(selectedMaterial)

		model.hideRecord(record)
		expect(record.handle).toBeUndefined()
		expect(record.state).toBe('hidden')

		model.setRecordToDefault(record)
		expect(record.state).toBe('default')
		expect(record.handle?.mesh.material).toBe(baseMaterial)
	})

	it('computes bounding spheres from instance matrices', () => {
		const model = new IfcModel()
		const element = new IfcElement(10)
		model.add(element)

		const geometry = new BoxGeometry(2, 2, 2)
		geometry.computeBoundingBox()

		const baseMaterial = new MeshLambertMaterial({ color: 0x336699 })

		const geometryId = 'geom-2-O'
		const materialId = 'mat-2-O'

		model.setElementGeometry(geometryId, geometry)
		model.setElementMaterial(materialId, baseMaterial)

		const translationMatrix = new Matrix4().makeTranslation(5, 0, 0)

		const record = model.addInstanceRecord({
			element,
			geometry,
			geometryId,
			material: baseMaterial,
			materialId,
			matrix: translationMatrix,
		})

		const boundingSphere = createBoundingSphereFromElement(element, model)
		expect(boundingSphere.center.x).toBeCloseTo(5)
		expect(boundingSphere.radius).toBeGreaterThan(0)

		model.hideRecord(record)
		const hiddenBoundingSphere = createBoundingSphereFromElement(element, model)
		expect(hiddenBoundingSphere.radius).toBeGreaterThan(0)
		expect(hiddenBoundingSphere.center.x).toBeCloseTo(5)
	})
})
