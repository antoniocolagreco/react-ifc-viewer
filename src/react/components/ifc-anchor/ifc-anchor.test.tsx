import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { IfcAnchor } from './ifc-anchor'

describe('IfcAnchor', () => {
	it.each(['Enter', ' '])('selects when %j is pressed', key => {
		const onSelect = vi.fn()
		render(<IfcAnchor position={{ x: 0, y: 0 }} onSelect={onSelect} />)

		fireEvent.keyDown(screen.getByRole('button'), { key })

		expect(onSelect).toHaveBeenCalledTimes(1)
	})
})
