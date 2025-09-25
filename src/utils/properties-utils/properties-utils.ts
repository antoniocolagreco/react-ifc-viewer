import { IfcElement, IfcModel } from '@/classes'
import type {
	IfcElementData,
	IfcElementLink,
	Property,
	PropertySet,
	PropertyValue,
	Requirements,
	SelectableRequirements,
	Tag,
} from '@/types'
import {
	IFC2X3,
	IFCRELAGGREGATES,
	IFCRELASSIGNS,
	IFCRELDEFINESBYPROPERTIES,
	IFCRELDEFINESBYTYPE,
	type Handle,
	type IfcAPI,
} from 'web-ifc'

/**
 * Retrieves the type and properties of an IFC element.
 *
 * @param ifcAPI - The IFC API instance used to interact with the IFC model.
 * @param modelID - The ID of the IFC model.
 * @param expressId - The express ID of the IFC element.
 * @returns An object containing the express ID, type, name, and properties of the IFC element.
 *
 * @remarks
 * This function fetches the IFC element data using the `GetLine` method of the IFC API.
 * It then collects all the relationships (IsDefinedBy, Decomposes, HasAssignments) associated with the element.
 * For each relationship, it processes the properties and constructs an array of property sets.
 *
 * The function currently skips processing for the following relationship types:
 * - IFCRELDEFINESBYTYPE
 * - IFCRELAGGREGATES
 * - IFCRELASSIGNS
 *
 * The resulting object includes the express ID, type, name, and an array of property sets.
 */
const getIfcElementTypeAndProperties = (ifcAPI: IfcAPI, modelID: number, expressId: number): IfcElementData => {
	const data = ifcAPI.GetLine(modelID, expressId, true, true) as IFC2X3.IfcBuildingElement
	const type = ifcAPI.GetNameFromTypeCode(data.type)
	const tag = data.Tag ?? undefined
	const name = data.Name?.value ?? ''

	// Array per raccogliere tutte le relazioni trovate
	const relations: (IFC2X3.IfcRelDefines | IFC2X3.IfcRelAggregates | IFC2X3.IfcRelAssigns)[] = []

	if (data.IsDefinedBy) {
		relations.push(...(data.IsDefinedBy as IFC2X3.IfcRelDefines[]))
	}

	if (data.Decomposes) {
		relations.push(...(data.Decomposes as IFC2X3.IfcRelAggregates[]))
	}

	if (data.HasAssignments) {
		relations.push(...(data.HasAssignments as IFC2X3.IfcRelAssigns[]))
	}

	const propertySets: PropertySet[] = []

	for (const relation of relations) {
		switch (relation.type) {
			// Proprietà specifiche dell'oggetto
			case IFCRELDEFINESBYPROPERTIES: {
				const relationDefinesByProperties = relation as IFC2X3.IfcRelDefinesByProperties
				const handle = relationDefinesByProperties.RelatingPropertyDefinition as Handle<IFC2X3.IfcPropertySet>
				const propertySetLine = ifcAPI.GetLine(modelID, handle.value, true) as IFC2X3.IfcPropertySet

				if (propertySetLine instanceof IFC2X3.IfcPropertySet) {
					const properties = propertySetLine.HasProperties.map(prop => {
						const propertySingleValue = prop as IFC2X3.IfcPropertySingleValue
						return {
							name: propertySingleValue.Name.value,
							value: propertySingleValue.NominalValue?.value as PropertyValue | undefined,
						}
					})

					const propertySet = { name: propertySetLine.Name?.value, properties }
					propertySets.push(propertySet)
				}
				break
			}
			// Proprietà ereditate dal tipo
			case IFCRELDEFINESBYTYPE: {
				// const relationDefinesByType = relation as IFC2X3.IfcRelDefinesByType
				// const relatedObjectsHandles = relationDefinesByType.RelatedObjects as Handle<IFC2X3.IfcObject>[]
				// const relatedTypeHandle = relationDefinesByType.RelatingType as Handle<IFC2X3.IfcTypeObject>
				// const relatedType = ifcAPI.GetLine(modelID, relatedTypeHandle.value, true) as IFC2X3.IfcTypeObject
				// const relatedObjects = relatedObjectsHandles.map(handle => {
				// 	const line = ifcAPI.GetLine(modelID, handle.value, true) as IFC2X3.IfcObject
				// 	return line
				// })
				break
			}
			// Proprità relative all'aggregazione (piano, edificio, ecc.)
			case IFCRELAGGREGATES: {
				// const relationAggregates = relation as IFC2X3.IfcRelAggregates
				// const relatedObjectsHandles = relationAggregates.RelatedObjects as Handle<IFC2X3.IfcObjectDefinition>[]
				// const relatingObjectHandle = relationAggregates.RelatingObject as Handle<IFC2X3.IfcObjectDefinition>
				// console.log('IFCRELAGGREGATES', relationAggregates.Name?.value)
				// console.log(`Skipping IFCRELAGGREGATES`, relation.expressID)
				break
			}
			// Proprietà assegnate all'oggetto
			case IFCRELASSIGNS: {
				// const relationAssigns = relation as IFC2X3.IfcRelAssigns
				// const relatedObjectsHandles = relationAssigns.RelatedObjects as Handle<IFC2X3.IfcObjectDefinition>[]
				// const relatingObjectEnum = relationAssigns.RelatedObjectsType as IFC2X3.IfcObjectTypeEnum
				// console.log('IFCRELASSIGNS', relationAssigns.Name?.value)
				// console.log(`Skipping IFCRELAGGREGATES`, relation.expressID)
				break
			}
			default: {
				// console.log(`Skipping ${String(relation.type)}`, relation.expressID)
				break
			}
		}
	}

	return {
		expressId,
		type,
		tag,
		name,
		properties: propertySets,
	}
}

