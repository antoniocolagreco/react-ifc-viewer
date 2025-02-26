import clsx from 'clsx'
import { type ComponentPropsWithRef, type FC } from 'react'
import type { IfcPosition } from '@/components'
import './ifc-anchor.css'

type IfcAnchorProps = Omit<ComponentPropsWithRef<'div'>, 'onSelect'> & {
	position: IfcPosition
	onSelect?: () => void
	onHover?: () => void
}

const IfcAnchor: FC<IfcAnchorProps> = props => {
	const { position, children, onSelect, onHover, onPointerDown, onMouseMove, onKeyDown, style, ...rest } = props

	const handleOnPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
		if (onSelect) {
			onSelect()
		}
		if (onPointerDown) {
			onPointerDown(event)
		}
	}

	const handleOnMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
		if (onHover) {
			onHover()
		}
		if (onMouseMove) {
			onMouseMove(event)
		}
	}

	const handleOnKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		if ((event.key === 'Enter' || event.key === 'Space') && onSelect) {
			onSelect()
		}
		if (onKeyDown) {
			onKeyDown(event)
		}
	}

	return (
		<div
			className={clsx('ifc-anchor', { hoverEffect: onSelect })}
			style={{ top: position.y, left: position.x, ...style }}
			onPointerDown={handleOnPointerDown}
			onMouseMove={handleOnMouseMove}
			onKeyDown={handleOnKeyDown}
			tabIndex={0}
			role="button"
			{...rest}
		>
			{children}
		</div>
	)
}

export { IfcAnchor, type IfcAnchorProps }
