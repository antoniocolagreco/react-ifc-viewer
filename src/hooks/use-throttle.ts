import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Custom hook that throttles the updates to a value.
 *
 * @template T - The type of the value to be throttled.
 * @param {T} value - The value to be throttled.
 * @param {number} delay - The delay in milliseconds for the throttle.
 * @returns {T} - The throttled value.
 *
 * @example
 * const throttledValue = useThrottle(value, 500);
 */
const useThrottle = <T>(value: T, delay: number): T => {
	const [debouncedValue, setDebouncedValue] = useState(value)
	const lastRun = useRef(Date.now())
	const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

	const update = useCallback(() => {
		setDebouncedValue(value)
		lastRun.current = Date.now()
	}, [value])

	useEffect(() => {
		if (Date.now() - lastRun.current > delay) {
			update()
		} else {
			timeoutRef.current = setTimeout(update, delay - (Date.now() - lastRun.current))
		}

		return () => {
			clearTimeout(timeoutRef.current)
		}
	}, [delay, update])

	return debouncedValue
}

export { useThrottle }
