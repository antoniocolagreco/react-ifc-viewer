import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const utilsMocks = vi.hoisted(() => ({
	createBoundingSphere: vi.fn(),
	createBoundingSphereFromElement: vi.fn(),
	createBoundingSphereFromInstanceRecord: vi.fn(),
	createSphereMesh: vi.fn(),
	filterIfcElementsByPropertiesAndType: vi.fn(),
	fitBoundingSphere: vi.fn(),
	setMaterialToDefault: vi.fn(),
	setMaterialToHidden: vi.fn(),
	setMaterialToHovered: vi.fn(),
	setMaterialToSelected: vi.fn(),
	setMaterialToTransparent: vi.fn(),
}))

vi.mock('@/core/utils', async () => {
	const actual = await vi.importActual<typeof import('@/core/utils')>('@/core/utils')
	return {
		...actual,
		...utilsMocks,
	}
})

import { renderHook, act } from '@testing-library/react'
import { Matrix4, PerspectiveCamera, Raycaster, Scene, Sphere, Vector2, Vector3 } from 'three'
import type { OrbitControls } from 'three/examples/jsm/Addons.js'
import { IfcElement } from '@/core/models'
import type { IfcInstanceRecord } from '@/core/types'
import type { MutableRef, ViewerRefs } from '../types'

import { useViewerSelection } from './use-viewer-selection'

type MutableRefFactory = <TValue>(value: TValue) => MutableRef<TValue>

const createMutableRef: MutableRefFactory = value => ({ current: value })

const createControlsStub = () =>
	({
		target: new Vector3(),
		update: vi.fn(),
	}) as unknown as OrbitControls

const createViewerRefs = (modelOverrides: Partial<ViewerRefs['modelRef']['current']> = {}): ViewerRefs => {
	const mockModel = {
		getAllMeshes: vi.fn(() => []),
		getElements: vi.fn(() => []),
		getAllSeletableElements: vi.fn(() => []),
		getAllElementsWithPropertiesOrValues: vi.fn(() => []),
		getIfcElement: vi.fn(() => undefined),
		...modelOverrides,
	}

	return {
		containerRef: createMutableRef<HTMLDivElement | null>(null),
		canvasRef: createMutableRef<HTMLCanvasElement | null>(null),
		rendererRef: createMutableRef(undefined),
		cameraRef: createMutableRef<PerspectiveCamera | undefined>(new PerspectiveCamera()),
		controlsRef: createMutableRef(createControlsStub()),
		renderLoopRef: createMutableRef(undefined),
		rayCasterRef: createMutableRef(new Raycaster()),
		raycastTargetsRef: createMutableRef([]),
		sceneRef: createMutableRef(new Scene()),
		modelRef: createMutableRef(mockModel as ViewerRefs['modelRef']['current']),
		pointerRef: createMutableRef(new Vector2()),
		boundingSphereRef: createMutableRef<Sphere | undefined>(undefined),
		boundingSphereMeshRef: createMutableRef(undefined),
		selectedIfcElementRef: createMutableRef<IfcElement | undefined>(undefined),
		previousSelectedIfcElementRef: createMutableRef<IfcElement | undefined>(undefined),
		selectedInstanceRecordRef: createMutableRef<IfcInstanceRecord | undefined>(undefined),
		hoveredIfcElementRef: createMutableRef<IfcElement | undefined>(undefined),
		previousHoveredIfcElementRef: createMutableRef<IfcElement | undefined>(undefined),
		selectableIntersectionsRef: createMutableRef([]),
		mouseStatusRef: createMutableRef({ clicked: false, x: 0, y: 0 }),
		resizeObserverRef: createMutableRef(undefined),
		renderingEnabledRef: createMutableRef(false),
		renderingTimeoutRef: createMutableRef<ReturnType<typeof setTimeout> | undefined>(undefined),
		ifcMarkerLinksRef: createMutableRef([]),
		currentLoadedUrlRef: createMutableRef(''),
		controlsListenersRef: createMutableRef([]),
		viewportSizeRef: createMutableRef({ width: 0, height: 0 }),
	}
}

const {
	createBoundingSphere: mockCreateBoundingSphere,
	createBoundingSphereFromElement: mockCreateBoundingSphereFromElement,
	createBoundingSphereFromInstanceRecord: mockCreateBoundingSphereFromInstanceRecord,
	createSphereMesh: mockCreateSphereMesh,
	filterIfcElementsByPropertiesAndType: mockFilterIfcElements,
	fitBoundingSphere: mockFitBoundingSphere,
	setMaterialToDefault: mockSetMaterialToDefault,
	setMaterialToHidden: mockSetMaterialToHidden,
	setMaterialToHovered: mockSetMaterialToHovered,
	setMaterialToSelected: mockSetMaterialToSelected,
	setMaterialToTransparent: mockSetMaterialToTransparent,
} = utilsMocks

