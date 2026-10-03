import { useCallback, useRef } from 'react'
import type { IfcModel } from '@/core/models'
import type { IfcElementData, IfcElementLink, Requirements, SelectableRequirements } from '@/core/types'
import {
	alignObject,
	disposeObjects,
	fetchFile,
	loadIfcModel,
	loadIfcProperties,
	processAllIfcData,
	restoreDataToIfcModelFromProperties,
	restoreDataToIfcModelFromRecord,
	type IfcElementDataRecord,
	type WasmPathType,
} from '@/core/utils'
import type { IfcLoadingStatus, RenderScene, ViewerRefs } from '../types'

type UseViewerLoaderParams = {
	refs: ViewerRefs
	url: string
	data?: IfcElementData[] | IfcElementDataRecord
	alwaysVisibleRequirements?: Requirements[]
	selectableRequirements?: SelectableRequirements[]
	linksRequirements?: IfcElementLink[]
	wasmPath?: WasmPathType
	onModelLoaded?: (model: IfcModel) => void
	renderScene: RenderScene
	resetScene: () => void
	resetView: () => void
	setLoadingProgress: (status: IfcLoadingStatus) => void
}

type ViewerLoaderApi = {
	loadFile: () => Promise<boolean>
	cancelLoading: () => void
}

const useViewerLoader = ({
	refs,
	url,
	data,
	alwaysVisibleRequirements,
	selectableRequirements,
	linksRequirements,
	wasmPath,
	onModelLoaded,
	renderScene,
	resetScene,
	resetView,
	setLoadingProgress,
}: UseViewerLoaderParams): ViewerLoaderApi => {
	const loadIdRef = useRef(0)

	// Refresh cached raycast targets so selection logic never walks the scene graph during pointer events.
	const refreshRaycastTargets = useCallback(() => {
		const model = refs.modelRef.current
		if (!model) {
			refs.raycastTargetsRef.current = []
			return
		}
		refs.raycastTargetsRef.current = model.getAllMeshes().filter(mesh => mesh.count > 0)
	}, [refs])

	const cancelLoading = useCallback(() => {
		loadIdRef.current += 1
	}, [])

	const loadFile = useCallback(async () => {
		loadIdRef.current += 1
		const loadId = loadIdRef.current
		const isCurrentLoad = () => loadId === loadIdRef.current
		const setProgress = (status: IfcLoadingStatus) => {
			if (isCurrentLoad()) {
				setLoadingProgress(status)
			}
		}

		resetScene()
		refs.modelRef.current = undefined
		refs.raycastTargetsRef.current = []
		refs.selectedIfcElementRef.current = undefined
		refs.previousSelectedIfcElementRef.current = undefined
		refs.selectedInstanceRecordRef.current = undefined
		refs.hoveredIfcElementRef.current = undefined
		refs.previousHoveredIfcElementRef.current = undefined
		refs.ifcMarkerLinksRef.current = []

		let ifcBuffer: Uint8Array = new Uint8Array()
		setProgress({ status: 'FETCHING' })

		await fetchFile(
			url,
			buffer => {
				ifcBuffer = buffer
			},
			progress => {
				setProgress({ status: 'FETCHING', loaded: progress.loaded, total: progress.total })
			},
			error => {
				setProgress({ status: 'ERROR_FETCHING' })
				throw error
			},
		)

		if (!isCurrentLoad()) {
			return false
		}

		setProgress({ status: 'LOADING_MESHES' })

		let model: IfcModel | undefined

		await loadIfcModel(
			ifcBuffer,
			loadedModel => {
				if (!isCurrentLoad()) {
					disposeObjects(loadedModel)
					return
				}

				model = loadedModel
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
				setProgress({ status: 'ERROR_LOADING_MESHES' })
				throw error
			},
			{ wasmPath },
		)

		if (!isCurrentLoad()) {
			return false
		}
		if (!model) {
			throw new Error('Model not found')
		}

		if (data) {
			setProgress({ status: 'SETTING_DATA' })
			restoreDataToIfcModelFromRecord(model, data)
			refreshRaycastTargets()
		} else {
			let modelData: IfcElementData[] = []

			await loadIfcProperties(
				ifcBuffer,
				propertiesData => {
					modelData = propertiesData
				},
				progress => {
					setProgress({
						status: 'LOADING_PROPERTIES',
						loaded: progress.loaded,
						total: progress.total,
					})
				},
				error => {
					setProgress({ status: 'ERROR_LOADING_PROPERTIES' })
					throw error
				},
				{ wasmPath, expressIds: model.getElements().map(ifcElement => ifcElement.userData.expressId) },
			)

			if (!isCurrentLoad()) {
				return false
			}

			setProgress({ status: 'PROCESSING', loaded: 0, total: modelData.length })
			processAllIfcData(modelData, linksRequirements, selectableRequirements ?? [], alwaysVisibleRequirements)
			setProgress({ status: 'SETTING_DATA' })
			restoreDataToIfcModelFromProperties(model, modelData)
			refreshRaycastTargets()
		}

		if (onModelLoaded) {
			onModelLoaded(model)
		}

		setProgress({ status: 'DONE' })
		return true
	}, [
		alwaysVisibleRequirements,
		data,
		linksRequirements,
		onModelLoaded,
		refreshRaycastTargets,
		refs,
		renderScene,
		resetScene,
		resetView,
		selectableRequirements,
		setLoadingProgress,
		url,
		wasmPath,
	])

	return { loadFile, cancelLoading }
}

export { useViewerLoader }
