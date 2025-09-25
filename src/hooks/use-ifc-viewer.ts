import type { IfcLoadingStatus } from '@/components'
import type { IfcElementData, IfcElementLink, Requirements, SelectableRequirements } from '@/types'
import { extractDataToSave, getPercetage, loadIfcProperties, processIfcData, type WasmPathType } from '@/utils'
import { useCallback, useState } from 'react'
import { useGlobalState } from './use-global-state'

/**
 * Main hook for managing IFC viewer state, controls, and utilities.
 *
 * This hook provides comprehensive access to the IFC viewer's functionality including:
 * - Viewport camera controls (focus, fit, reset)
 * - Element selection and querying capabilities
 * - Loading progress monitoring
 * - IFC properties processing utilities
 * - Scene rendering and anchor management
 *
 * @hook
 * @returns {Object} IFC viewer state and control functions
 *
 * @returns {Object} returns.viewPort - Camera and viewport control functions
 * @returns {Function} returns.viewPort.focusView - Centers the camera on selected elements
 * @returns {Function} returns.viewPort.fitView - Adjusts camera to show all/selected elements
 * @returns {Function} returns.viewPort.resetView - Returns camera to initial position
 * @returns {Function} returns.viewPort.changeViewMode - Switches between view modes (All/Transparent/Selectable)
 * @returns {'VIEW_MODE_ALL'|'VIEW_MODE_TRANSPARENT'|'VIEW_MODE_SELECTABLE'} returns.viewPort.viewMode - Current view mode
 *
 * @returns {Object} returns.loadingProgress - IFC loading progress information
 * @returns {'NOT_INITIALIZED'|'FETCHING'|'LOADING_MESHES'|'LOADING_PROPERTIES'|'PROCESSING'|'SETTING_DATA'|'DONE'|'ERROR_FETCHING'|'ERROR_LOADING_MESHES'|'ERROR_LOADING_PROPERTIES'} returns.loadingProgress.status - Current loading phase
 * @returns {number} [returns.loadingProgress.loaded] - Number of items processed
 * @returns {number} [returns.loadingProgress.total] - Total number of items to process
 * @returns {string} [returns.loadingProgress.percentage] - Progress percentage as string
 *
 * @returns {IfcModel|undefined} returns.model - The loaded IFC model instance
 * @returns {IfcElement[]|undefined} returns.selectableElements - Array of elements that can be selected
 *
 * @returns {Function} returns.selectByProperty - Selects element by property criteria and focuses camera
 * @returns {Function} returns.selectByExpressId - Selects element by Express ID and applies visual selection
 * @returns {Function} returns.getElementByExpressId - Retrieves element by Express ID without selection
 * @returns {Function} returns.getElementsWithData - Gets all elements that have property data
 *
 * @returns {Object} returns.utilities - Utility functions for IFC processing
 * @returns {Object} returns.utilities.propertiesReader - IFC properties processing utilities
 * @returns {Function} returns.utilities.propertiesReader.read - Processes IFC file to extract element data
 * @returns {'NOT_INITIALIZED'|'LOADING_PROPERTIES'|'PROCESSING'|'DONE'|'ERROR_LOADING_PROPERTIES'} returns.utilities.propertiesReader.status - Properties reader status
 * @returns {number} returns.utilities.propertiesReader.loaded - Number of properties processed
 * @returns {number} returns.utilities.propertiesReader.total - Total properties to process
 * @returns {string} returns.utilities.propertiesReader.percentage - Processing progress percentage
 *
 * @returns {Function} returns.renderScene - Forces a scene re-render
 * @returns {Function} returns.updateAnchors - Updates overlay anchor positions
 */
const useIfcViewer = () => {
	const { globalState } = useGlobalState()

	const [propertiesReaderProgress, setPropertiesReaderProgress] = useState<IfcLoadingStatus>({
		status: 'NOT_INITIALIZED',
		loaded: 0,
		total: 1,
		percentage: '0%',
	})

	/**
	 * Processes an IFC file buffer to extract and prepare element data for the viewer.
	 *
	 * This function performs a complete analysis of the IFC file, extracting properties,
	 * processing element requirements, and preparing optimized data for fast loading.
	 *
	 * @async
	 * @function
	 * @param {Uint8Array} ifcBuffer - The IFC file content as a byte array
	 * @param {Object} [options] - Configuration options for processing
	 * @param {Object} [options.requirements] - Element filtering and processing requirements
	 * @param {IfcElementLink[]} [options.requirements.linkRequirements] - Define relationships between elements
	 * @param {SelectableRequirements[]} [options.requirements.selectableRequirements] - Elements that can be selected/interacted with
	 * @param {Requirements[]} [options.requirements.alwaysVisibleRequirements] - Elements that remain visible in all view modes
	 * @param {boolean} [options.keepProperties=false] - Whether to retain all element properties (increases file size)
	 * @param {WasmPathType} [options.wasmPath] - Custom path to Web-IFC WASM files
	 *
	 * @returns {Promise<IfcElementData[]>} Processed element data ready for viewer consumption
	 *
	 * @example
	 * // Basic processing
	 * const data = await read(ifcBuffer)
	 *
	 * @example
	 * // Advanced processing with requirements
	 * const data = await read(ifcBuffer, {
	 *   requirements: {
	 *     selectableRequirements: [
	 *       {
	 *         type: 'IfcSensor',
	 *         properties: [{ name: 'SensorType', value: 'Temperature' }]
	 *       }
	 *     ],
	 *     alwaysVisibleRequirements: [
	 *       { type: 'IfcWall' },
	 *       { type: 'IfcSlab' }
	 *     ]
	 *   },
	 *   keepProperties: false, // Optimize file size
	 *   wasmPath: '/custom/wasm/path'
	 * })
	 *
	 * // Save for future use
	 * localStorage.setItem('processedIfc', JSON.stringify(data))
	 *
	 * @throws {Error} When IFC file processing fails
	 * @throws {Error} When required elements are not found
	 *
	 * @see {@link IfcViewer} For using the processed data
	 * @see {@link Requirements} For element filtering syntax
	 */
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
