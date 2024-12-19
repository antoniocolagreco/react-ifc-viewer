import { type ComponentPropsWithRef, type FC, type ReactNode } from 'react'
import type { Position } from '../ifc-viewer/types'
import './ifc-anchor.css'

type IfcAnchorProps = ComponentPropsWithRef<'div'> & {
	position: Position
	children: ReactNode
}

const IfcAnchor: FC<IfcAnchorProps> = props => {
	const { position, children } = props

	return (
		<div className="ifc-anchor" style={{ top: position.y, left: position.x }}>
			{children}
		</div>
	)
}

export { IfcAnchor, type IfcAnchorProps }
