import {
	BoxGeometry,
	CanvasTexture,
	Group,
	Mesh,
	MeshBasicMaterial,
	Sprite,
	SpriteMaterial,
	type Vector3Tuple,
} from 'three'

type AxisProps = {
	color: string
	rotation: [number, number, number]
	scale?: [number, number, number]
}

type AxisHeadProps = {
	color: string
	label?: string
	labelColor: string
	axisHeadScale?: number
	font: string
	onClick?: (direction: Vector3Tuple) => void
}

type GizmoViewportProps = {
	axisColors?: [string, string, string]
	axisLabels?: [string, string, string]
	labelColor?: string
	hideAxisHeads?: { x?: boolean; y?: boolean; z?: boolean; xn?: boolean; yn?: boolean; zn?: boolean }
	size?: number
	font?: string
	onClick?: (direction: Vector3Tuple) => void
}

function createAxis({ color, rotation }: AxisProps): Group {
	const group = new Group()
	group.rotation.set(...rotation)
	const mesh = new Mesh(new BoxGeometry(), new MeshBasicMaterial({ color, toneMapped: false }))
	mesh.position.set(0.4, 0, 0)
	mesh.scale.set(0.8, 0.05, 0.05)
	group.add(mesh)
	return group
}

function createAxisHead({
	color,
	label,
	labelColor,
	axisHeadScale = 1,
	font,
	// onClick,
	position,
}: AxisHeadProps & { position: [number, number, number] }): Sprite {
	const canvas = document.createElement('canvas')
	canvas.width = 64
	canvas.height = 64

	const context = canvas.getContext('2d')
	if (!context) throw new Error('Could not get 2d context')
	context.beginPath()
	context.arc(32, 32, 16, 0, 2 * Math.PI)
	context.closePath()
	context.fillStyle = '#ffffff'
	context.fill()

	if (label) {
		context.font = font
		context.textAlign = 'center'
		context.fillStyle = labelColor
		context.fillText(label, 32, 40)
	}

	const texture = new CanvasTexture(canvas)
	const spriteMaterial = new SpriteMaterial({
		map: texture,
		alphaTest: 0.3,
		color,
		opacity: label ? 1 : 0.75,
		toneMapped: false,
	})
	const sprite = new Sprite(spriteMaterial)
	sprite.position.set(...position)

	const scale = (label ? 1 : 0.75) * axisHeadScale
	sprite.scale.set(scale, scale, scale)

	return sprite
}

export function createViewportGizmo({
	axisColors = ['#ff2060', '#20df80', '#2080ff'],
	axisLabels: labels = ['X', 'Y', 'Z'],
	labelColor = '#000',
	hideAxisHeads = { x: false, y: false, z: false, xn: false, yn: false, zn: false },
	font = '18px Inter var, Arial, sans-serif',
	size = 1,
	onClick,
}: GizmoViewportProps): Group {
	const [colorX, colorY, colorZ] = axisColors
	const group = new Group()
	group.scale.set(size, size, size)

	group.add(createAxis({ color: colorX, rotation: [0, 0, 0] }))
	group.add(createAxis({ color: colorY, rotation: [0, 0, Math.PI / 2] }))
	group.add(createAxis({ color: colorZ, rotation: [0, -Math.PI / 2, 0] }))

	const axisHeadProps = {
		font,
		labelColor,
		onClick,
	}

	if (!hideAxisHeads.x) {
		group.add(createAxisHead({ ...axisHeadProps, color: colorX, position: [1, 0, 0], label: labels[0] }))
	}
	if (!hideAxisHeads.y) {
		group.add(createAxisHead({ ...axisHeadProps, color: colorY, position: [0, 1, 0], label: labels[1] }))
	}
	if (!hideAxisHeads.z) {
		group.add(createAxisHead({ ...axisHeadProps, color: colorZ, position: [0, 0, 1], label: labels[2] }))
	}
	if (!hideAxisHeads.xn) {
		group.add(createAxisHead({ ...axisHeadProps, color: colorX, position: [-1, 0, 0] }))
	}
	if (!hideAxisHeads.yn) {
		group.add(createAxisHead({ ...axisHeadProps, color: colorY, position: [0, -1, 0] }))
	}
	if (!hideAxisHeads.zn) {
		group.add(createAxisHead({ ...axisHeadProps, color: colorZ, position: [0, 0, -1] }))
	}

	return group
}
