'use client'

import type { IfcElement } from '@/classes'
import { IfcMesh, IfcModel } from '@/classes'
import { type IfcOverlayProps } from '@/components'
import { IfcAnchor, type IfcAnchorProps } from '@/components/ifc-anchor'
import { ProgressBar } from '@/components/progress-bar'
import { IFCViewerLoadingMessages } from '@/costants'
import { useGlobalState } from '@/hooks/use-global-state'
import { useThrottle } from '@/hooks/use-throttle'
import type {
	IfcElementData,
	IfcElementLink,
	IfcInstanceRecord,
	IfcMarkerLink,
	LambertMesh,
	Property,
	Requirements,
	SelectableRequirements,
} from '@/types'
import {
	alignObject,
	createBoundingSphere,
	createBoundingSphereFromElement,
	createSphereMesh,
	disposeObjects,
	fetchFile,
	filterIfcElementsByPropertiesAndType,
	fitBoundingSphere,
	getGroupPosition,
	isFragment,
	isIfcMarker,
	isRunningInBrowser,
	loadIfcModel,
	loadIfcProperties,
	processIfcData,
	restoreDataToIfcModelFromProperties,
	restoreDataToIfcModelFromRecord,
	setMaterialToDefault,
	setMaterialToHidden,
	setMaterialToHovered,
	setMaterialToSelected,
	setMaterialToTransparent,
	transformViewportPositionToScreenPosition,
} from '@/utils'
import clsx from 'clsx'
import {
	Children,
	useCallback,
	useEffect,
	useRef,
	useState,
	type ComponentPropsWithRef,
	type CSSProperties,
	type FC,
	type MouseEvent,
	type ReactElement,
	type ReactNode,
} from 'react'
import { Raycaster, Scene, Sphere, Vector2, type Intersection, type PerspectiveCamera, type WebGLRenderer } from 'three'
import type { OrbitControls } from 'three/examples/jsm/Addons.js'
import './ifc-viewer.css'
import type { IfcLoadingStatus, IfcMouseState, IfcViewMode } from './types'
import {
	createRenderLoop,
	createResizeObserver,
	createViewerCamera,
	createViewerControls,
	createViewerRenderer,
	populateSceneWithDefaults,
	type RenderLoop,
} from './scene-setup'

const LAYER_MESHES = 0
const LAYER_HELPERS = 29

type IfcViewerProps = ComponentPropsWithRef<'div'> & {
	url: string
	data?: IfcElementData[]

	onModelLoaded?: (model: IfcModel) => void

	hoverColor?: number
	selectedColor?: number

	links?: IfcElementLink[]
	selectable?: SelectableRequirements[]
	alwaysVisible?: Requirements[]

	highlightedSelectables?: SelectableRequirements[]

	onMeshSelect?: (ifcElement?: IfcElement) => void
	onMeshHover?: (ifcElement?: IfcElement) => void

	enableMeshSelection?: boolean
	enableMeshHover?: boolean
	showBoundingSphere?: boolean
}

type SelectableIntersection = {
	element: IfcElement
	instance: IfcInstanceRecord
	intersection: Intersection<IfcMesh>
}