/**
 * Finds the value of a specified property from IFC element data.
 *
 * @param ifcElementData - The IFC element data containing properties.
 * @param propertyName - The name of the property to find.
 * @returns The value of the specified property, or `undefined` if not found.
 */
const findPropertyValueFromIfcElementData = (
	ifcElementData: IfcElementData,
	propertyName: string,
): Property['value'] | undefined => {
	if (!ifcElementData.properties) return undefined

	for (const propertySet of ifcElementData.properties) {
		for (const property of propertySet.properties) {
			if (property.name.toLocaleLowerCase() === propertyName.toLocaleLowerCase()) return property.value
		}
	}

	return undefined
}

/**
 * Compares two property values for equality.
 *
 * @param valueToCheck - The property value to check.
 * @param valueToFind - The property value to find.
 * @param precise - If true, checks for exact equality; if false, checks if `valueToCheck` includes `valueToFind`. Defaults to true.
 * @returns `true` if the values are equal based on the `precise` flag; otherwise, `false`.
 */
const isPropertyEqual = (valueToCheck: PropertyValue, valueToFind: PropertyValue, precise = true): boolean => {
	const normalizedValueToCheck = String(valueToCheck).toLowerCase()
	const normalizedValueToFind = String(valueToFind).toLowerCase()
	if (precise) return normalizedValueToCheck === normalizedValueToFind
	return normalizedValueToCheck.includes(normalizedValueToFind)
}

/**
 * Checks if an IFC element's properties match the specified properties and type.
 *
 * @param ifcElementData - The IFC element data to check.
 * @param propertiesToFind - An array of properties to find in the IFC element. Defaults to an empty array.
 * @param type - The type of the IFC element to match. Optional.
 * @returns `true` if the IFC element's properties and type match the specified criteria, otherwise `false`.
 */
const matchPropertiesAndType = (
	ifcElementData: IfcElementData,
	propertiesToFind: Property[] = [],
	type?: string,
): boolean => {
	// Controlla se l'oggetto ha delle proprietà utente
	if (!ifcElementData.properties && !ifcElementData.values) return false

	// Controlla se il tipo dell'oggetto corrisponde al tipo specificato (se fornito)
	if (type && ifcElementData.type !== type) return false

	// Itera su ciascuna proprietà da trovare
	for (const propertyToFind of propertiesToFind) {
		// Controlla se l'oggetto ha la proprietà specificata
		const foundProperty = findPropertyInIfcData(ifcElementData, propertyToFind)
		if (!foundProperty) return false
		if (!ifcElementData.values) {
			ifcElementData.values = {}
		}
		ifcElementData.values[foundProperty.name] = foundProperty.value
	}
	// Se tutte le proprietà corrispondono, ritorna true

	return true
}

