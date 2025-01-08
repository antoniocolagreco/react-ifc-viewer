import { IfcModel } from '@/classes'
import path from 'node:path'
import { Group } from 'three'
import { describe, expect, it } from 'vitest'
import { loadIfcModel } from './ifc-loader'

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
			{ path: `${wasmFilePath}/`, absolute: true },
		)

		expect(loadedModel).toBeInstanceOf(Group)
		expect(loadedModel?.children.length).toBeGreaterThan(0)
	})
})
