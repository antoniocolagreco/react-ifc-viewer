import type { Requirements } from '@/types/types'
import type { FC, ReactNode } from 'react'

type IfcOverlayProps = {
	requirements: Requirements
	children: ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const IfcOverlay: FC<IfcOverlayProps> = _props => {
	return null
}

IfcOverlay.displayName = 'IfcMarker'

export { IfcOverlay, type IfcOverlayProps }
