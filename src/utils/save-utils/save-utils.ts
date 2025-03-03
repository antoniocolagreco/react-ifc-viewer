import type { IfcModel } from '@/classes'
import type { IfcElementData } from '@/types'

type IfcElementDataRecord = Record<number, Omit<IfcElementData, 'expressId'>>

/**
 * Extracts and returns a record of IFC element data to be saved from the given IFC model.
 *
 * @param ifcModel - The IFC model containing elements to be processed.
 * @returns A record where the keys are Express IDs and the values are the corresponding IFC element data.
 */
const extractDataToSave = (ifcElementsData: IfcElementData[], keepProperties = false): IfcElementDataRecord => {
	const ifcElementsDataToSave = ifcElementsData.filter(
		ifcElement => ifcElement.alwaysVisible || ifcElement.selectable || ifcElement.links || ifcElement.values,
	)
	const saveData: IfcElementDataRecord = {}
	for (const ifcElementData of ifcElementsDataToSave) {
		const { expressId, properties, ...rest } = ifcElementData
		const dataToSave: Omit<IfcElementData, 'expressId'> = { ...rest }
		if (keepProperties) {
			dataToSave.properties = properties
		}
		saveData[expressId] = dataToSave
	}
	return saveData
}

/**
 * Restores data to an IFC model from a saved data record.
 *
 * This function iterates over the children of the given IFC model and updates
 * their user data with the corresponding data from the saved data record.
 *
 * @param ifcModel - The IFC model whose elements' data will be restored.
 * @param savedData - A record containing the saved data for the IFC elements,
 *                    keyed by their expressId.
 */
const restoreDataToIfcModelFromRecord = (ifcModel: IfcModel, savedData: IfcElementDataRecord): void => {
	for (const ifcElement of ifcModel.children) {
		const data = savedData[ifcElement.userData.expressId]
		if (!data) {
			continue
		}
		ifcElement.userData = { ...ifcElement.userData, ...data }
	}
}

/**
 * Restores data to an IFC model from a given set of IFC element data.
 *
 * This function iterates over the children of the provided IFC model and updates
 * their userData properties with the corresponding data from the ifcElementsData array.
 * The matching is done based on the expressId property.
 *
 * @param ifcModel - The IFC model whose elements' data will be restored.
 * @param ifcElementsData - An array of IFC element data objects to restore into the model.
 */
const restoreDataToIfcModelFromProperties = (ifcModel: IfcModel, ifcElementsData: IfcElementData[]): void => {
	for (const ifcElement of ifcModel.children) {
		const data = ifcElementsData.find(data => data.expressId === ifcElement.userData.expressId)
		if (!data) {
			continue
		}
		ifcElement.userData = { ...ifcElement.userData, ...data }
	}
}

export { extractDataToSave, restoreDataToIfcModelFromProperties, restoreDataToIfcModelFromRecord }
