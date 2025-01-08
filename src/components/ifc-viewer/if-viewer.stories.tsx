import type { Meta, StoryObj } from '@storybook/react'
import { IfcControls } from '../ifc-controls/ifc-controls'
import { IfcOverlay } from '../ifc-overlay'
import { GreenMarker } from '../marker'
import { IfcViewer, type IfcViewerProps } from './ifc-viewer'

const meta: Meta<typeof IfcViewer> = {
	title: 'Components/IFC Viewer',
	component: IfcViewer,
	parameters: {},
	tags: ['autodocs'],
	argTypes: {},
}

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
					requiredProperties: [{ name: 'Contrassegno' }],
				}}
				onSelect={ifcElement => {
					console.log(ifcElement)
				}}
			>
				<GreenMarker hoverEffect />
			</IfcOverlay>
			{/* <IfcOverlay requirements={filterB}>
				<RedMarker style={{ pointerEvents: 'none' }} />
			</IfcOverlay> */}
			<IfcControls />
		</>
	),
}

export const DefaultViewer: Story = {
	args: {
		...defaultProps,
	},
}
