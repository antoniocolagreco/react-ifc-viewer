'use client'

import clsx from 'clsx'
import type { FC } from 'react'
import { ProgressBar } from '@/components/progress-bar'
import { IFCViewerLoadingMessages } from '@/costants'
import type { IfcViewerProps } from './types'
import { useIfcViewerController } from './hooks'
import './ifc-viewer.css'

const IfcViewer: FC<IfcViewerProps> = props => {
	const controller = useIfcViewerController(props)
	const { className, children: _ignoredChildren, ...otherProps } = props
	void _ignoredChildren
	const {
		containerRef,
		canvasRef,
		cursorStyle,
		anchors,
		viewerChildren,
		debouncedProgress,
		handleMouseDown,
		handleMouseUp,
		handleMouseMove,
		handleMouseLeave,
	} = controller

	return (
		<div className={clsx('ifc-viewer', className)} ref={containerRef} {...otherProps}>
			<canvas
				ref={canvasRef}
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				style={cursorStyle}
			/>
			{anchors}
			<div className="ifc-children-container">{viewerChildren}</div>
			{debouncedProgress.status !== 'DONE' && (
				<div className="ifc-progress-bar-container">
					<ProgressBar
						max={debouncedProgress.total}
						value={debouncedProgress.loaded}
						state={debouncedProgress.status.toUpperCase().includes('ERROR') ? 'ERROR' : 'LOADING'}
					>
						{IFCViewerLoadingMessages[debouncedProgress.status]}
					</ProgressBar>
				</div>
			)}
		</div>
	)
}

export { IfcViewer }
export type { IfcViewerProps } from './types'
