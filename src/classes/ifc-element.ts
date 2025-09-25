import type { IfcElementData, IfcInstanceRecord } from '@/types'
import { Group } from 'three'

class IfcElement extends Group {
	override name: string = 'ifcElement'
	override userData: IfcElementData
	private instanceRecords: IfcInstanceRecord[] = []

	constructor(expressId: number) {
		super()
		this.userData = {
			expressId,
		}
	}

	isAlwaysVisible = (): boolean => {
		return this.userData.alwaysVisible ?? false
	}

	setAlwaysVisible = (value: boolean): void => {
		this.userData.alwaysVisible = value
	}

	isSelectable = (): boolean => {
		return this.userData.selectable ?? false
	}

	setSelectable = (value: boolean): void => {
		this.userData.selectable = value
	}

	addInstanceRecord = (record: IfcInstanceRecord): void => {
		this.instanceRecords.push(record)
	}

	getInstanceRecords = (): IfcInstanceRecord[] => {
		return this.instanceRecords
	}
}

export { IfcElement }