const IfcViewer: FC<IfcViewerProps> = props => {
	const {
		url,
		data,

		hoverColor,
		selectedColor,

		onModelLoaded,

		links: linksRequirements,
		selectable: selectableRequirements,
		alwaysVisible: alwaysVisibleRequirements,

		onMeshHover,
		onMeshSelect,

		enableMeshHover = false,
		enableMeshSelection = false,
		showBoundingSphere = false,

		className,
		children,
		ref,

		...otherProps
	} = props
	const currentLoadedUrlRef = useRef<string>('')

	const containerRef = useRef<HTMLDivElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)

	const rendererRef = useRef<WebGLRenderer>(undefined)
	const cameraRef = useRef<PerspectiveCamera>(undefined)
	const controlsRef = useRef<OrbitControls>(undefined)
	const renderLoopRef = useRef<RenderLoop | undefined>(undefined)

	const sceneRef = useRef<Scene>(new Scene())
	const modelRef = useRef<IfcModel>(undefined)
	const rayCasterRef = useRef<Raycaster>(new Raycaster())

	const pointerRef = useRef<Vector2>(new Vector2())

	const boundingSphereRef = useRef<Sphere>(undefined)
	const boundingSphereMeshRef = useRef<LambertMesh>(undefined)

	const selectedIfcElementRef = useRef<IfcElement>(undefined)
	const previousSelectedIfcElementRef = useRef<IfcElement>(undefined)
	const hoveredIfcElementRef = useRef<IfcElement>(undefined)
	const previousHoveredIfcElementRef = useRef<IfcElement>(undefined)

	const selectableIntersectionsRef = useRef<SelectableIntersection[]>([])
	const mouseStatusRef = useRef<IfcMouseState>({ clicked: false, x: 0, y: 0 })

	const resizeObserverRef = useRef<ResizeObserver>(undefined)

	const renderingEnabledRef = useRef(false)
	const renderingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

	const ifcMarkerLinksRef = useRef<IfcMarkerLink[]>([])
	const [ifcAnchors, setIfcAnchors] = useState<ReactElement<IfcAnchorProps>[]>()
	const [ifcViewerChildren, setIfcViewerChildren] = useState<ReactNode[]>()

	const [viewMode, setViewMode] = useState<IfcViewMode>('VIEW_MODE_ALL')
	const [cursorStyle, setCursorStyle] = useState<CSSProperties>({ cursor: 'default' })

	const [loadingProgress, setLoadingProgress] = useState<IfcLoadingStatus>({
		status: 'NOT_INITIALIZED',
	})

	const deboucedProgress = useThrottle(loadingProgress, 50)

	const { setGlobalState } = useGlobalState()

	useEffect(() => {
		if (ref) {
			if (typeof ref === 'function') {
				ref(containerRef.current)
			} else {
				ref.current = containerRef.current
			}
		}
	}, [ref])

	const processIfcMarker = useCallback((ifcMarkerElement: ReactElement<IfcOverlayProps>): IfcMarkerLink[] => {
		if (!modelRef.current) {
			return []
		}

		const newMarkerLinks: IfcMarkerLink[] = []
		const markerRequirements = ifcMarkerElement.props.requirements
		const props = ifcMarkerElement.props

		const ifcElements = filterIfcElementsByPropertiesAndType(
			modelRef.current,
			markerRequirements.properties,
			markerRequirements.type,
			markerRequirements.tag,
			markerRequirements.expressId,
		)

		for (const element of ifcElements) {
			newMarkerLinks.push({ element, props })
		}
		return newMarkerLinks
	}, [])

	const processChildren = useCallback(() => {
		const newMarkerLinks: IfcMarkerLink[] = []
		const newChildren: ReactNode[] = []

		const childrenStack = Children.toArray(children)

		while (childrenStack.length > 0) {
			const child = childrenStack.pop()

			if (!child) continue

			if (isFragment(child)) {
				childrenStack.push(...Children.toArray(child.props.children))
			} else if (isIfcMarker(child)) {
				newMarkerLinks.push(...processIfcMarker(child))
			} else {
				newChildren.push(child)
			}
		}

		ifcMarkerLinksRef.current = newMarkerLinks

		setIfcViewerChildren(newChildren)
	}, [children, processIfcMarker])

	const resetScene = useCallback((): void => {
		disposeObjects(sceneRef.current)
		sceneRef.current.children.length = 0
		populateSceneWithDefaults(sceneRef.current, LAYER_HELPERS)
	}, [])

	const updateBoundingSphere = useCallback((): void => {
		const model = modelRef.current
		if (!model) {
			return
		}

		if (selectedIfcElementRef.current) {
			boundingSphereRef.current = createBoundingSphereFromElement(selectedIfcElementRef.current, model)
		} else {
			const meshes = model.getAllMeshes()
			boundingSphereRef.current = meshes.length === 0 ? new Sphere() : createBoundingSphere(meshes)
		}

		if (!showBoundingSphere) {
			return
		}

		if (boundingSphereMeshRef.current) {
			sceneRef.current.remove(boundingSphereMeshRef.current)
		}
		const sphereMesh = createSphereMesh(boundingSphereRef.current)
		sphereMesh.layers.set(LAYER_HELPERS)
		boundingSphereMeshRef.current = sphereMesh
		sceneRef.current.add(boundingSphereMeshRef.current)
	}, [showBoundingSphere])

	const updateMeshDisplay = useCallback(
		(ifcElement: IfcElement) => {
			if (!modelRef.current) {
				return
			}

			if (ifcElement === selectedIfcElementRef.current) {
				setMaterialToSelected(ifcElement, modelRef.current, selectedColor)
			} else if (ifcElement === hoveredIfcElementRef.current) {
				setMaterialToHovered(ifcElement, modelRef.current, hoverColor)
			} else {
				switch (viewMode) {
					case 'VIEW_MODE_ALL': {
						setMaterialToDefault(ifcElement, modelRef.current)
						break
					}
					case 'VIEW_MODE_TRANSPARENT': {
						if (ifcElement.userData.alwaysVisible || ifcElement.userData.selectable) {
							setMaterialToDefault(ifcElement, modelRef.current)
						} else {
							setMaterialToTransparent(ifcElement, modelRef.current)
						}
						break
					}
					case 'VIEW_MODE_SELECTABLE': {
						if (ifcElement.userData.alwaysVisible || ifcElement.userData.selectable) {
							setMaterialToDefault(ifcElement, modelRef.current)
						} else {
							setMaterialToHidden(ifcElement, modelRef.current)
						}
						break
					}
				}
			}
		},
		[hoverColor, selectedColor, viewMode],
	)

	const updateAllMeshesDisplay = useCallback(() => {
		if (!modelRef.current) {
			return
		}
		for (const ifcElement of modelRef.current.getElements()) {
			updateMeshDisplay(ifcElement)
		}
	}, [updateMeshDisplay])

	const renderScene = useCallback((): void => {
		if (!containerRef.current || !rendererRef.current || !cameraRef.current || !controlsRef.current) {
			return
		}

		const width = containerRef.current.clientWidth
		const height = containerRef.current.clientHeight
		cameraRef.current.aspect = width / height
		cameraRef.current.updateProjectionMatrix()
		rendererRef.current.setSize(width, height)
		controlsRef.current.update()
		rendererRef.current.render(sceneRef.current, cameraRef.current)
	}, [])

	const switchSelectedMesh = useCallback(() => {
		if (previousSelectedIfcElementRef.current) {
			updateMeshDisplay(previousSelectedIfcElementRef.current)
		}
		if (selectedIfcElementRef.current) {
			updateMeshDisplay(selectedIfcElementRef.current)
		}
	}, [updateMeshDisplay])

	const switchHoveredMesh = useCallback(() => {
		if (previousHoveredIfcElementRef.current) {
			updateMeshDisplay(previousHoveredIfcElementRef.current)
		}
		if (hoveredIfcElementRef.current) {
			updateMeshDisplay(hoveredIfcElementRef.current)
		}
	}, [updateMeshDisplay])

	const select = useCallback(
		(ifcElement?: IfcElement): void => {
			previousSelectedIfcElementRef.current = selectedIfcElementRef.current
			selectedIfcElementRef.current = ifcElement
			updateBoundingSphere()
			switchSelectedMesh()
			renderScene()

			if (ifcElement && onMeshSelect) {
				onMeshSelect(ifcElement)
			}
		},
		[updateBoundingSphere, switchSelectedMesh, renderScene, onMeshSelect],
	)

	const hover = useCallback(
		(ifcElement?: IfcElement): void => {
			previousHoveredIfcElementRef.current = hoveredIfcElementRef.current
			hoveredIfcElementRef.current = ifcElement

			switchHoveredMesh()
			renderScene()

			if (hoveredIfcElementRef.current) {
				setCursorStyle({ cursor: 'pointer' })
				return
			}
			setCursorStyle({ cursor: 'default' })

			if (ifcElement && onMeshHover) {
				onMeshHover(ifcElement)
			}
		},
		[onMeshHover, switchHoveredMesh, renderScene],
	)

	const updateAnchors = useCallback(() => {
		if (!cameraRef.current || !rendererRef.current) {
			return
		}
		const model = modelRef.current
		if (!model) {
			return
		}
		const newAnchors: ReactElement<IfcAnchorProps>[] = []
		const ifcMarkerLinks = ifcMarkerLinksRef.current

		for (const ifcMarkerLink of ifcMarkerLinks) {
			const { element, props } = ifcMarkerLink

			const ifcElement3dPosition = getGroupPosition(element, model)
			const position = transformViewportPositionToScreenPosition(
				cameraRef.current,
				rendererRef.current,
				ifcElement3dPosition,
			)

			newAnchors.push(
				<IfcAnchor
					key={ifcMarkerLinks.indexOf(ifcMarkerLink)}
					position={position}
					onSelect={() => {
						select(element)
						if (!props.onSelect) return
						props.onSelect(element.userData)
					}}
					onHover={() => {
						hover(element)
						if (!props.onHover) return
						props.onHover(element.userData)
					}}
				>
					{props.children}
				</IfcAnchor>,
			)
		}
		setIfcAnchors(newAnchors)
	}, [hover, select])

	const updateMousePointer = (event: MouseEvent): void => {
		if (!canvasRef.current) throw new Error('Canvas not loaded')
		const rect = canvasRef.current.getBoundingClientRect()

		const mouseX = event.clientX - rect.left
		const mouseY = event.clientY - rect.top

		pointerRef.current.x = (mouseX / canvasRef.current.clientWidth) * 2 - 1
		pointerRef.current.y = -(mouseY / canvasRef.current.clientHeight) * 2 + 1
	}

	const updateIntersections = useCallback((): void => {
		if (!cameraRef.current) {
			throw new Error('Camera not found')
		}
		const model = modelRef.current
		if (!model) {
			selectableIntersectionsRef.current = []
			return
		}
		rayCasterRef.current.setFromCamera(pointerRef.current, cameraRef.current)
		const allIntersections = rayCasterRef.current.intersectObjects(sceneRef.current.children, true)
		const selectable: SelectableIntersection[] = []
		for (const intersection of allIntersections) {
			if (!(intersection.object instanceof IfcMesh)) {
				continue
			}
			const instanceId = intersection.instanceId
			if (typeof instanceId !== 'number') {
				continue
			}
			const instanceRecord = model.getInstanceRecord(intersection.object, instanceId)
			if (!instanceRecord) {
				continue
			}
			const element = instanceRecord.element
			if (!element.isSelectable()) {
				continue
			}
			selectable.push({ element, instance: instanceRecord, intersection: intersection as Intersection<IfcMesh> })
		}
		selectableIntersectionsRef.current = selectable
	}, [])

	const handleMouseLeave = useCallback((): void => {
		hover()
	}, [hover])

	const handleMouseDown = useCallback((event: MouseEvent<HTMLCanvasElement>): void => {
		mouseStatusRef.current = { clicked: true, x: event.clientX, y: event.clientY }
		renderingEnabledRef.current = true
	}, [])

	const handleMouseUp = useCallback(
		(event: MouseEvent<HTMLCanvasElement>): void => {
			renderingEnabledRef.current = false
			if (!mouseStatusRef.current.clicked) return
			const currentX = event.clientX
			const currentY = event.clientY

			if (
				Math.abs(currentX - mouseStatusRef.current.x) > 8 ||
				Math.abs(currentY - mouseStatusRef.current.y) > 8
			) {
				mouseStatusRef.current = { clicked: false, x: 0, y: 0 }
				return
			}

			if (!enableMeshSelection) return

			updateMousePointer(event)
			updateIntersections()

			// Check if there are intersections
			if (selectableIntersectionsRef.current.length === 0) {
				select()
				return
			}

			const firstSelectable = selectableIntersectionsRef.current.at(0)
			const ifcElement = firstSelectable?.element

			if (
				selectableRequirements &&
				selectableRequirements.length > 0 &&
				ifcElement &&
				!ifcElement.isSelectable()
			) {
				select()
				return
			}

			select(ifcElement)
			renderScene()
			updateAnchors()
		},
		[enableMeshSelection, updateIntersections, selectableRequirements, select, renderScene, updateAnchors],
	)

	const handleMouseMove = useCallback(
		(event: MouseEvent<HTMLCanvasElement>): void => {
			renderingEnabledRef.current = true
			if (renderingTimeoutRef.current) {
				clearTimeout(renderingTimeoutRef.current)
			}
			renderingTimeoutRef.current = setTimeout(() => {
				renderingEnabledRef.current = false
			}, 1000)

			if (!enableMeshHover) return
			updateMousePointer(event)
			updateIntersections()
			const firstSelectable = selectableIntersectionsRef.current.at(0)
			const ifcElement = firstSelectable?.element

			if (
				selectableRequirements &&
				selectableRequirements.length > 0 &&
				ifcElement &&
				!ifcElement.isSelectable()
			) {
				hover()
				return
			}

			hover(ifcElement)
		},
		[enableMeshHover, hover, selectableRequirements, updateIntersections],
	)

	const fitView = useCallback((): void => {
		if (!boundingSphereRef.current) return
		if (!cameraRef.current) {
			throw new Error('Camera not found')
		}
		if (!controlsRef.current) {
			throw new Error('Controls not found')
		}
		fitBoundingSphere(boundingSphereRef.current, cameraRef.current, controlsRef.current)
		renderScene()
		updateAnchors()
	}, [renderScene, updateAnchors])

	const focusView = useCallback((): void => {
		if (!boundingSphereRef.current) return
		if (!controlsRef.current) {
			throw new Error('Controls not found')
		}
		controlsRef.current.target.copy(boundingSphereRef.current.center)
		renderScene()
		updateAnchors()
	}, [renderScene, updateAnchors])

	const resetView = useCallback(() => {
		if (!cameraRef.current || !controlsRef.current) {
			return
		}
		select()
		updateBoundingSphere()
		if (boundingSphereRef.current) {
			cameraRef.current.position.set(10, 20, 20)
			fitBoundingSphere(boundingSphereRef.current, cameraRef.current, controlsRef.current)
		}
		renderScene()
		updateAnchors()
	}, [select, updateBoundingSphere, renderScene, updateAnchors])

	const selectByExpressId = useCallback(
		(expressId: number | undefined): void => {
			if (!modelRef.current || !expressId) {
				select()
				return undefined
			}

			const ifcElement = modelRef.current.getIfcElement(expressId)
			select(ifcElement)
		},
		[select],
	)

	const selectByProperty = useCallback(
		(property: Property | undefined): IfcElement | undefined => {
			if (!modelRef.current) {
				select()
				return undefined
			}
			if (!property) {
				select()
				return undefined
			}

			const foundElements = filterIfcElementsByPropertiesAndType(modelRef.current, [property])

			if (foundElements.length === 0) return undefined
			const foundElement = foundElements[0]

			select(foundElement)
			fitView()

			return foundElement
		},
		[fitView, select],
	)

	const changeViewMode = useCallback((mode?: IfcViewMode) => {
		setViewMode(state => {
			if (mode) {
				return mode
			}
			switch (state) {
				case 'VIEW_MODE_SELECTABLE': {
					return 'VIEW_MODE_ALL'
				}
				case 'VIEW_MODE_ALL': {
					return 'VIEW_MODE_TRANSPARENT'
				}
				case 'VIEW_MODE_TRANSPARENT': {
					return 'VIEW_MODE_SELECTABLE'
				}
			}
		})
	}, [])

	useEffect(() => {
		updateAllMeshesDisplay()
		renderScene()
	}, [renderScene, updateAllMeshesDisplay])

	const init = useCallback(() => {
		if (loadingProgress.status !== 'NOT_INITIALIZED') {
			return
		}
		const canvas = canvasRef.current
		if (!canvas) {
			throw new Error('Canvas not found')
		}

		const renderer = createViewerRenderer(canvas)
		rendererRef.current = renderer

		const camera = createViewerCamera(canvas, { meshes: LAYER_MESHES, helpers: LAYER_HELPERS })
		cameraRef.current = camera
		sceneRef.current.add(camera)

		const controls = createViewerControls(camera, renderer)
		controlsRef.current = controls

		rayCasterRef.current.layers.set(LAYER_MESHES)

		const container = containerRef.current
		if (!container) {
			throw new Error('Container not found')
		}

		const handleResize = (): void => {
			renderScene()
			updateAnchors()
		}
		resizeObserverRef.current = createResizeObserver(container, handleResize)

		resetScene()

		const renderLoop = createRenderLoop(() => {
			if (!renderingEnabledRef.current) {
				return
			}
			renderScene()
			updateAnchors()
		})
		renderLoop.start()
		renderLoopRef.current = renderLoop
	}, [loadingProgress.status, renderScene, resetScene, updateAnchors])

	const unloadEverything = useCallback((): void => {
		boundingSphereMeshRef.current = undefined
		disposeObjects(sceneRef.current)
		renderLoopRef.current?.stop()
		renderLoopRef.current = undefined
		resizeObserverRef.current?.disconnect()
		rendererRef.current?.dispose()
	}, [])

	const updateGlobalState = useCallback(() => {
		setGlobalState({
			viewPort: {
				focusView,
				fitView,
				resetView,
				changeViewMode,
				viewMode,
			},
			loadingProgress: deboucedProgress,
			model: modelRef.current,
			selectableElements: modelRef.current?.getAllSeletableElements(),
			selectByProperty,
			selectByExpressId,
			getElementByExpressId: modelRef.current?.getIfcElement,
			getElementsWithData: modelRef.current?.getAllElementsWithPropertiesOrValues,
			renderScene,
			updateAnchors,
		})
	}, [
		changeViewMode,
		deboucedProgress,
		fitView,
		focusView,
		renderScene,
		resetView,
		selectByExpressId,
		selectByProperty,
		setGlobalState,
		updateAnchors,
		viewMode,
	])

	useEffect(() => {
		updateGlobalState()
	}, [updateGlobalState])

	const loadFile = useCallback(async (): Promise<void> => {
		resetScene()

		let ifcBuffer: Uint8Array = new Uint8Array()
		setLoadingProgress({ status: 'FETCHING' })

		await fetchFile(
			url,
			buffer => {
				ifcBuffer = buffer
			},
			progress => {
				setLoadingProgress({ status: 'FETCHING', loaded: progress.loaded, total: progress.total })
			},
			error => {
				setLoadingProgress({ status: 'ERROR_FETCHING' })
				throw error
			},
		)

		setLoadingProgress({ status: 'LOADING_MESHES' })

		await loadIfcModel(
			ifcBuffer,
			loadedModel => {
				modelRef.current = loadedModel
				sceneRef.current.add(loadedModel)

				alignObject(modelRef.current, { x: 'center', y: 'bottom', z: 'center' })

				sceneRef.current.updateMatrix()
				sceneRef.current.updateMatrixWorld(true)

				resetView()
				renderScene()
			},
			error => {
				setLoadingProgress({ status: 'ERROR_LOADING_MESHES' })
				throw error
			},
		)

		let ifcModelItemsData: IfcElementData[] = []

		if (!modelRef.current) {
			throw new Error('Model not found')
		}

		if (data) {
			ifcModelItemsData = data
			setLoadingProgress({ status: 'SETTING_DATA' })
			restoreDataToIfcModelFromRecord(modelRef.current, ifcModelItemsData)
		} else {
			await loadIfcProperties(
				ifcBuffer,
				data => {
					ifcModelItemsData = data
				},
				progress => {
					setLoadingProgress({
						status: 'LOADING_PROPERTIES',
						loaded: progress.loaded,
						total: progress.total,
					})
				},
				error => {
					setLoadingProgress({ status: 'ERROR_LOADING_PROPERTIES' })
					throw error
				},
			)

			const total = ifcModelItemsData.length
			for (let index = 0; index < total; index++) {
				const ifcElementData = ifcModelItemsData[index]

				if (!ifcElementData) {
					throw new Error('ifcElement not found')
				}
				processIfcData(
					ifcElementData,
					ifcModelItemsData,
					linksRequirements,
					selectableRequirements,
					alwaysVisibleRequirements,
				)

				setLoadingProgress({ status: 'PROCESSING', loaded: index, total })
			}
			setLoadingProgress({ status: 'SETTING_DATA' })
			restoreDataToIfcModelFromProperties(modelRef.current, ifcModelItemsData)
		}

		if (onModelLoaded) {
			onModelLoaded(modelRef.current)
		}

		setLoadingProgress({ status: 'DONE' })
	}, [
		alwaysVisibleRequirements,
		data,
		linksRequirements,
		onModelLoaded,
		renderScene,
		resetScene,
		resetView,
		selectableRequirements,
		url,
	])

	useEffect(() => {
		if (!isRunningInBrowser()) {
			return
		}

		init()

		if (currentLoadedUrlRef.current !== url) {
			currentLoadedUrlRef.current = url
			void loadFile().then(() => {
				processChildren()
				updateAnchors()
			})
		}

		processChildren()
		updateAnchors()
	}, [init, loadFile, processChildren, resetView, updateAnchors, url])

	useEffect(() => {
		return () => {
			unloadEverything()
			resizeObserverRef.current?.disconnect()
		}
	}, [unloadEverything])

	return (
		<div className={clsx('ifc-viewer', className)} ref={containerRef} {...otherProps}>
			<canvas
				ref={canvasRef}
				onMouseDown={handleMouseDown}
				onMouseUp={handleMouseUp}
				onMouseMove={handleMouseMove}
				onMouseLeave={handleMouseLeave}
				style={cursorStyle}
			/>
			{ifcAnchors}
			<div className="ifc-children-container">{ifcViewerChildren}</div>
			{deboucedProgress.status !== 'DONE' && (
				<div className="ifc-progress-bar-container">
					<ProgressBar
						max={deboucedProgress.total}
						value={deboucedProgress.loaded}
						state={deboucedProgress.status.toUpperCase().includes('ERROR') ? 'ERROR' : 'LOADING'}
					>
						{IFCViewerLoadingMessages[deboucedProgress.status]}
					</ProgressBar>
				</div>
			)}
		</div>
	)
}

export { IfcViewer, type IfcViewerProps }
