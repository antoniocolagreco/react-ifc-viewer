import clsx from 'clsx'
import { forwardRef, type ComponentProps, type ComponentRef } from 'react'
import './ifc-button.css'

type IfcButtonProps = ComponentProps<'button'>

const IfcButton = forwardRef<ComponentRef<'button'>, IfcButtonProps>((props, ref) => {
	const { className, ...rest } = props
	return <button className={clsx('ifc-button', className)} ref={ref} {...rest} />
})

IfcButton.displayName = 'IfcButton'

export { IfcButton, type IfcButtonProps }
