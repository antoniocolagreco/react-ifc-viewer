import IfcModel from '@/classes/ifc-model'
import { IfcProgressEvent } from '@/classes/ifc-progress-event'
import type { IfcElementData } from '@/types/types'
import { getIfcElementTypeAndProperties } from '@/utils/ifc/properties-utils'
import { IfcAPI, LogLevel } from 'web-ifc'
import { buildifcElement } from '../meshes-utils/meshes-utils'

type LoadIfcFunctionType = (
	ifcBuffer: Uint8Array,
	onLoad: (ifcModel: IfcModel) => void,
	onError: (error: Error) => void,
) => Promise<void>

const loadIfcModel: LoadIfcFunctionType = async (ifcBuffer, onLoad, onError) => {
	const ifcAPI = new IfcAPI()
	const ifcModel = new IfcModel()

	let modelID = -1

	try {
		const wasmPath = {
			path: `${location.origin}${import.meta.env.BASE_URL}wasm/`,
			absolute: true,
		}

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
	onProgress: (status: IfcProgressEvent) => void,
	onError: (error: Error) => void,
) => Promise<void>

const loadIfcProperties: LoadIfcDataType = async (ifcBuffer: Uint8Array, onLoad, onProgress, onError) => {
	const ifcAPI = new IfcAPI()

	let modelID = -1

	try {
		const wasmPath = {
			path: `${location.origin}${import.meta.env.BASE_URL}wasm/`,
			absolute: true,
		}

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
			onProgress(
				new IfcProgressEvent('PROGRESS', {
					loaded,
					total,
					lengthComputable: true,
				}),
			)
		}

		onProgress(
			new IfcProgressEvent('DONE', {
				loaded,
				total,
				lengthComputable: true,
			}),
		)
		onLoad(data)
	} catch (error) {
		onProgress(new IfcProgressEvent('ERROR'))
		onError(error as Error)
	} finally {
		if (modelID !== -1) {
			ifcAPI.CloseModel(modelID)
		}
	}
}

export { loadIfcModel, loadIfcProperties }
