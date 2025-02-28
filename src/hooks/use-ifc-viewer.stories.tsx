import type { IfcElementLink, Requirements, SelectableRequirements } from '@/types'
import { fetchFile, getPath, getPercetage, type WasmPathType } from '@/utils'
import type { Meta, StoryObj } from '@storybook/react'
import { useState, type ComponentPropsWithRef, type FC } from 'react'
import { useIfcViewer } from './use-ifc-viewer'

type MockComponentsProps = ComponentPropsWithRef<'div'> & {
	keepProperties?: boolean
	linkRequirements?: IfcElementLink[]
	selectableRequirements?: SelectableRequirements[]
	alwaysVisibleRequirements?: Requirements[]
	wasmPath?: WasmPathType
}

const MockComponent: FC<MockComponentsProps> = props => {
	const { keepProperties, linkRequirements, selectableRequirements, alwaysVisibleRequirements, wasmPath, ...rest } =
		props
	const {
		utilities: { propertiesReader },
	} = useIfcViewer()
	const [data, setData] = useState<string>()

	const load = async () => {
		let ifcBuffer: Uint8Array = new Uint8Array()

		await fetchFile(
			`${await getPath()}/test/castle.ifc`,
			buffer => {
				ifcBuffer = buffer
			},
			() => {},
			() => {},
		)

		const values = await propertiesReader.read(ifcBuffer, {
			keepProperties,
			requirements: {
				linkRequirements,
				selectableRequirements,
				alwaysVisibleRequirements,
			},
			wasmPath,
		})
		setData(JSON.stringify(values, null, 2))
	}

	const handleClick = () => {
		void load()
	}

	return (
		<div
			style={{
				display: 'flex',
				gap: '1rem',
				flexDirection: 'column',
				fontFamily: 'sans-serif',
				fontSize: '12px',
			}}
			{...rest}
		>
			<div
				style={{
					display: 'flex',
					gap: '1rem',
					justifyContent: 'center',
					alignItems: 'center',
					position: 'relative',
					height: '20px',
				}}
			>
				<div
					style={{
						position: 'absolute',
						left: 0,
						top: 0,
						bottom: 0,
						width: getPercetage(propertiesReader.loaded, propertiesReader.total),
						backgroundColor: 'lightblue',
						zIndex: -1,
					}}
				/>
				{propertiesReader.status}
			</div>
			<button onClick={handleClick}>Load</button>
			<div
				style={{
					height: '256px',
					overflowX: 'hidden',
					overflowY: 'scroll',
					border: '1px solid #ccc',
					padding: '4px',
				}}
			>
				{data && <pre>{data}</pre>}
			</div>
		</div>
	)
}

const meta: Meta<typeof MockComponent> = {
	title: 'Hooks/Use Ifc Viewer',
	component: MockComponent,
	parameters: {},
	tags: ['autodocs'],
	argTypes: {},
}

export default meta

type Story = StoryObj<typeof meta>

const defaultProps: MockComponentsProps = {
	keepProperties: false,
	selectableRequirements: [{ properties: [{ name: 'Contrassegno' }], type: 'IfcDistributionControlElement' }],
	linkRequirements: [],
	alwaysVisibleRequirements: [],
}

export const DefaultViewer: Story = {
	args: {
		...defaultProps,
	},
}
