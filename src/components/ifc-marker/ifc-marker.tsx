import clsx from 'clsx'
import { type ComponentPropsWithRef, type FC } from 'react'
import './ifc-marker.css'

type IfcMarkerProps = ComponentPropsWithRef<'div'> & {
	hoverEffect?: boolean
}

const IfcMarker: FC<IfcMarkerProps> = props => {
	const { className, hoverEffect, ...rest } = props
	return <div className={clsx('marker', { hoverEffect }, className)} {...rest} />
}

const IfcGreenMarker: FC<IfcMarkerProps> = props => <IfcMarker className={clsx('green')} {...props} />

const IfcBlueMarker: FC<IfcMarkerProps> = props => <IfcMarker className={clsx('blue')} {...props} />

const IfcRedMarker: FC<IfcMarkerProps> = props => <IfcMarker className={clsx('red')} {...props} />

const IfcYellowMarker: FC<IfcMarkerProps> = props => <IfcMarker className={clsx('yellow')} {...props} />

export { IfcBlueMarker, IfcGreenMarker, IfcMarker, IfcRedMarker, IfcYellowMarker, type IfcMarkerProps }
