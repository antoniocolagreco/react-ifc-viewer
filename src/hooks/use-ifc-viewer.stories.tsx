import type { LinkRequirements, Requirements, SelectableRequirements } from '@/types'
import { fetchFile, getPercetage, type WasmPathType } from '@/utils'
import type { Meta, StoryObj } from '@storybook/react'
import { useState, type ComponentPropsWithRef, type FC } from 'react'
import { useIfcViewer } from './use-ifc-viewer'

type MockComponentsProps = ComponentPropsWithRef<'div'> & {
	keepProperties?: boolean
	linkRequirements?: LinkRequirements[]
	selectableRequirements?: SelectableRequirements[]
	alwaysVisibleRequirements?: Requirements[]
	wasmPath?: WasmPathType
}

const MockComponent: FC<MockComponentsProps> = props => {
	const { keepProperties, linkRequirements, selectableRequirements, alwaysVisibleRequirements, wasmPath, ...rest } =
		props
	const {
		utilities: { readProperties, loadingStatus },
	} = useIfcViewer()
	const [data, setData] = useState<string>()

	const load = async () => {
		let ifcBuffer: Uint8Array = new Uint8Array()

		await fetchFile(
			`${location.origin}${import.meta.env.BASE_URL}/test/castle.ifc`,
			buffer => {
				ifcBuffer = buffer
			},
			() => {},
			() => {},
		)

		const values = await readProperties(ifcBuffer, {
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
						width: getPercetage(loadingStatus.loaded, loadingStatus.total),
						backgroundColor: 'lightblue',
						zIndex: -1,
					}}
				/>
				{loadingStatus.status}
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
	selectableRequirements: [
		{ requiredProperties: [{ name: 'Contrassegno' }], requiredType: 'IfcDistributionControlElement' },
	],
	linkRequirements: [],
	alwaysVisibleRequirements: [],
}

export const DefaultViewer: Story = {
	args: {
		...defaultProps,
	},
}
