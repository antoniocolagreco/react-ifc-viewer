import { useIfcViewerCommands } from '@/hooks/use-ifc-viewer-commands'
import clsx from 'clsx'
import { forwardRef, type ComponentRef, type HTMLAttributes } from 'react'
import { IfcButton } from '../ifc-button'
import './ifc-controls.css'

type IfcControlsProps = HTMLAttributes<HTMLDivElement>

const IfcControls = forwardRef<ComponentRef<'div'>, IfcControlsProps>((props, ref) => {
	const { className, ...rest } = props
	const { changeViewMode, fitView, focusView, resetView } = useIfcViewerCommands()
	return (
		<div className={clsx('ifc-controls', className)} ref={ref} {...rest}>
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
})

IfcControls.displayName = 'IfcControls'

export { IfcControls }
