'use client'
import { useIfcViewer } from '@/react/hooks'
import clsx from 'clsx'
import { type ComponentPropsWithRef, type FC } from 'react'
import { IfcButton } from '@/react/components'
import './ifc-controls.css'

type IfcControlsProps = ComponentPropsWithRef<'div'>

const IfcControls: FC<IfcControlsProps> = props => {
	const { className, ...rest } = props
	const {
		viewPort: { changeViewMode, fitView, focusView, resetView },
	} = useIfcViewer()
	return (
		<div className={clsx('ifc-controls', className)} {...rest}>
			<IfcButton
				onClick={() => {
					changeViewMode()
				}}
			>
				Change View Mode
			</IfcButton>
			<IfcButton
				onClick={() => {
					fitView()
				}}
			>
				Fit View
			</IfcButton>
			<IfcButton
				onClick={() => {
					focusView()
				}}
			>
				Focus View
			</IfcButton>
			<IfcButton
				onClick={() => {
					resetView()
				}}
			>
				Reset View
			</IfcButton>
		</div>
	)
}

export { IfcControls }
