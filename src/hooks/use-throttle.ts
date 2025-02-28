import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Custom hook per il debouncing.
 * @param value - il valore che deve essere debounced.
 * @param delay - il tempo di ritardo (in millisecondi) prima che venga aggiornato il valore.
 * @returns il valore debounced.
 */
function useThrottle<T>(value: T, delay: number): T {
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
			console.log('Debounced value cleanup')
			clearTimeout(timeoutRef.current)
		}
	}, [delay, update])

	return debouncedValue
}

export { useThrottle }
