import type { IfcElementData, IfcElementLink } from '@/core/types'
import { describe, expect, it } from 'vitest'
import { processAllIfcData, processIfcData, satisfiesRequirements } from './properties-utils'

const createSensor = (expressId: number, column: string): IfcElementData => ({
	expressId,
	type: 'IfcSensor',
	properties: [{ name: 'Pset', properties: [{ name: 'Column', value: column }] }],
})

const createColumn = (expressId: number, code: string): IfcElementData => ({
	expressId,
	type: 'IfcColumn',
	properties: [
		{
			name: 'Pset',
			properties: [
				{ name: 'Code', value: code },
				{ name: 'Column', value: code },
			],
		},
	],
})

const columnSensorLink: IfcElementLink = {
	sharedProperty: 'Column',
	source: { linkName: 'sensors', type: 'IfcColumn', properties: [{ name: 'Code' }] },
	target: { linkName: 'columns', type: 'IfcSensor' },
}

describe('satisfiesRequirements', () => {
	it('matches an element without property sets by express id', () => {
		const element: IfcElementData = { expressId: 7, type: 'IfcWall' }
		expect(satisfiesRequirements(element, { expressId: 7 })).toBe(true)
	})

	it('matches an element without property sets by tag', () => {
		const element: IfcElementData = { expressId: 8, type: 'IfcWall', tag: { value: 'W-1' } }
		expect(satisfiesRequirements(element, { tag: { value: 'W-1' } })).toBe(true)
	})

	it('still requires the listed properties', () => {
		const element: IfcElementData = { expressId: 9, type: 'IfcWall' }
		expect(satisfiesRequirements(element, { expressId: 9, properties: [{ name: 'Code' }] })).toBe(false)
	})
})

describe('processIfcData', () => {
	it('marks an element always visible when it satisfies any requirement', () => {
		const wall: IfcElementData = { expressId: 1, type: 'IfcWall' }
		const slab: IfcElementData = { expressId: 2, type: 'IfcSlab' }
		const beam: IfcElementData = { expressId: 3, type: 'IfcBeam' }
		const all = [wall, slab, beam]
		const alwaysVisible = [{ type: 'IfcWall' }, { type: 'IfcSlab' }]

		for (const element of all) {
			processIfcData(element, all, undefined, undefined, alwaysVisible)
		}

		expect(wall.alwaysVisible).toBe(true)
		expect(slab.alwaysVisible).toBe(true)
		expect(beam.alwaysVisible).toBe(false)
	})

	it('requires the linked elements of a selectable requirement', () => {
		const linked: IfcElementData = { expressId: 1, type: 'IfcColumn', links: { sensors: [10] } }
		const emptyLink: IfcElementData = { expressId: 2, type: 'IfcColumn', links: { sensors: [] } }
		const otherLink: IfcElementData = { expressId: 3, type: 'IfcColumn', links: { cameras: [20] } }
		const all = [linked, emptyLink, otherLink]
		const selectable = [{ type: 'IfcColumn', links: ['sensors'] }]

		for (const element of all) {
			processIfcData(element, all, undefined, selectable)
		}

		expect(linked.selectable).toBe(true)
		expect(emptyLink.selectable).toBe(false)
		expect(otherLink.selectable).toBe(false)
	})
})

describe('processAllIfcData', () => {
	it('links sources and targets sharing the property value', () => {
		const column1 = createColumn(1, 'A')
		const column2 = createColumn(2, 'B')
		const sensor1 = createSensor(10, 'A')
		const sensor2 = createSensor(11, 'A')
		const sensor3 = createSensor(12, 'C')

		processAllIfcData([column1, column2, sensor1, sensor2, sensor3], [columnSensorLink])

		expect(column1.links).toEqual({ sensors: [10, 11] })
		expect(column2.links).toBeUndefined()
		expect(sensor1.links).toEqual({ columns: [1] })
		expect(sensor2.links).toEqual({ columns: [1] })
		expect(sensor3.links).toBeUndefined()
	})

	it('evaluates link based selectability after every link is set', () => {
		const sensor = createSensor(10, 'A')
		const column = createColumn(1, 'A')
		const selectable = [{ type: 'IfcSensor', links: ['columns'] }]

		processAllIfcData([sensor, column], [columnSensorLink], selectable)

		expect(sensor.links).toEqual({ columns: [1] })
		expect(sensor.selectable).toBe(true)
	})

	it('produces the same links as processing each element in order', () => {
		const createData = () => [
			createColumn(1, 'A'),
			createSensor(10, 'A'),
			createColumn(2, 'B'),
			createSensor(11, 'B'),
			createSensor(12, 'A'),
			createColumn(3, 'C'),
		]
		const sequential = createData()
		for (const element of sequential) {
			processIfcData(element, sequential, [columnSensorLink])
		}
		const batched = createData()

		processAllIfcData(batched, [columnSensorLink])

		expect(batched).toEqual(sequential)
	})
})
