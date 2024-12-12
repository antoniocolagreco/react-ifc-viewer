import clsx from 'clsx'
import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react'
import './progress-bar.css'

type ProgressBarState = 'LOADING' | 'DONE' | 'ERROR'

type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
	max: number
	value: number
	backgroundClassName?: string
	loadingClassName?: string
	successClassName?: string
	errorClassName?: string
	messageClassName?: string
	state?: ProgressBarState
	children?: string
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressProps>((props, ref) => {
	const {
		className,
		loadingClassName = 'loading',
		successClassName = 'done',
		errorClassName = 'error',
		messageClassName = 'message',
		max,
		value,
		state = 'LOADING',
		children,
		...rest
	} = props

	const percentage = Math.round((100 / max) * value)

	const progressBarStyle: CSSProperties = {
		width: `${percentage.toString()}%`,
	}

	const barBackgroundClassName = (() => {
		switch (state) {
			case 'DONE': {
				return successClassName
			}
			case 'ERROR': {
				return errorClassName
			}
			default: {
				return loadingClassName
			}
		}
	})()

	return (
		<div
			aria-valuemax={max}
			aria-valuemin={0}
			aria-valuenow={value}
			className={clsx('progress-bar', className)}
			ref={ref}
			role="progressbar"
			{...rest}
		>
			<div className={clsx('bar', barBackgroundClassName)} style={progressBarStyle}>
				<div className={clsx('message', messageClassName)}>{children}</div>
			</div>
		</div>
	)
})

ProgressBar.displayName = 'ProgressBar'

export { ProgressBar, type ProgressProps }
