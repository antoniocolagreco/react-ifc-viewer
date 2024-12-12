import { IfcOverlay, type IfcOverlayProps } from '@/components/ifc-overlay'
import { Fragment, isValidElement, type ReactElement, type ReactNode } from 'react'

const isIfcMarker = (object: unknown): object is ReactElement<IfcOverlayProps> =>
	isValidElement<IfcOverlayProps>(object) && object.type === IfcOverlay

const isFragment = (object: unknown): object is ReactElement<{ children: ReactNode }> =>
	isValidElement<{ children: ReactNode }>(object) && object.type === Fragment

export { isFragment, isIfcMarker }
