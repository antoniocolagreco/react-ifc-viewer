import clsx from 'clsx'
import { type ComponentPropsWithRef, type FC } from 'react'
import './marker.css'

type MarkerProps = ComponentPropsWithRef<'button'>

const Marker: FC<MarkerProps> = props => {
	const { className, ...rest } = props
	return <button className={clsx('marker', 'gray', className)} {...rest} />
}

const GreenMarker: FC<MarkerProps> = props => <Marker className={clsx('green')} {...props} />

const BlueMarker: FC<MarkerProps> = props => <Marker className={clsx('blue')} {...props} />

const RedMarker: FC<MarkerProps> = props => <Marker className={clsx('red')} {...props} />

const YellowMarker: FC<MarkerProps> = props => <Marker className={clsx('yellow')} {...props} />

export { BlueMarker, GreenMarker, Marker, RedMarker, YellowMarker, type MarkerProps }
