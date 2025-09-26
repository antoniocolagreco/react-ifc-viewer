const createResizeObserver = (container: Element, onResize: () => void): ResizeObserver => {
	const observer = new ResizeObserver(onResize)
	observer.observe(container)
	return observer
}

export { createResizeObserver }
