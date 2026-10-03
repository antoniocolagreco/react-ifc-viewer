import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressBar } from './progres-bar'

const getBarWidth = (): string => {
	const bar = screen.getByRole('progressbar').firstElementChild as HTMLElement
	return bar.style.width
}

describe('ProgressBar', () => {
	it('shows an empty bar when nothing is loaded yet', () => {
		render(<ProgressBar max={10} value={0} />)
		expect(getBarWidth()).toBe('0%')
	})

	it('shows the loaded percentage', () => {
		render(<ProgressBar max={8} value={2} />)
		expect(getBarWidth()).toBe('25%')
	})

	it('never exceeds a full bar', () => {
		render(<ProgressBar max={10} value={15} />)
		expect(getBarWidth()).toBe('100%')
	})

	it('shows a full bar when the total is unknown', () => {
		render(<ProgressBar max={-1} value={500} />)
		expect(getBarWidth()).toBe('100%')
	})
})
