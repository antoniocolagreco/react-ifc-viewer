import { useCallback } from 'react'
import type { IfcModel } from '@/classes'
import type { IfcElementData, IfcElementLink, Requirements, SelectableRequirements } from '@/types'
import {
	alignObject,
	fetchFile,
	loadIfcModel,
	loadIfcProperties,
	processIfcData,
	restoreDataToIfcModelFromProperties,
	restoreDataToIfcModelFromRecord,
} from '@/utils'
import type { IfcLoadingStatus, ViewerRefs } from '../types'

type UseViewerLoaderParams = {
	refs: ViewerRefs
	url: string
	data?: IfcElementData[]
	alwaysVisibleRequirements?: Requirements[]
	selectableRequirements?: SelectableRequirements[]
	linksRequirements?: IfcElementLink[]
	onModelLoaded?: (model: IfcModel) => void
	renderScene: () => void
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
	const loadFile = useCallback(async () => {
		resetScene()

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

			const total = modelData.length
			for (let index = 0; index < total; index += 1) {
				const elementData = modelData[index]
				if (!elementData) {
					throw new Error('IFC element data not found')
				}
				processIfcData(
					elementData,
					modelData,
					linksRequirements,
					selectableRequirements,
					alwaysVisibleRequirements,
				)
				setLoadingProgress({ status: 'PROCESSING', loaded: index, total })
			}
			setLoadingProgress({ status: 'SETTING_DATA' })
			restoreDataToIfcModelFromProperties(model, modelData)
		}

		if (onModelLoaded) {
			onModelLoaded(model)
		}

		setLoadingProgress({ status: 'DONE' })
	}, [
		alwaysVisibleRequirements,
		data,
		linksRequirements,
		onModelLoaded,
		refs,
		renderScene,
		resetScene,
		resetView,
		selectableRequirements,
		setLoadingProgress,
		url,
	])

	return { loadFile }
}

export { useViewerLoader }
