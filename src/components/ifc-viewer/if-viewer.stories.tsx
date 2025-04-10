import { getPath } from '@/utils'
import type { Meta, StoryObj } from '@storybook/react'
import type { IfcElement } from 'dist'
import { useState } from 'react'
import { IfcControls } from '../ifc-controls/ifc-controls'
import { IfcGreenMarker, IfcRedMarker } from '../ifc-marker'
import { IfcOverlay } from '../ifc-overlay'
import { IfcViewer, type IfcViewerProps } from './ifc-viewer'

const MockComponent = (props: IfcViewerProps) => {
	const { onMeshSelect, ...rest } = props
	const [ifcElement, setIfcElement] = useState<IfcElement>()

	const handleMeshSelect = (ifcElement: IfcElement | undefined) => {
		if (onMeshSelect) {
			onMeshSelect(ifcElement)
		}
		setIfcElement(ifcElement)
	}

	return (
		<>
			<IfcViewer onMeshSelect={handleMeshSelect} {...rest}></IfcViewer>
			<div>
				<pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
					{JSON.stringify(ifcElement?.userData, null, 2)}
				</pre>
			</div>
		</>
	)
}

const meta: Meta<typeof IfcViewer> = {
	title: 'Components/IFC Viewer',
	component: MockComponent,
	parameters: {},
	tags: ['autodocs'],
	argTypes: {},
}

export default meta

type Story = StoryObj<typeof meta>

const defaultProps: IfcViewerProps = {
	url: `${await getPath()}/test/facility.ifc`,
	enableMeshHover: true,
	enableMeshSelection: true,
	style: { minHeight: '480px' },
	links: [
		{
			sharedProperty: 'numero pilastro',
			source: { properties: [{ name: 'numero pilastro' }], linkName: 'sensori' },
			target: { properties: [{ name: 'ins_codice' }], linkName: 'pilastro' },
		},
	],
	selectable: [
		{ properties: [{ name: 'Numero Pilastro' }], links: ['sensori'] },
		{ properties: [{ name: 'ins_codice' }] },
	],
	onMeshSelect: ifcElement => {
		console.log(ifcElement?.userData)
	},
	children: (
		<>
			<IfcOverlay requirements={{ properties: [{ name: 'ins_codice', value: '1' }] }}>
				<IfcGreenMarker hoverEffect />
			</IfcOverlay>
			<IfcOverlay requirements={{ properties: [{ name: 'ins_codice', value: '2' }] }}>
				<IfcRedMarker hoverEffect />
			</IfcOverlay>
			<IfcControls />
		</>
	),
}

export const DefaultViewer: Story = {
	args: {
		...defaultProps,
		// data,
	},
}