/**
 * Determines whether a given IFC element's tag matches the specified tag criteria.
 *
 * @param ifcElementData - The data of the IFC element, which may include a tag to be matched.
 * @param tag - The tag criteria to match against. If not provided, the function returns `true`.
 * @returns `true` if the IFC element's tag matches the specified criteria or if no criteria are provided; otherwise, `false`.
 */
const matchTag = (ifcElementData: IfcElementData, tag?: Tag): boolean => {
	if (!tag) return true
	if (!ifcElementData.tag) return false
	if (tag.name && ifcElementData.tag.name !== tag.name) return false
	if (tag.type && ifcElementData.tag.type !== tag.type) return false
	if (tag.value && ifcElementData.tag.value !== tag.value) return false
	return true
}

/**
 * Checks if a given property matches any property within the IFC element data.
 *
 * @param ifcElementData - The IFC element data containing property sets to search through.
 * @param propertyToFind - The property to find, containing a name and/or value.
 * @returns `true` if a matching property is found, otherwise `false`.
 *
 * The function performs the following checks:
 * - If only the property name is provided, it checks if any property name matches.
 * - If only the property value is provided, it checks if any property value matches.
 * - If both the property name and value are provided, it checks if both match.
 */
const findPropertyInIfcData = (ifcElementData: IfcElementData, propertyToFind: Property): Property | undefined => {
	const keyToFind = propertyToFind.name
	const valueToFind = propertyToFind.value

	// La funziona prima controlla se il record è già stato elaborato in passate ed è presente in values
	// In tal caso, restituisce il valore corrispondente skipando il controllo delle proprietà
	const { values } = ifcElementData
	if (values) {
		for (const [name, value] of Object.entries(values)) {
			if (name === keyToFind) {
				if (valueToFind) {
					if (String(valueToFind) === String(value)) {
						return { name, value }
					}
				} else {
					return { name, value }
				}
			}
		}
	}

	// Controlla se l'oggetto ha delle proprietà utente
	if (!ifcElementData.properties) return undefined

	// Itera su ciascun set di proprietà nell'oggetto
	for (const propertySet of ifcElementData.properties) {
		// Itera su ciascuna proprietà nel set di proprietà
		for (const property of propertySet.properties) {
			const propertyValueAsString = String(property.value)

			// Controlla se solo il nome della proprietà corrisponde
			if (!valueToFind && keyToFind && isPropertyEqual(property.name, keyToFind, false)) {
				return { name: property.name, value: property.value }
			}

			// Controlla se solo il valore della proprietà corrisponde
			if (valueToFind && !keyToFind && isPropertyEqual(propertyValueAsString, valueToFind)) {
				return { name: property.name, value: property.value }
			}

			// Controlla se sia il nome che il valore della proprietà corrispondono
			if (
				valueToFind &&
				keyToFind &&
				isPropertyEqual(property.name, keyToFind, false) &&
				isPropertyEqual(propertyValueAsString, valueToFind)
			) {
				return { name: property.name, value: property.value }
			}
		}
	}

	// Se nessuna proprietà corrisponde, ritorna false
	return undefined
}

/**
 * Filters IFC elements data by matching properties and type.
 *
 * @param allIfcElementsData - An array of all IFC elements data to filter.
 * @param propertiesToFind - An array of properties to match against each element.
 * @param type - An optional string representing the type of elements to match.
 * @returns An array of IFC elements data that match the specified properties and type.
 */
const filterIfcElementsDataByPropertiesAndType = (
	allIfcElementsData: IfcElementData[],
	propertiesToFind: Property[],
	type?: string,
	tag?: Tag,
	expressId?: number,
): IfcElementData[] => {
	const foundElements: IfcElementData[] = []

	const stack: IfcElementData[] = [...allIfcElementsData]

	while (stack.length > 0) {
		const current = stack.pop()

		if (!current) continue

		if (
			matchPropertiesAndType(current, propertiesToFind, type) &&
			matchTag(current, tag) &&
			matchExpressId(current, expressId)
		) {
			foundElements.push(current)
		}
	}

	return foundElements
}

/**
 * Checks if the given IFC element data matches the specified express ID.
 *
 * @param ifcElementData - The data of the IFC element to be checked.
 * @param expressId - The express ID to match against. If not provided, the function will return `true`.
 * @returns `true` if the express ID matches or if no express ID is provided; otherwise, `false`.
 */
