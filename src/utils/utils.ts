/* eslint-disable unicorn/import-style */
/* eslint-disable unicorn/prefer-global-this */

const isRunningInBrowser = () => {
	if (typeof window === 'undefined') {
		return false
	}
	return true
}

const ensureTrailingSlash = (value: string) => (value.endsWith('/') ? value : `${value}/`)

const getPath = async () => {
	if (isRunningInBrowser()) {
		const base = import.meta.env.BASE_URL
		return ensureTrailingSlash(`${location.origin}${base}`)
	}
	const path = await import('node:path')
	// Use a trailing slash so string concatenations like `${getPath()}wasm/` are valid
	return ensureTrailingSlash(path.resolve('public'))
}

const getPercetage = (value?: number, total?: number) => {
	if (value && total) {
		return `${String(Math.round((value / total) * 100))}%`
	}
	return '0%'
}

export { getPath, getPercetage, isRunningInBrowser }
