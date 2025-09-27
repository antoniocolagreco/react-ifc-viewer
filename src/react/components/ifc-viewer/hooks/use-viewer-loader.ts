import { useCallback } from 'react'
import type { IfcModel } from '@/core/models'
import type { IfcElementData, IfcElementLink, Requirements, SelectableRequirements } from '@/core/types'
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

	// Process properties synchronously to keep logic simple and avoid worker deployment issues.
	const processData = useCallback(
		(elements: IfcElementData[]): IfcElementData[] => {
			const total = elements.length
			for (let index = 0; index < total; index += 1) {
				const element = elements[index]
				if (!element) {
					continue
				}
				processIfcData(element, elements, linksRequirements, selectableRequirements, alwaysVisibleRequirements)
				const processed = index + 1
				if (processed % 50 === 0 || processed === total) {
					setLoadingProgress({ status: 'PROCESSING', loaded: processed, total })
				}
			}
			return elements
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
				modelData = processData(modelData)
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
		processData,
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
