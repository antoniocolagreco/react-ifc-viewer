import clsx from 'clsx'
import { type ComponentPropsWithRef, type FC } from 'react'
import './marker.css'

type MarkerProps = ComponentPropsWithRef<'div'> & {
	hoverEffect?: boolean
}

const Marker: FC<MarkerProps> = props => {
	const { className, hoverEffect, ...rest } = props
	return <div className={clsx('marker', { hoverEffect }, className)} {...rest} />
}

const GreenMarker: FC<MarkerProps> = props => <Marker className={clsx('green')} {...props} />

const BlueMarker: FC<MarkerProps> = props => <Marker className={clsx('blue')} {...props} />

const RedMarker: FC<MarkerProps> = props => <Marker className={clsx('red')} {...props} />

const YellowMarker: FC<MarkerProps> = props => <Marker className={clsx('yellow')} {...props} />

export { BlueMarker, GreenMarker, Marker, RedMarker, YellowMarker, type MarkerProps }
