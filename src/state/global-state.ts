import type { IfcElement, IfcModel } from '@/classes'
import type { ViewMode } from '@/components/ifc-viewer/types'
import type { Property } from '@/types'

type GlobalStateData = {
	viewPort: {
		focusView: (expressID?: number) => void
		fitView: (expressID?: number) => void
		resetView: () => void
		changeViewMode: (viewMode?: ViewMode) => void
	}
	model: IfcModel | undefined
	selectableElements: IfcElement[]
	selectByProperty: (property: Property) => void
	selectByExpressId: (expressId: number | undefined) => void
	updateAnchors: () => void
	renderScene: () => void
}

type GlobalState = {
	currentState: GlobalStateData
	listeners: VoidFunction[]

	setState: (state: Partial<GlobalStateData>) => void
	getState: () => GlobalStateData

	subscribe: (fn: VoidFunction) => VoidFunction

	notify: VoidFunction
}

const globalState: GlobalState = {
	currentState: {
		viewPort: {
			focusView: () => {},
			fitView: () => {},
			resetView: () => {},
			changeViewMode: () => {},
		},
		model: undefined,
		selectableElements: [],
		selectByProperty: () => {},
		selectByExpressId: () => {},
		updateAnchors: () => {},
		renderScene: () => {},
	},
	listeners: [],

	setState: newState => {
		globalState.currentState = { ...globalState.currentState, ...newState }
		globalState.notify()
	},

	getState: () => globalState.currentState,

	subscribe: (fn: VoidFunction) => {
		globalState.listeners.push(fn)
		return () => {
			globalState.listeners = globalState.listeners.filter(listener => listener !== fn)
		}
	},

	notify: () => {
		for (const listener of globalState.listeners) {
			listener()
		}
	},
}

export { globalState, type GlobalStateData as GlobalState }
