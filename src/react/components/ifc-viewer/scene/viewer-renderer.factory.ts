import { WebGLRenderer } from 'three'

const MAX_PIXEL_RATIO = 2

const createViewerRenderer = (canvas: HTMLCanvasElement): WebGLRenderer => {
	const renderer = new WebGLRenderer({
		canvas,
		antialias: true,
		alpha: true,
	})
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO))
	renderer.setSize(canvas.clientWidth, canvas.clientHeight)
	renderer.setClearColor(0x000000, 0)
	return renderer
}

export { createViewerRenderer, MAX_PIXEL_RATIO }
