import { IfcModel } from '@/core/models'
import type { IfcElementData, SelectableRequirements } from '@/core/types'
import path from 'node:path'
import { Group } from 'three'
import { IfcAPI, LogLevel } from 'web-ifc'
import { describe, expect, it } from 'vitest'
import { getIfcElementTypeAndProperties, processIfcData } from '../properties-utils'
import { extractDataToSave } from '../save-utils'
import { loadIfcModel, loadIfcProperties } from './ifc-loader'

const wasmPath = { path: `${path.resolve('public/wasm/')}/`, absolute: true }

const readTestFile = async (fileName: string): Promise<Uint8Array> => {
	const fs = await import('node:fs/promises')
	return new Uint8Array(await fs.readFile(path.resolve('public/test', fileName)))
}

const readProperties = async (bytes: Uint8Array, expressIds?: number[]): Promise<IfcElementData[]> => {
	let ifcElementsData: IfcElementData[] = []
	await loadIfcProperties(
		bytes,
		data => {
			ifcElementsData = data
		},
		() => {},
		error => {
			throw error
		},
		{ wasmPath, expressIds },
	)
	return ifcElementsData
}

describe('loadIfcProperties', () => {
	it('reads the property sets of IFC4 models', async () => {
		const ifcElementsData = await readProperties(await readTestFile('ifc4.ifc'))

		expect(ifcElementsData).toHaveLength(2)
		for (const ifcElementData of ifcElementsData) {
			expect(ifcElementData.properties).toEqual([
				{
					name: 'Pset_Test',
					properties: [
						{ name: 'Code', value: 'W-01' },
						{ name: 'Height', value: 3 },
					],
				},
			])
		}
	})

	it('returns the same data as reading the inverse relationships of each element', async () => {
		const bytes = await readTestFile('castle.ifc')
		const ifcElementsData = await readProperties(bytes)

		const ifcAPI = new IfcAPI()
		ifcAPI.SetWasmPath(wasmPath.path, wasmPath.absolute)
		await ifcAPI.Init()
		ifcAPI.SetLogLevel(LogLevel.LOG_LEVEL_OFF)
		const modelID = ifcAPI.OpenModel(bytes)
		const expected = ifcElementsData.map(({ expressId }) =>
			getIfcElementTypeAndProperties(ifcAPI, modelID, expressId),
		)
		ifcAPI.CloseModel(modelID)

		expect(ifcElementsData).toEqual(expected)
	})

	it('reads only the requested express ids', async () => {
		const ifcElementsData = await readProperties(await readTestFile('ifc4.ifc'), [70])

		expect(ifcElementsData.map(({ expressId, name }) => ({ expressId, name }))).toEqual([
			{ expressId: 70, name: 'Wall B' },
		])
	})
})

describe('load-ifc', () => {
	it('should load the file', async () => {
		const ifcFilePath = path.resolve('public/test/castle.ifc')
		const wasmFilePath = path.resolve('public/wasm/')

		let bytes = new Uint8Array()

		try {
			const fs = await import('node:fs/promises')
			const buffer = await fs.readFile(ifcFilePath)
			bytes = new Uint8Array(buffer)
		} catch (error: unknown) {
			const errorMessage = (error as Error).message
			console.error(errorMessage)
		}

		let loadedModel: IfcModel | undefined

		await loadIfcModel(
			bytes,
			ifcModel => {
				loadedModel = ifcModel
			},
			error => {
				throw error
			},
			{ wasmPath: { path: `${wasmFilePath}/`, absolute: true } },
		)

		expect(loadedModel).toBeInstanceOf(Group)
		expect(loadedModel?.getElements().length).toEqual(152)
	})

	it('should read the properties', async () => {
		const ifcFilePath = path.resolve('public/test/castle.ifc')
		const wasmFilePath = path.resolve('public/wasm/')

		let bytes = new Uint8Array()

		try {
			const fs = await import('node:fs/promises')
			const buffer = await fs.readFile(ifcFilePath)
			bytes = new Uint8Array(buffer)
		} catch (error: unknown) {
			const errorMessage = (error as Error).message
			console.error(errorMessage)
		}

		let ifcModelItemsData: IfcElementData[] | undefined

		await loadIfcProperties(
			bytes,
			data => {
				ifcModelItemsData = data
			},
			() => {},
			error => {
				throw error
			},
			{ wasmPath: { path: `${wasmFilePath}/`, absolute: true } },
		)

		expect(ifcModelItemsData).not.toBeUndefined()
		expect(ifcModelItemsData?.length).toEqual(152)

		if (ifcModelItemsData) {
			const linksRequirements = undefined
			const selectableRequirements: SelectableRequirements[] = [
				{ properties: [{ name: 'Contrassegno' }], type: 'IfcDistributionControlElement' },
			]
			const alwaysVisibleRequirements = undefined

			const total = ifcModelItemsData.length

			for (let index = 0; index < total; index++) {
				const ifcElementData = ifcModelItemsData[index]

				if (!ifcElementData) {
					throw new Error('ifcElement not found')
				}

				processIfcData(
					ifcElementData,
					ifcModelItemsData,
					linksRequirements,
					selectableRequirements,
					alwaysVisibleRequirements,
				)
			}

			const dataToSave = extractDataToSave(ifcModelItemsData, false)

			expect(dataToSave).not.toBeUndefined()

			for (const ifcElementData of Object.values(dataToSave)) {
				expect(ifcElementData.values).not.toBeUndefined()

				if (ifcElementData.values) {
					const valueToCheck = ifcElementData.values['Contrassegno']
					expect(valueToCheck).not.toBeUndefined()
				}
			}
		}
	})
})