const matchExpressId = (ifcElementData: IfcElementData, expressId?: number): boolean => {
	if (!expressId) return true
	if (ifcElementData.expressId !== expressId) return false
	return true
}

const filterIfcElementsByPropertiesAndType = (
	ifcModel: IfcModel,
	propertiesToFind: Property[] = [],
	type?: string,
	tag?: Tag,
	expressId?: number,
): IfcElement[] => {
	const foundElements: IfcElement[] = []

	const stack: IfcElement[] = [...ifcModel.getElements()]

	while (stack.length > 0) {
		const current = stack.pop()

		if (!current) continue

		const isMatchingPropsAndType = matchPropertiesAndType(current.userData, propertiesToFind, type)
		const isMatchingTag = matchTag(current.userData, tag)
		const isMatchingExpressId = matchExpressId(current.userData, expressId)

		if (isMatchingPropsAndType && isMatchingTag && isMatchingExpressId) {
			foundElements.push(current)
		}
	}

	return foundElements
}

/**
 * Checks if an IFC element satisfies the given requirements.
 *
 * @param ifcElementData - The data of the IFC element to be checked.
 * @param requirements - The requirements that the IFC element needs to satisfy.
 * @returns `true` if the IFC element satisfies the requirements, otherwise `false`.
 */
const satisfiesRequirements = (ifcElementData: IfcElementData, requirements: Requirements | undefined): boolean => {
	// Check if there are any selection requirements
	if (!requirements) {
		return true
	}

	// Check if the object is the correct type
	if (requirements.type && ifcElementData.type !== requirements.type) {
		return false
	}

	// Check if the object has no properties and no tag
	if (
		(!requirements.properties || requirements.properties.length === 0) &&
		!requirements.tag &&
		!requirements.expressId
	) {
		return true
	}

	// Check if the object has the required expressId
	if (!matchExpressId(ifcElementData, requirements.expressId)) {
		return false
	}

	// Check if the object has the required tag
	if (!matchTag(ifcElementData, requirements.tag)) {
		return false
	}

	// Check if the object has the required properties
	if (!matchPropertiesAndType(ifcElementData, requirements.properties)) {
		return false
	}

	return true
}

/**
 * Removes the `properties` field from each element in the provided array of IFC element data.
 *
 * @param ifcAllElementsData - An array of IFC element data objects from which the `properties` field will be removed.
 */
const removePropertiesFromIfcElements = (ifcAllElementsData: IfcElementData[]): void => {
	for (const ifcElementData of ifcAllElementsData) {
		delete ifcElementData.properties
	}
}

/**
 * Sets the `selectable` property of an `IfcElementData` item based on the provided requirements.
 *
 * @param ifcElementData - The IFC element data to be evaluated.
 * @param allIfcElementsData - An array of all IFC element data items.
 * @param requirements - An array of selectable requirements to be checked against the IFC element data.
 *
 * The function iterates through the provided requirements and checks if the `ifcElementData` satisfies any of them.
 * If a requirement is satisfied, it further checks if there are any link requirements.
 * If link requirements are present, it verifies if any linked items also satisfy the requirements.
 * If any requirement is satisfied, the `selectable` property of `ifcElementData` is set to `true`.
 */
const setIfcDataItemSelectable = (ifcElementData: IfcElementData, requirements: SelectableRequirements[]): void => {
	if (ifcElementData.selectable === true) {
		return
	}

	if (requirements.length === 0) {
		ifcElementData.selectable = true
		return
	}

	ifcElementData.selectable = false

	for (const selectableRequirement of requirements) {
		if (!satisfiesRequirements(ifcElementData, selectableRequirement)) {
			continue
		}

		const { links } = selectableRequirement

		if (!links) {
			ifcElementData.selectable = true
			break
		}

		if (!ifcElementData.links) {
			continue
		}

		for (const link of links) {
			if (
				!(
					link in ifcElementData.links ||
					!ifcElementData.links[link] ||
					ifcElementData.links[link].length === 0
				)
			) {
				break
			}
		}

		ifcElementData.selectable = true
		break
	}
}

/**
 * Sets the `alwaysVisible` property of the given `ifcElementData` based on the provided requirements.
 *
 * @param ifcElementData - The IFC element data object to be updated.
 * @param requirements - An array of requirements to be checked against the IFC element data.
 */
