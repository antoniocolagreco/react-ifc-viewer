import clsx from 'clsx'
import { type ComponentPropsWithRef, type FC } from 'react'
import './ifc-button.css'

type IfcButtonProps = ComponentPropsWithRef<'button'>

const IfcButton: FC<IfcButtonProps> = props => {
	const { className, ...rest } = props
	return <button className={clsx('ifc-button', className)} {...rest} />
}

export { IfcButton, type IfcButtonProps }
