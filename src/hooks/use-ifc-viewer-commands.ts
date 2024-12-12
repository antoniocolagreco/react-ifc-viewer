import useGlobalState from './use-global-state'

const useIfcViewerCommands = () => {
	const { globalState } = useGlobalState()

	return globalState.commands
}

export default useIfcViewerCommands
