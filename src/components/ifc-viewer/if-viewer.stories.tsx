import { getPath } from '@/utils'
import type { Meta, StoryObj } from '@storybook/react'
import { IfcControls } from '../ifc-controls/ifc-controls'
import { IfcGreenMarker } from '../ifc-marker'
import { IfcOverlay } from '../ifc-overlay'
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
	url: `${await getPath()}/test/castle.ifc`,
	enableMeshHover: true,
	enableMeshSelection: true,
	style: { minHeight: '480px' },
	links: [],
	selectable: [{ type: 'IfcDistributionControlElement' }],
	alwaysVisible: [{ type: 'IfcDistributionControlElement' }],
	children: (
		<>
			<IfcOverlay
				requirements={{
					type: 'IfcDistributionControlElement',
					properties: [{ name: 'Contrassegno' }],
				}}
				onSelect={ifcElement => {
					console.log(ifcElement)
				}}
			>
				<IfcGreenMarker hoverEffect />
			</IfcOverlay>
			{/* <IfcOverlay requirements={filterB}>
				<RedMarker style={{ pointerEvents: 'none' }} />
			</IfcOverlay> */}
			<IfcControls />
		</>
	),
}

// const data = JSON.parse(`
// {
//   "47596": {
//     "expressId": 47596,
//     "type": "IfcDistributionControlElement",
//     "name": "Accelerometro OnBoard - adxl354_adxl355:Tipo 1:293740",
//     "values": {
//       "Contrassegno": "1"
//     },
//     "selectable": true
//   },
//   "47639": {
//     "expressId": 47639,
//     "type": "IfcDistributionControlElement",
//     "name": "Accelerometro OnBoard - adxl354_adxl355:Tipo 1:293743",
//     "values": {
//       "Contrassegno": "2"
//     },
//     "selectable": true
//   },
//   "47665": {
//     "expressId": 47665,
//     "type": "IfcDistributionControlElement",
//     "name": "Accelerometro OnBoard - adxl354_adxl355:Tipo 1:296289",
//     "values": {
//       "Contrassegno": "3"
//     },
//     "selectable": true
//   },
//   "47691": {
//     "expressId": 47691,
//     "type": "IfcDistributionControlElement",
//     "name": "Accelerometro OnBoard - adxl354_adxl355:Tipo 1:296291",
//     "values": {
//       "Contrassegno": "4"
//     },
//     "selectable": true
//   },
//   "47731": {
//     "expressId": 47731,
//     "type": "IfcDistributionControlElement",
//     "name": "Accelerometro esterno:Tipo 1:297914",
//     "values": {
//       "Contrassegno": "5"
//     },
//     "selectable": true
//   },
//   "47791": {
//     "expressId": 47791,
//     "type": "IfcDistributionControlElement",
//     "name": "Clinometro di superficie:Tipo 1:298739",
//     "values": {
//       "Contrassegno": "6"
//     },
//     "selectable": true
//   }
// }
// `) as IfcElementData[]

export const DefaultViewer: Story = {
	args: {
		...defaultProps,
		// data,
	},
}
