class IfcDataLoadingError extends Error {
	override readonly name = 'IfcDataLoadingError'

	constructor(expressId: number) {
		const message = `Failed to load data for expressId ${String(expressId)}`
		super(message)
	}
}

export default IfcDataLoadingError
