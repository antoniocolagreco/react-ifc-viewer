type IfcProgressEventType = 'PROGRESS' | 'DONE' | 'ERROR'

class IfcProgressEvent extends ProgressEvent {
	override type: IfcProgressEventType

	constructor(type: IfcProgressEventType = 'PROGRESS', eventInitDict?: ProgressEventInit) {
		super(type, eventInitDict)
		this.type = type
	}
}

export { IfcProgressEvent, type IfcProgressEventType }