const setIfcDataAlwaysVisible = (ifcElementData: IfcElementData, requirements: Requirements[]): void => {
	let alwaysVisible = true

	for (const selectableRequirement of requirements) {
		if (!satisfiesRequirements(ifcElementData, selectableRequirement)) {
			alwaysVisible = false
			break
		}
	}
	ifcElementData.alwaysVisible = alwaysVisible
}

/**
 * Sets IFC data links between elements based on specified link requirements.
 *
 * @param ifcElementData - The IFC element data for which links are to be set.
 * @param allIfcElementsData - An array of all IFC elements data.
 * @param linkRequirements - An array of link requirements specifying how links should be established.
 *
 * This function iterates over the provided link requirements and establishes links between IFC elements
 * that satisfy the specified requirements. Links are created based on shared property values between
 * source and target elements. If the source and target elements have matching property values, links
 * are established between them.
 *
 * The function ensures that links are not duplicated and that elements meet the necessary conditions
 * before links are created.
 */
const setIfcDataLinks = (
	ifcElementData: IfcElementData,
	allIfcElementsData: IfcElementData[],
	linkRequirements: IfcElementLink[],
): void => {
	for (const linkRequirement of linkRequirements) {
		const { sharedProperty, source, target } = linkRequirement

		// Check if the source requirements are satisfied
		if (!satisfiesRequirements(ifcElementData, source)) {
			continue
		}

		// Check if links already exist
		if (
			ifcElementData.links &&
			(linkRequirement.source.linkName in ifcElementData.links ||
				linkRequirement.target.linkName in ifcElementData.links)
		) {
			continue
		}

		// Find the source property value
		const sourceValue = findPropertyValueFromIfcElementData(ifcElementData, sharedProperty)
		if (!sourceValue) {
			continue
		}

		// Iterate over all target elements
		for (const targetIfcElementData of allIfcElementsData) {
			// Check if the target requirements are satisfied
			if (!satisfiesRequirements(targetIfcElementData, target)) {
				continue
			}

			// Find the target property value
			const targetValue = findPropertyValueFromIfcElementData(targetIfcElementData, sharedProperty)
			if (!targetValue || sourceValue !== targetValue) {
				continue
			}

			// Initialize links if they do not exist
			if (!ifcElementData.links) {
				ifcElementData.links = {}
			}
			if (!ifcElementData.links[source.linkName]) {
				ifcElementData.links[source.linkName] = []
			}
			if (!targetIfcElementData.links) {
				targetIfcElementData.links = {}
			}
			if (!targetIfcElementData.links[target.linkName]) {
				targetIfcElementData.links[target.linkName] = []
			}

			// Add the links
			ifcElementData.links[source.linkName]?.push(targetIfcElementData.expressId)
			targetIfcElementData.links[target.linkName]?.push(ifcElementData.expressId)
		}
	}
}

/**
 * Processes IFC element data by setting links, selectable status, and visibility requirements.
 *
 * @param ifcElementData - The IFC element data to process.
 * @param allIfcElementsData - An array of all IFC elements data.
 * @param linkRequirements - Optional array of link requirements to set for the IFC element data.
 * @param selectableRequirements - Optional array of selectable requirements to set for the IFC element data.
 * @param alwaysVisibleRequirements - Optional array of requirements to set the IFC element data as always visible.
 */
const processIfcData = (
	ifcElementData: IfcElementData,
	allIfcElementsData: IfcElementData[],
	linkRequirements?: IfcElementLink[],
	selectableRequirements?: SelectableRequirements[],
	alwaysVisibleRequirements?: Requirements[],
) => {
	if (linkRequirements && linkRequirements.length > 0) {
		setIfcDataLinks(ifcElementData, allIfcElementsData, linkRequirements)
	}
	if (selectableRequirements) {
		setIfcDataItemSelectable(ifcElementData, selectableRequirements)
	}
	if (alwaysVisibleRequirements) {
		setIfcDataAlwaysVisible(ifcElementData, alwaysVisibleRequirements)
	}
}

export {
	filterIfcElementsByPropertiesAndType,
	filterIfcElementsDataByPropertiesAndType,
	findPropertyValueFromIfcElementData,
	getIfcElementTypeAndProperties,
	processIfcData,
	removePropertiesFromIfcElements,
	satisfiesRequirements,
	setIfcDataAlwaysVisible,
	setIfcDataItemSelectable,
	setIfcDataLinks,
}
