import { IfcModel } from '@/core/models'
import type { IfcElementData, ProgressStatus } from '@/core/types'
import { buildifcElement, buildPropertySetsIndex, getIfcElementTypeAndProperties, getPath } from '@/core/utils'
import { IfcAPI, LogLevel } from 'web-ifc'

type WasmPathType = { path: string; absolute?: boolean }

const ifcAPICache = new Map<string, Promise<IfcAPI>>()

const getIfcAPI = (wasmPath: WasmPathType): Promise<IfcAPI> => {
	const cacheKey = `${wasmPath.path}|${String(wasmPath.absolute)}`
	const cachedIfcAPI = ifcAPICache.get(cacheKey)
	if (cachedIfcAPI) {
		return cachedIfcAPI
	}
	const ifcAPI = new IfcAPI()
	ifcAPI.SetWasmPath(wasmPath.path, wasmPath.absolute)
	const initializedIfcAPI = ifcAPI.Init().then(() => {
		ifcAPI.SetLogLevel(LogLevel.LOG_LEVEL_OFF)
		return ifcAPI
	})
	initializedIfcAPI.catch(() => ifcAPICache.delete(cacheKey))
	ifcAPICache.set(cacheKey, initializedIfcAPI)
	return initializedIfcAPI
}

const YIELD_INTERVAL_MS = 50

const yieldToEventLoop = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 0))

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

	const ifcModel = new IfcModel()

	let ifcAPI: IfcAPI | undefined
	let modelID = -1

	try {
		ifcAPI = await getIfcAPI(wasmPath)
		const api = ifcAPI

		modelID = api.OpenModel(ifcBuffer)

		api.StreamAllMeshes(modelID, flatMesh => {
			const ifcElement = buildifcElement(api, modelID, flatMesh, ifcModel)
			ifcModel.add(ifcElement)
		})

		onLoad(ifcModel)
	} catch (error) {
		onError(error as Error)
	} finally {
		if (ifcAPI && modelID !== -1) {
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
		expressIds?: number[]
	},
) => Promise<void>

const loadIfcProperties: LoadIfcDataType = async (ifcBuffer, onLoad, onProgress, onError, options) => {
	const defaultWasmPath: WasmPathType = {
		path: `${await getPath()}wasm/`,
		absolute: true,
	}

	const wasmPath = options?.wasmPath ?? defaultWasmPath

	let ifcAPI: IfcAPI | undefined
	let modelID = -1

	try {
		ifcAPI = await getIfcAPI(wasmPath)
		const api = ifcAPI

		modelID = api.OpenModel(ifcBuffer)
		const openedModelID = modelID

		let expressIds = options?.expressIds
		if (!expressIds) {
			const streamedExpressIds: number[] = []
			api.StreamAllMeshes(openedModelID, flatMesh => {
				streamedExpressIds.push(flatMesh.expressID)
			})
			expressIds = streamedExpressIds
		}

		const total = expressIds.length
		const propertySetsIndex = buildPropertySetsIndex(api, openedModelID)
		const data: IfcElementData[] = []
		let lastYield = performance.now()

		for (const expressId of expressIds) {
			data.push(getIfcElementTypeAndProperties(api, openedModelID, expressId, propertySetsIndex))
			if (performance.now() - lastYield > YIELD_INTERVAL_MS) {
				onProgress({ state: 'PROGRESS', loaded: data.length, total })
				await yieldToEventLoop()
				lastYield = performance.now()
			}
		}

		onProgress({ state: 'PROGRESS', loaded: total, total })
		onProgress({ state: 'DONE', loaded: total, total })
		onLoad(data)
	} catch (error: unknown) {
		onProgress({ state: 'ERROR' })
		onError(error as Error)
	} finally {
		if (ifcAPI && modelID !== -1) {
			ifcAPI.CloseModel(modelID)
		}
	}
}

export { loadIfcModel, loadIfcProperties, type WasmPathType }
