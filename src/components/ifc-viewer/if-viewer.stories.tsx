import type { Meta, StoryObj } from '@storybook/react'
import { IfcControls } from '../ifc-controls/ifc-controls'
import { IfcOverlay } from '../ifc-overlay'
import { GreenMarker, RedMarker } from '../marker'
import { IfcViewer, type IfcViewerProps } from './ifc-viewer'

const meta = {
	title: 'Components/IFC Viewer',
	component: IfcViewer,
	parameters: {},
	tags: ['autodocs'],
	argTypes: {},
} satisfies Meta<typeof IfcViewer>

export default meta

type Story = StoryObj<typeof meta>

const defaultProps: IfcViewerProps = {
	url: `${location.origin}${import.meta.env.BASE_URL}/test/castle.ifc`,
	enableMeshHover: true,
	enableMeshSelection: true,
	style: { minHeight: '480px' },
	links: [],
	selectable: [{ requiredType: 'IfcDistributionControlElement' }],
	alwaysVisible: [{ requiredType: 'IfcDistributionControlElement' }],
	children: (
		<>
			<IfcOverlay
				requirements={{
					requiredType: 'IfcDistributionControlElement',
					requiredProperties: [{ name: 'Contrassegno', value: '3' }],
				}}
			>
				<GreenMarker style={{ pointerEvents: 'none' }} />
			</IfcOverlay>
			<IfcOverlay
				requirements={{
					requiredType: 'IfcDistributionControlElement',
					requiredProperties: [{ name: 'Contrassegno', value: '4' }],
				}}
			>
				<RedMarker style={{ pointerEvents: 'none' }} />
			</IfcOverlay>
			<IfcControls />
		</>
	),
}

export const DefaultViewer: Story = {
	args: {
		...defaultProps,
	},
}
