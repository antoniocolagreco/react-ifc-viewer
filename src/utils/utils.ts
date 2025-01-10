/* eslint-disable unicorn/prefer-global-this */

const isRunningInBrowser = () => {
	if (typeof window === 'undefined') {
		return false
	}
	return true
}

const getPercetage = (value?: number, total?: number) => {
	if (value && total) {
		return `${String(Math.round((value / total) * 100))}%`
	}
	return '0%'
}

export { getPercetage, isRunningInBrowser }
