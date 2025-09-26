import { IfcModel } from '@/core/models'
import type { IfcElementData, SelectableRequirements } from '@/core/types'
import path from 'node:path'
import { Group } from 'three'
import { describe, expect, it } from 'vitest'
import { processIfcData } from '../properties-utils'
import { extractDataToSave } from '../save-utils'
import { loadIfcModel, loadIfcProperties } from './ifc-loader'

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
