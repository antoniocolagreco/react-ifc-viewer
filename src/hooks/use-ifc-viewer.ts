import type { IfcLoadingStatus } from '@/components'
import type { IfcElementData, IfcElementLink, Requirements, SelectableRequirements } from '@/types'
import { extractDataToSave, getPercetage, loadIfcProperties, processIfcData, type WasmPathType } from '@/utils'
import { useCallback, useState } from 'react'
import { useGlobalState } from './use-global-state'

/**
 * Custom hook to manage IFC viewer properties and state.
 *
 * @returns An object containing global state and utilities for reading IFC properties.
 *
 * @example
 * const { utilities } = useIfcViewer();
 * const { read } = utilities.propertiesReader;
 *
 * @typedef {Object} LoadingStatus
 * @property {string} status - The current status of the loading process.
 * @property {number} loaded - The number of items loaded.
 * @property {number} total - The total number of items to load.
 * @property {string} percentage - The percentage of items loaded.
 *
 * @typedef {Object} LinkRequirements
 * @typedef {Object} SelectableRequirements
 * @typedef {Object} Requirements
 * @typedef {string} WasmPathType
 * @typedef {Object} IfcElementData
 *
 * @function read
 * @async
 * @param {Uint8Array} ifcBuffer - The buffer containing the IFC data.
 * @param {Object} [options] - Optional parameters for reading IFC properties.
 * @param {Object} [options.requirements] - Requirements for processing IFC elements.
 * @param {IfcElementLink[]} [options.requirements.linkRequirements] - Link requirements for IFC elements.
 * @param {SelectableRequirements[]} [options.requirements.selectableRequirements] - Selectable requirements for IFC elements.
 * @param {Requirements[]} [options.requirements.alwaysVisibleRequirements] - Requirements for always visible IFC elements.
 * @param {boolean} [options.keepProperties] - Flag to keep properties after processing.
 * @param {WasmPathType} [options.wasmPath] - Path to the WebAssembly module.
 * @returns {Promise<IfcElementData[]>} A promise that resolves to an array of processed IFC element data.
 */
const useIfcViewer = () => {
	const { globalState } = useGlobalState()

	const [propertiesReaderProgress, setPropertiesReaderProgress] = useState<IfcLoadingStatus>({
		status: 'NOT_INITIALIZED',
		loaded: 0,
		total: 1,
		percentage: '0%',
	})

	const read = useCallback(
		async (
			ifcBuffer: Uint8Array,
			options?: {
				requirements?: {
					linkRequirements?: IfcElementLink[]
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
					setPropertiesReaderProgress({
						status: 'LOADING_PROPERTIES',
						loaded: progress.loaded,
						total: progress.total,
						percentage: getPercetage(progress.loaded, progress.total),
					})
				},
				error => {
					setPropertiesReaderProgress({ status: 'ERROR_LOADING_PROPERTIES' })
					throw error
				},
				options,
			)

			if (!ifcElementsData) {
				setPropertiesReaderProgress({
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

				setPropertiesReaderProgress({
					status: 'PROCESSING',
					loaded: index,
					total,
					percentage: getPercetage(index, total),
				})
			}

			const dataToSave = extractDataToSave(ifcElementsData, keepProperties)

			setPropertiesReaderProgress({ status: 'DONE', loaded: total, total, percentage: '100%' })
			return dataToSave
		},
		[setPropertiesReaderProgress],
	)

	return { ...globalState, utilities: { propertiesReader: { read, ...propertiesReaderProgress } } }
}

export { useIfcViewer }
