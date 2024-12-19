/* eslint-disable unicorn/prefer-global-this */

const isRunningInBrowser = () => {
	if (typeof window === 'undefined') {
		return false
	}
	return true
}

export { isRunningInBrowser }
