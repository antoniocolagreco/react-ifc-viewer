import { IfcElement, IfcModel } from '@/core/models'
import type { IfcElementData } from '@/core/types'
import { describe, expect, it } from 'vitest'
import { extractDataToSave, restoreDataToIfcModelFromProperties, restoreDataToIfcModelFromRecord } from './save-utils'

const createModel = (...expressIds: number[]): IfcModel => {
	const model = new IfcModel()
	for (const expressId of expressIds) {
		model.add(new IfcElement(expressId))
	}
	return model
}

describe('restoreDataToIfcModelFromProperties', () => {
	it('restores data on the element with the same express id', () => {
		const model = createModel(5, 7)
		const ifcElementsData: IfcElementData[] = [
			{ expressId: 7, type: 'IfcColumn', selectable: true },
			{ expressId: 5, type: 'IfcBeam' },
		]

		restoreDataToIfcModelFromProperties(model, ifcElementsData)

		expect(model.getIfcElement(5)?.userData).toEqual({ expressId: 5, type: 'IfcBeam' })
		expect(model.getIfcElement(7)?.userData).toEqual({ expressId: 7, type: 'IfcColumn', selectable: true })
	})
})

describe('restoreDataToIfcModelFromRecord', () => {
	it('restores data saved by extractDataToSave', () => {
		const model = createModel(5, 7)
		const savedData = extractDataToSave([
			{ expressId: 7, type: 'IfcColumn', selectable: true },
			{ expressId: 5, type: 'IfcBeam' },
		])

		restoreDataToIfcModelFromRecord(model, savedData)

		expect(model.getIfcElement(7)?.userData).toEqual({ expressId: 7, type: 'IfcColumn', selectable: true })
		expect(model.getIfcElement(5)?.userData).toEqual({ expressId: 5 })
	})

	it('restores data given as an array of element data', () => {
		const model = createModel(1, 2)
		const ifcElementsData: IfcElementData[] = [
			{ expressId: 2, type: 'IfcColumn', selectable: true },
			{ expressId: 1, type: 'IfcBeam' },
		]

		restoreDataToIfcModelFromRecord(model, ifcElementsData)

		expect(model.getIfcElement(1)?.userData).toEqual({ expressId: 1, type: 'IfcBeam' })
		expect(model.getIfcElement(2)?.userData).toEqual({ expressId: 2, type: 'IfcColumn', selectable: true })
	})
})
