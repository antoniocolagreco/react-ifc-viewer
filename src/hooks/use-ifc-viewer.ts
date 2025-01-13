import type { LoadingStatus } from '@/components/ifc-viewer/types'
import type { IfcElementData, LinkRequirements, Requirements, SelectableRequirements } from '@/types'
import { extractDataToSave, getPercetage, loadIfcProperties, processIfcData, type WasmPathType } from '@/utils'
import { useCallback, useState } from 'react'
import { useGlobalState } from './use-global-state'

/**
 * Custom hook to manage IFC viewer state and operations.
 *
 * @returns An object containing the viewport commands and utility functions.
 *
 * @example
 * const { viewPort, utilities } = useIfcViewer();
 *
 * @typedef {Object} LoadingStatus
 * @property {string} status - The current status of the loading process.
 * @property {number} loaded - The number of items loaded.
 * @property {number} total - The total number of items to load.
 * @property {string} percentage - The loading progress as a percentage.
 *
 * @typedef {Object} LinkRequirements
 * @typedef {Object} SelectableRequirements
 * @typedef {Object} Requirements
 * @typedef {string} WasmPathType
 * @typedef {Object} IfcElementData
 *
 * @function readProperties
 * Reads and processes IFC properties from a given buffer.
 *
 * @param {Uint8Array} ifcBuffer - The buffer containing the IFC data.
 * @param {Object} [options] - Optional parameters for reading properties.
 * @param {Object} [options.requirements] - Requirements for processing IFC data.
 * @param {LinkRequirements[]} [options.requirements.linkRequirements] - Link requirements.
 * @param {SelectableRequirements[]} [options.requirements.selectableRequirements] - Selectable requirements.
 * @param {Requirements[]} [options.requirements.alwaysVisibleRequirements] - Always visible requirements.
 * @param {boolean} [options.keepProperties] - Whether to keep properties after processing.
 * @param {WasmPathType} [options.wasmPath] - Path to the WebAssembly module.
 *
 * @returns {Promise<IfcElementData[]>} A promise that resolves to the processed IFC element data.
 */
const useIfcViewer = () => {
	const { globalState } = useGlobalState()

	const [loadingStatus, setLoadingStatus] = useState<LoadingStatus>({
		status: 'NOT_INITIALIZED',
		loaded: 0,
		total: 1,
		percentage: '0%',
	})

	const readProperties = useCallback(
		async (
			ifcBuffer: Uint8Array,
			options?: {
				requirements?: {
					linkRequirements?: LinkRequirements[]
					selectableRequirements?: SelectableRequirements[]
					alwaysVisibleRequirements?: Requirements[]
				}
				keepProperties?: boolean
				wasmPath?: WasmPathType
			},
		) => {
			const linksRequirements = options?.requirements?.linkRequirements
			const selectableRequirements = options?.requirements?.selectableRequirements
			const alwaysVisibleRequirements = options?.requirements?.alwaysVisibleRequirements
			const keepProperties = options?.keepProperties ?? false

			let ifcElementsData: IfcElementData[] | undefined

			await loadIfcProperties(
				ifcBuffer,
				data => {
					ifcElementsData = data
				},
				progress => {
					setLoadingStatus({
						status: 'LOADING_PROPERTIES',
						loaded: progress.loaded,
						total: progress.total,
						percentage: getPercetage(progress.loaded, progress.total),
					})
				},
				error => {
					setLoadingStatus({ status: 'ERROR_LOADING_PROPERTIES' })
					throw error
				},
				options,
			)

			if (!ifcElementsData) {
				setLoadingStatus({
					status: 'ERROR_LOADING_PROPERTIES',
				})
				return []
			}

			const total = ifcElementsData.length
			for (let index = 0; index < total; index++) {
				const ifcElementData = ifcElementsData[index]

				if (!ifcElementData) {
					throw new Error('ifcElement not found')
				}

				processIfcData(
					ifcElementData,
					ifcElementsData,
					linksRequirements,
					selectableRequirements,
					alwaysVisibleRequirements,
				)

				setLoadingStatus({
					status: 'PROCESSING',
					loaded: index,
					total,
					percentage: getPercetage(index, total),
				})
			}

			const dataToSave = extractDataToSave(ifcElementsData, keepProperties)

			setLoadingStatus({ status: 'DONE', loaded: total, total, percentage: '100%' })
			return dataToSave
		},
		[],
	)

	return { ...globalState, utilities: { readProperties, loadingStatus } }
}

export { useIfcViewer }
