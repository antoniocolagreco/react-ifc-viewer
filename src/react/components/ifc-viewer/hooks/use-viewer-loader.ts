import { useCallback } from 'react'
import type { IfcModel } from '@/core/models'
import type { IfcElementData, IfcElementLink, Requirements, SelectableRequirements } from '@/core/types'
import type { ProcessIfcDataRequest, ProcessIfcDataWorkerMessage } from '@/core/workers/types'
import {
	alignObject,
	fetchFile,
	loadIfcModel,
	loadIfcProperties,
	restoreDataToIfcModelFromProperties,
	restoreDataToIfcModelFromRecord,
} from '@/core/utils'
import { processIfcData } from '@/core/utils'
import type { IfcLoadingStatus, RenderScene, ViewerRefs } from '../types'

type UseViewerLoaderParams = {
	refs: ViewerRefs
	url: string
	data?: IfcElementData[]
	alwaysVisibleRequirements?: Requirements[]
	selectableRequirements?: SelectableRequirements[]
	linksRequirements?: IfcElementLink[]
	onModelLoaded?: (model: IfcModel) => void
	renderScene: RenderScene
	resetScene: () => void
	resetView: () => void
	setLoadingProgress: (status: IfcLoadingStatus) => void
}

type ViewerLoaderApi = {
	loadFile: () => Promise<void>
}

const PROCESS_IFC_DATA_WORKER_URL = new URL(
	'../../../../core/workers/process-ifc-data.worker.ts?worker',
	import.meta.url,
)

const useViewerLoader = ({
	refs,
	url,
	data,
	alwaysVisibleRequirements,
	selectableRequirements,
	linksRequirements,
	onModelLoaded,
	renderScene,
	resetScene,
	resetView,
	setLoadingProgress,
}: UseViewerLoaderParams): ViewerLoaderApi => {
	// Refresh cached raycast targets so selection logic never walks the scene graph during pointer events.
	const refreshRaycastTargets = useCallback(() => {
		const model = refs.modelRef.current
		if (!model) {
			refs.raycastTargetsRef.current = []
			return
		}
		refs.raycastTargetsRef.current = model.getAllMeshes().filter(mesh => mesh.count > 0)
	}, [refs])

	// Prefer a worker so heavy property processing stays off the main thread, but gracefully fallback when unavailable.
	const processDataInWorker = useCallback(
		async (elements: IfcElementData[]): Promise<IfcElementData[]> => {
			if (typeof window === 'undefined' || typeof Worker === 'undefined') {
				const total = elements.length
				for (let index = 0; index < total; index += 1) {
					const element = elements[index]
					if (!element) {
						continue
					}
					processIfcData(
						element,
						elements,
						linksRequirements,
						selectableRequirements,
						alwaysVisibleRequirements,
					)
					const processed = index + 1
					if (processed % 50 === 0 || processed === total) {
						setLoadingProgress({ status: 'PROCESSING', loaded: processed, total })
					}
				}
				return elements
			}

			return await new Promise<IfcElementData[]>((resolve, reject) => {
				const worker = new Worker(PROCESS_IFC_DATA_WORKER_URL, { type: 'module' })

				const cleanup = () => {
					worker.removeEventListener('message', handleMessage)
					worker.removeEventListener('error', handleError)
					worker.terminate()
				}

				const handleMessage = (event: MessageEvent<ProcessIfcDataWorkerMessage>) => {
					const message = event.data
					if (message.type === 'progress') {
						setLoadingProgress({ status: 'PROCESSING', loaded: message.processed, total: message.total })
						return
					}
					if (message.type === 'result') {
						cleanup()
						resolve(message.elements)
						return
					}
					cleanup()
					reject(new Error(message.message))
				}

				const handleError = (event: ErrorEvent) => {
					cleanup()
					reject(event.error instanceof Error ? event.error : new Error(event.message))
				}

				worker.addEventListener('message', handleMessage)
				worker.addEventListener('error', handleError)

				const request: ProcessIfcDataRequest = {
					elements,
					linkRequirements: linksRequirements,
					selectableRequirements,
					alwaysVisibleRequirements,
				}
				worker.postMessage(request)
			})
		},
		[alwaysVisibleRequirements, linksRequirements, selectableRequirements, setLoadingProgress],
	)

	const loadFile = useCallback(async () => {
		resetScene()
		refs.raycastTargetsRef.current = []

		let ifcBuffer: Uint8Array = new Uint8Array()
		setLoadingProgress({ status: 'FETCHING' })

		await fetchFile(
			url,
			buffer => {
				ifcBuffer = buffer
			},
			progress => {
				setLoadingProgress({ status: 'FETCHING', loaded: progress.loaded, total: progress.total })
			},
			error => {
				setLoadingProgress({ status: 'ERROR_FETCHING' })
				throw error
			},
		)

		setLoadingProgress({ status: 'LOADING_MESHES' })

		await loadIfcModel(
			ifcBuffer,
			loadedModel => {
				refs.modelRef.current = loadedModel
				refs.sceneRef.current.add(loadedModel)

				alignObject(loadedModel, { x: 'center', y: 'bottom', z: 'center' })

				refs.sceneRef.current.updateMatrix()
				refs.sceneRef.current.updateMatrixWorld(true)

				refreshRaycastTargets()

				resetView()
				renderScene()
			},
			error => {
				setLoadingProgress({ status: 'ERROR_LOADING_MESHES' })
				throw error
			},
		)

		const model = refs.modelRef.current
		if (!model) {
			throw new Error('Model not found')
		}

		let modelData: IfcElementData[] = []

		if (data) {
			modelData = data
			setLoadingProgress({ status: 'SETTING_DATA' })
			restoreDataToIfcModelFromRecord(model, modelData)
			refreshRaycastTargets()
		} else {
			await loadIfcProperties(
				ifcBuffer,
				propertiesData => {
					modelData = propertiesData
				},
				progress => {
					setLoadingProgress({
						status: 'LOADING_PROPERTIES',
						loaded: progress.loaded,
						total: progress.total,
					})
				},
				error => {
					setLoadingProgress({ status: 'ERROR_LOADING_PROPERTIES' })
					throw error
				},
			)

			if (modelData.length > 0) {
				setLoadingProgress({ status: 'PROCESSING', loaded: 0, total: modelData.length })
				try {
					modelData = await processDataInWorker(modelData)
				} catch (error) {
					setLoadingProgress({ status: 'ERROR_PROCESSING' })
					throw error
				}
			}
			setLoadingProgress({ status: 'SETTING_DATA' })
			restoreDataToIfcModelFromProperties(model, modelData)
			refreshRaycastTargets()
		}

		if (onModelLoaded) {
			onModelLoaded(model)
		}

		setLoadingProgress({ status: 'DONE' })
	}, [
		data,
		processDataInWorker,
		onModelLoaded,
		refreshRaycastTargets,
		refs,
		renderScene,
		resetScene,
		resetView,
		setLoadingProgress,
		url,
	])

	return { loadFile }
}

export { useViewerLoader }
