import type IfcModel from '@/classes/ifc-model'
import IfcDataLoadingError from '@/errors/ifc-data-loading-error'
import type { ExpressId, IfcElementData } from '@/types/types'

/**
 * Extracts and returns a record of IFC element data to be saved from the given IFC model.
 *
 * @param ifcModel - The IFC model containing elements to be processed.
 * @returns A record where the keys are Express IDs and the values are the corresponding IFC element data.
 */
const getDataToSave = (ifcModel: IfcModel): Record<ExpressId, IfcElementData> => {
	const meshesToSave = ifcModel.children.filter(
		ifcElement => ifcElement.isAlwaysVisible() || ifcElement.isSelectable(),
	)
	const saveData: Record<ExpressId, IfcElementData> = {}
	for (const ifcElement of meshesToSave) {
		saveData[ifcElement.userData.expressId] = ifcElement.userData
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
const restoreData = (ifcModel: IfcModel, savedData: IfcElementData[]): void => {
	for (const ifcElement of ifcModel.children) {
		const data = savedData.find(savedItem => savedItem.expressId === ifcElement.userData.expressId)
		if (!data) {
			throw new IfcDataLoadingError(ifcElement.userData.expressId)
		}
		ifcElement.userData = data
	}
}

export { getDataToSave, restoreData }
