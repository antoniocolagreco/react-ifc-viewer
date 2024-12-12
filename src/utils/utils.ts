/* eslint-disable unicorn/prefer-global-this */

const isRunningInBrowser = () => {
	if (typeof window === 'undefined') {
		return false
	}
	if (typeof navigator === 'undefined') {
		return false
	}
	if (navigator.userAgent.includes('jsdom')) {
		return false
	}
	return true
}

export { isRunningInBrowser }
