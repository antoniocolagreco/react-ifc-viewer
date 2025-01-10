/* eslint-disable unicorn/import-style */
/* eslint-disable unicorn/prefer-global-this */

const isRunningInBrowser = () => {
	if (typeof window === 'undefined') {
		return false
	}
	return true
}

const getPath = async () => {
	if (isRunningInBrowser()) {
		return `${location.origin}${import.meta.env.BASE_URL}`
	}
	const path = await import('node:path')
	return path.resolve('public')
}

const getPercetage = (value?: number, total?: number) => {
	if (value && total) {
		return `${String(Math.round((value / total) * 100))}%`
	}
	return '0%'
}

export { getPath, getPercetage, isRunningInBrowser }
