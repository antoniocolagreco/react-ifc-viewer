import { IfcModel } from '@/classes'
import type { IfcElementData, ProgressStatus } from '@/types'
import { buildifcElement, getIfcElementTypeAndProperties, getPath } from '@/utils'
import { IfcAPI, LogLevel } from 'web-ifc'

type WasmPathType = { path: string; absolute?: boolean }

type LoadIfcFunctionType = (
	ifcBuffer: Uint8Array,
	onLoad: (ifcModel: IfcModel) => void,
	onError: (error: Error) => void,
	options?: { wasmPath?: WasmPathType },
) => Promise<void>

const loadIfcModel: LoadIfcFunctionType = async (ifcBuffer, onLoad, onError, options) => {
	const defaultWasmPath: WasmPathType = {
		path: `${await getPath()}wasm/`,
		absolute: true,
	}

	const wasmPath = options?.wasmPath ?? defaultWasmPath

	const ifcAPI = new IfcAPI()
	const ifcModel = new IfcModel()

	let modelID = -1

	try {
		ifcAPI.SetWasmPath(wasmPath.path, wasmPath.absolute)

		await ifcAPI.Init()
		ifcAPI.SetLogLevel(LogLevel.LOG_LEVEL_OFF)

		modelID = ifcAPI.OpenModel(ifcBuffer)

		ifcAPI.StreamAllMeshes(modelID, flatMesh => {
			const ifcElement = buildifcElement(ifcAPI, modelID, flatMesh, ifcModel)
			ifcModel.add(ifcElement)
		})

		onLoad(ifcModel)
	} catch (error) {
		onError(error as Error)
	} finally {
		if (modelID !== -1) {
			ifcAPI.CloseModel(modelID)
		}
	}
}

type LoadIfcDataType = (
	ifcBuffer: Uint8Array,
	onLoad: (data: IfcElementData[]) => void,
	onProgress: (status: ProgressStatus) => void,
	onError: (error: Error) => void,
	options?: {
		wasmPath?: WasmPathType
	},
) => Promise<void>

const loadIfcProperties: LoadIfcDataType = async (ifcBuffer, onLoad, onProgress, onError, options) => {
	const defaultWasmPath: WasmPathType = {
		path: `${await getPath()}wasm/`,
		absolute: true,
	}

	const wasmPath = options?.wasmPath ?? defaultWasmPath

	const ifcAPI = new IfcAPI()

	let modelID = -1

	try {
		ifcAPI.SetWasmPath(wasmPath.path, wasmPath.absolute)

		await ifcAPI.Init()
		ifcAPI.SetLogLevel(LogLevel.LOG_LEVEL_OFF)

		modelID = ifcAPI.OpenModel(ifcBuffer)

		let loaded = 0
		let total = 0

		const promises: Promise<IfcElementData>[] = []

		ifcAPI.StreamAllMeshes(modelID, flatMesh => {
			total++
			const ifcDataPromise = new Promise<IfcElementData>(resolve => {
				setTimeout(() => {
					resolve(getIfcElementTypeAndProperties(ifcAPI, modelID, flatMesh.expressID))
				}, 0)
			})
			promises.push(ifcDataPromise)
		})

		const data: IfcElementData[] = []

		for (const promise of promises) {
			const ifcUserData = await promise
			data.push(ifcUserData)
			loaded++
			onProgress({ state: 'PROGRESS', loaded, total })
		}

		onProgress({ state: 'DONE', loaded, total })
		onLoad(data)
	} catch (error) {
		onProgress({ state: 'ERROR' })
		onError(error as Error)
	} finally {
		if (modelID !== -1) {
			ifcAPI.CloseModel(modelID)
		}
	}
}

export { loadIfcModel, loadIfcProperties, type WasmPathType }
