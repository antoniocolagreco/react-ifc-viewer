import { describe, it, expect, vi } from 'vitest'

const utilsMocks = vi.hoisted(() => ({
	fetchFile: vi.fn(),
	loadIfcModel: vi.fn(),
	loadIfcProperties: vi.fn(),
}))

vi.mock('@/core/utils', async () => {
	const actual = await vi.importActual<typeof import('@/core/utils')>('@/core/utils')
	return {
		...actual,
		...utilsMocks,
	}
})

import { renderHook } from '@testing-library/react'
import { IfcElement, IfcModel } from '@/core/models'
import type { WasmPathType } from '@/core/utils'
import { useViewerLoader } from './use-viewer-loader'
import { useViewerRefs } from './use-viewer-refs'

describe('useViewerLoader', () => {
	it('passes the wasm path to the model and properties loaders', async () => {
		utilsMocks.fetchFile.mockImplementation((_url: string, onLoad: (buffer: Uint8Array) => void) => {
			onLoad(new Uint8Array([1]))
			return Promise.resolve()
		})
		utilsMocks.loadIfcModel.mockImplementation((_buffer: Uint8Array, onLoad: (ifcModel: IfcModel) => void) => {
			const model = new IfcModel()
			model.add(new IfcElement(5))
			onLoad(model)
			return Promise.resolve()
		})
		utilsMocks.loadIfcProperties.mockImplementation(
			(_buffer: Uint8Array, onLoad: (data: { expressId: number }[]) => void) => {
				onLoad([{ expressId: 5 }])
				return Promise.resolve()
			},
		)
		const wasmPath: WasmPathType = { path: '/my-app/wasm/', absolute: true }

		const { result } = renderHook(() =>
			useViewerLoader({
				refs: useViewerRefs(),
				url: '/model.ifc',
				wasmPath,
				renderScene: vi.fn(),
				resetScene: vi.fn(),
				resetView: vi.fn(),
				setLoadingProgress: vi.fn(),
			}),
		)

		await expect(result.current.loadFile()).resolves.toBe(true)
		expect(utilsMocks.loadIfcModel).toHaveBeenCalledWith(
			expect.any(Uint8Array),
			expect.any(Function),
			expect.any(Function),
			{ wasmPath },
		)
		expect(utilsMocks.loadIfcProperties).toHaveBeenCalledWith(
			expect.any(Uint8Array),
			expect.any(Function),
			expect.any(Function),
			expect.any(Function),
			{ wasmPath, expressIds: [5] },
		)
	})
})
