import type { IfcElementData } from '@/types'
import { Group } from 'three'
import type { IfcMesh } from '@/classes'

class IfcElement extends Group {
	override name: string = 'ifcElement'
	override userData: IfcElementData
	override children: IfcMesh[] = []

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
}

export { IfcElement }
