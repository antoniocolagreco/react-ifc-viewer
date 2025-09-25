import type { IfcElement, IfcModel } from '@/classes'
import type { IfcLoadingStatus, IfcViewMode } from '@/components'
import type { RenderScene } from '@/components/ifc-viewer/types'
import type { Property } from '@/types'

type GlobalStateData = {
	viewPort: {
		focusView: (expressID?: number) => void
		fitView: (expressID?: number) => void
		resetView: () => void
		changeViewMode: (viewMode?: IfcViewMode) => void
		viewMode: IfcViewMode
	}
	loadingProgress: IfcLoadingStatus
	model: IfcModel | undefined
	selectableElements: IfcElement[] | undefined
	selectByProperty: (property: Property) => void
	selectByExpressId: (expressId: number | undefined) => void
	getElementByExpressId: (expressId: number) => IfcElement | undefined
	getElementsWithData: () => IfcElement[]
	updateAnchors: () => void
	renderScene: RenderScene
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
			viewMode: 'VIEW_MODE_ALL',
		},
		loadingProgress: {
			status: 'NOT_INITIALIZED',
			loaded: 0,
			total: 0,
		},
		model: undefined,
		selectableElements: [],
		selectByProperty: () => {},
		selectByExpressId: () => {},
		// eslint-disable-next-line unicorn/no-useless-undefined
		getElementByExpressId: () => undefined,
		getElementsWithData: () => [],
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
