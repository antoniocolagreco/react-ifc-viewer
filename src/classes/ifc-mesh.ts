import {
	DynamicDrawUsage,
	InstancedBufferAttribute,
	InstancedMesh,
	Matrix4,
	type BufferGeometry,
	type MeshLambertMaterial,
} from 'three'

class IfcMesh extends InstancedMesh<BufferGeometry, MeshLambertMaterial> {
	override name: string = 'IfcMesh'

	private capacity: number
	private static scratchMatrix: Matrix4 = new Matrix4()

	constructor(geometry: BufferGeometry, material: MeshLambertMaterial, initialCapacity = 1) {
		super(geometry, material, Math.max(initialCapacity, 1))
		this.capacity = Math.max(initialCapacity, 1)
		this.count = 0
		this.matrixAutoUpdate = false
		this.instanceMatrix.setUsage(DynamicDrawUsage)
	}

	private ensureCapacity = (requiredCount: number): void => {
		if (requiredCount <= this.capacity) {
			return
		}
		let nextCapacity = this.capacity
		while (nextCapacity < requiredCount) {
			nextCapacity *= 2
		}
		const nextArray = new Float32Array(nextCapacity * 16)
		nextArray.set(this.instanceMatrix.array as Float32Array)
		this.instanceMatrix = new InstancedBufferAttribute(nextArray, 16)
		this.instanceMatrix.setUsage(DynamicDrawUsage)
		this.capacity = nextCapacity
		this.instanceMatrix.needsUpdate = true
		this.computeBoundingSphere()
	}

	allocateInstance = (matrix: Matrix4): number => {
		const nextIndex = this.count
		this.ensureCapacity(nextIndex + 1)
		this.setMatrixAt(nextIndex, matrix)
		this.count = nextIndex + 1
		this.instanceMatrix.needsUpdate = true
		this.boundingSphere = null
		return nextIndex
	}

	updateInstanceMatrix = (instanceId: number, matrix: Matrix4): void => {
		if (instanceId < 0 || instanceId >= this.count) {
			throw new Error('Invalid instance identifier')
		}
		this.setMatrixAt(instanceId, matrix)
		this.instanceMatrix.needsUpdate = true
		this.boundingSphere = null
	}

	releaseInstance = (instanceId: number): number | undefined => {
		if (instanceId < 0 || instanceId >= this.count) {
			throw new Error('Invalid instance identifier')
		}
		const lastIndex = this.count - 1
		if (lastIndex < 0) {
			return undefined
		}
		if (instanceId !== lastIndex) {
			this.getMatrixAt(lastIndex, IfcMesh.scratchMatrix)
			this.setMatrixAt(instanceId, IfcMesh.scratchMatrix)
		}
		this.count = lastIndex
		this.instanceMatrix.needsUpdate = true
		this.boundingSphere = null
		if (instanceId === lastIndex) {
			return undefined
		}
		return lastIndex
	}
}

export { IfcMesh }
