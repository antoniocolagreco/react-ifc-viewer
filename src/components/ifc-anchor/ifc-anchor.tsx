import { forwardRef, type ReactNode } from 'react'
import type { Position } from '../ifc-viewer/types'
import './ifc-anchor.css'

type IfcAnchorProps = {
	position: Position
	children: ReactNode
}

const IfcAnchor = forwardRef<HTMLDivElement, IfcAnchorProps>(({ position, children }, ref) => {
	return (
		<div className="ifc-anchor" style={{ top: position.y, left: position.x }} ref={ref}>
			{children}
		</div>
	)
})

IfcAnchor.displayName = 'IfcAnchor'

export { IfcAnchor, type IfcAnchorProps }
