'use client'

import clsx from 'clsx'
import { forwardRef } from 'react'
import { ProgressBar } from '@/components/progress-bar'
import { IFCViewerLoadingMessages } from '@/costants'
import type { IfcViewerProps } from './types'
import { useIfcViewerController } from './hooks'
import './ifc-viewer.css'

const IfcViewer = forwardRef<HTMLDivElement, IfcViewerProps>((props, forwardedRef) => {
	const {
		url,
		data,
		onModelLoaded,
		hoverColor,
		selectedColor,
		links,
		selectable,
		alwaysVisible,
		highlightedSelectables,
		onMeshSelect,
		onMeshHover,
		enableMeshSelection,
		enableMeshHover,
		showBoundingSphere,
		className,
		children,
		...restDomProps
	} = props

	const domProps = restDomProps

	const controller = useIfcViewerController({
		url,
		data,
		onModelLoaded,
		hoverColor,
		selectedColor,
		links,
		selectable,
		alwaysVisible,
		highlightedSelectables,
		onMeshSelect,
		onMeshHover,
		enableMeshSelection,
		enableMeshHover,
		showBoundingSphere,
		className,
		children,
		ref: forwardedRef,
	})
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
		<div {...domProps} className={clsx('ifc-viewer', className)} ref={containerRef}>
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
})

IfcViewer.displayName = 'IfcViewer'

export { IfcViewer }
export type { IfcViewerProps } from './types'