describe('useViewerSelection', () => {
	const renderScene = vi.fn()

	beforeEach(() => {
		renderScene.mockReset()

		mockCreateBoundingSphere.mockReset()
		// Mirror the production optimisation by mutating the provided sphere instead of returning a fresh instance.
		mockCreateBoundingSphere.mockImplementation((_objects, target: Sphere | undefined) => {
			if (target) {
				target.center.set(0, 0, 0)
				target.radius = 0
				return target
			}
			return new Sphere()
		})

		mockCreateBoundingSphereFromElement.mockReset()
		// Tests keep the shared-object behaviour aligned with runtime by mutating the incoming target.
		mockCreateBoundingSphereFromElement.mockImplementation((_element, _model, target: Sphere | undefined) => {
			if (target) {
				target.center.set(0, 0, 0)
				target.radius = 0
				return target
			}
			return new Sphere()
		})

		mockCreateBoundingSphereFromInstanceRecord.mockReset()
		mockCreateBoundingSphereFromInstanceRecord.mockImplementation((_record, _model, target: Sphere | undefined) => {
			const center = new Vector3(1, 2, 3)
			const radius = 4
			if (target) {
				target.center.copy(center)
				target.radius = radius
				return target
			}
			return new Sphere(center, radius)
		})

		mockCreateSphereMesh.mockReset()
		mockCreateSphereMesh.mockReturnValue({ layers: { set: vi.fn() } })

		mockFilterIfcElements.mockReset()
		mockFilterIfcElements.mockReturnValue([])

		mockFitBoundingSphere.mockReset()
		mockFitBoundingSphere.mockImplementation(() => {})

		mockSetMaterialToDefault.mockReset()
		mockSetMaterialToDefault.mockImplementation(() => {})

		mockSetMaterialToHidden.mockReset()
		mockSetMaterialToHidden.mockImplementation(() => {})

		mockSetMaterialToHovered.mockReset()
		mockSetMaterialToHovered.mockImplementation(() => {})

		mockSetMaterialToSelected.mockReset()
		mockSetMaterialToSelected.mockImplementation(() => {})

		mockSetMaterialToTransparent.mockReset()
		mockSetMaterialToTransparent.mockImplementation(() => {})
	})

	afterEach(() => {
		vi.clearAllMocks()
	})

	it('sets selected instance and updates bounding sphere when selecting', () => {
		const element = new IfcElement(1)
		const instanceRecord: IfcInstanceRecord = {
			element,
			geometryId: 'geom-1',
			materialId: 'mat-1',
			matrix: new Matrix4(),
			state: 'default',
		}

		const refs = createViewerRefs({ getElements: vi.fn(() => [element]) })

		const { result } = renderHook(() =>
			useViewerSelection({
				refs,
				renderScene,
				showBoundingSphere: false,
			}),
		)

		act(() => {
			result.current.select(element, instanceRecord)
		})

		expect(refs.selectedIfcElementRef.current).toBe(element)
		expect(refs.selectedInstanceRecordRef.current).toBe(instanceRecord)
		expect(refs.boundingSphereRef.current?.center).toEqual(new Vector3(1, 2, 3))
		expect(mockCreateBoundingSphereFromInstanceRecord).toHaveBeenCalledWith(
			instanceRecord,
			expect.any(Object),
			expect.any(Sphere),
		)
		expect(renderScene).toHaveBeenCalled()
	})

	it('fits the view around the stored bounding sphere', () => {
		const element = new IfcElement(10)
		const instanceRecord: IfcInstanceRecord = {
			element,
			geometryId: 'geom-fit',
			materialId: 'mat-fit',
			matrix: new Matrix4(),
			state: 'default',
		}
		const boundingSphere = new Sphere(new Vector3(4, 5, 6), 9)
		mockCreateBoundingSphereFromInstanceRecord.mockImplementationOnce(
			(_record, _model, target: Sphere | undefined) => {
				if (target) {
					target.center.copy(boundingSphere.center)
					target.radius = boundingSphere.radius
					return target
				}
				return boundingSphere
			},
		)

		const refs = createViewerRefs()
		const { result } = renderHook(() =>
			useViewerSelection({
				refs,
				renderScene,
				showBoundingSphere: false,
			}),
		)

		act(() => {
			result.current.select(element, instanceRecord)
		})

		mockFitBoundingSphere.mockClear()

		act(() => {
			result.current.fitView()
		})

		const lastCall = mockFitBoundingSphere.mock.calls.at(-1)
		expect(lastCall).toBeDefined()
		if (!lastCall) {
			throw new Error('fitBoundingSphere was not called')
		}
		const [sphereArg, cameraArg, controlsArg] = lastCall as [Sphere, PerspectiveCamera, OrbitControls]
		expect(sphereArg.center).toEqual(boundingSphere.center)
		expect(sphereArg.radius).toBe(boundingSphere.radius)
		expect(cameraArg).toBeInstanceOf(PerspectiveCamera)
		expect(controlsArg.target).toBeInstanceOf(Vector3)
		expect(renderScene).toHaveBeenCalled()
	})

	it('selects element by express id and uses its first instance record', () => {
		const element = new IfcElement(99)
		const instanceRecord: IfcInstanceRecord = {
			element,
			geometryId: 'geom-express',
			materialId: 'mat-express',
			matrix: new Matrix4(),
			state: 'default',
		}
		element.addInstanceRecord(instanceRecord)

		const refs = createViewerRefs({
			getIfcElement: vi.fn(() => element),
		})

		const { result } = renderHook(() =>
			useViewerSelection({
				refs,
				renderScene,
				showBoundingSphere: false,
			}),
		)

		act(() => {
			result.current.selectByExpressId(99)
		})

		expect(refs.selectedIfcElementRef.current).toBe(element)
		expect(mockCreateBoundingSphereFromInstanceRecord).toHaveBeenCalled()
	})
})
