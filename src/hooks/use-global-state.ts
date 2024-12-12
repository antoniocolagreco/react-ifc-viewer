import { type GlobalState, globalState } from '@/state/global-state'
import { useCallback, useEffect, useState } from 'react'

type UseGlobalStateHook = () => {
	globalState: GlobalState
	setGlobalState: (state: Partial<GlobalState>) => void
}

const useGlobalState: UseGlobalStateHook = () => {
	const [state, setState] = useState<GlobalState>(globalState.getState())

	const sync = useCallback(() => {
		setState(globalState.getState())
	}, [])

	useEffect(() => {
		const unsubscribe = globalState.subscribe(sync)
		return unsubscribe
	}, [sync])

	const setGlobalState = useCallback((newState: Partial<GlobalState>) => {
		globalState.setState(newState)
	}, [])

	return { globalState: state, setGlobalState }
}

export default useGlobalState
