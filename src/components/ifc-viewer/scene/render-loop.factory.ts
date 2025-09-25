type RenderLoop = {
	start: () => void
	stop: () => void
}

const createRenderLoop = (callback: () => void): RenderLoop => {
	let animationFrameId: number | undefined

	const frame = (): void => {
		callback()
		animationFrameId = requestAnimationFrame(frame)
	}

	return {
		start() {
			if (animationFrameId !== undefined) {
				return
			}
			animationFrameId = requestAnimationFrame(frame)
		},
		stop() {
			if (animationFrameId === undefined) {
				return
			}
			cancelAnimationFrame(animationFrameId)
			animationFrameId = undefined
		},
	}
}

export { createRenderLoop, type RenderLoop }
