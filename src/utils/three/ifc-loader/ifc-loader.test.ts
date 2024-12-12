import type IfcModel from '@/classes/ifc-model'
import { fetchFile } from '@/utils/fetch-file'
import path from 'node:path'
import { Group } from 'three'
import { describe, expect, it } from 'vitest'
import { loadIfcModel } from './ifc-loader'

describe('load-ifc', () => {
	it('should load the file', async () => {
		const url = path.resolve('public/test/', 'castle.ifc')

		let ifcBuffer: Uint8Array = new Uint8Array(0)

		await fetchFile(
			url,
			buffer => {
				ifcBuffer = buffer
			},
			() => {},
			error => {
				throw error
			},
		)

		let loadedModel: IfcModel | undefined

		await loadIfcModel(
			ifcBuffer,
			ifcModel => {
				loadedModel = ifcModel
			},
			error => {
				throw error
			},
		)

		expect(loadedModel).toBeInstanceOf(Group)
		expect(loadedModel?.children.length).toBeGreaterThan(0)
	})
})
