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
		ifcElement => ifcElement.alwaysVisible || ifcElement.selectable,
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
 * Restores the user data of IFC elements in the given IFC model using the provided saved data.
 *
 * @param ifcModel - The IFC model containing elements whose data needs to be restored.
 * @param savedData - An array of saved data objects to restore the IFC elements' user data.
 * @throws IfcDataLoadingError - Throws an error if no matching saved data is found for an IFC element.
 */
const restoreDataToIfcModel = (ifcModel: IfcModel, savedData: IfcElementDataRecord): void => {
	for (const ifcElement of ifcModel.children) {
		const data = savedData[ifcElement.userData.expressId]
		if (!data) {
			continue
		}
		ifcElement.userData = { ...ifcElement.userData, ...data }
	}
}

export { extractDataToSave, restoreDataToIfcModel }
