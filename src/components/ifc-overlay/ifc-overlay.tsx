import type { IfcElement } from '@/classes'
import type { Requirements } from '@/types'
import type { FC, ReactNode } from 'react'

type IfcOverlayProps = {
	requirements: Requirements
	children: ReactNode
	onSelect?: (ifcElement: IfcElement) => void
	onHover?: (ifcElement: IfcElement) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const IfcOverlay: FC<IfcOverlayProps> = _props => {
	return null
}

IfcOverlay.displayName = 'IfcMarker'

export { IfcOverlay, type IfcOverlayProps }
