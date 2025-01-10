import type { IfcElementData, Requirements } from '@/types'
import type { FC, ReactNode } from 'react'

type IfcOverlayProps = {
	requirements: Requirements
	children: ReactNode
	onSelect?: (data: IfcElementData) => void
	onHover?: (data: IfcElementData) => void
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const IfcOverlay: FC<IfcOverlayProps> = _props => {
	return null
}

IfcOverlay.displayName = 'IfcMarker'

export { IfcOverlay, type IfcOverlayProps }
