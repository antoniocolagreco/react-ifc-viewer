import type { ViewMode } from '@/components/ifc-viewer/types'

type GlobalStateData = {
	commands: {
		focusView: (expressID?: number) => void
		fitView: (expressID?: number) => void
		resetView: () => void
		changeViewMode: (viewMode?: ViewMode) => void
	}
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
		commands: {
			focusView: () => {},
			fitView: () => {},
			resetView: () => {},
			changeViewMode: () => {},
		},
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
