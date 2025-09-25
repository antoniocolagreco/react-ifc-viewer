import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Mock HTMLCanvasElement context
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
	value: vi.fn((contextType: string) => {
		if (contextType === 'webgl' || contextType === 'webgl2') {
			return {
				canvas: {},
				drawingBufferWidth: 1024,
				drawingBufferHeight: 768,
				getShaderPrecisionFormat: vi.fn(() => ({ precision: 1 })),
				getExtension: vi.fn(),
				getParameter: vi.fn(),
				createShader: vi.fn(),
				shaderSource: vi.fn(),
				compileShader: vi.fn(),
				createProgram: vi.fn(),
				attachShader: vi.fn(),
				linkProgram: vi.fn(),
				useProgram: vi.fn(),
				createBuffer: vi.fn(),
				bindBuffer: vi.fn(),
				bufferData: vi.fn(),
				enableVertexAttribArray: vi.fn(),
				vertexAttribPointer: vi.fn(),
				drawArrays: vi.fn(),
				flush: vi.fn(),
				finish: vi.fn(),
				getAttribLocation: vi.fn(),
				getUniformLocation: vi.fn(),
				uniform1f: vi.fn(),
				uniform2f: vi.fn(),
				uniform3f: vi.fn(),
				uniform4f: vi.fn(),
				uniformMatrix4fv: vi.fn(),
				activeTexture: vi.fn(),
				bindTexture: vi.fn(),
				createTexture: vi.fn(),
				texImage2D: vi.fn(),
				texParameteri: vi.fn(),
				generateMipmap: vi.fn(),
				blendFunc: vi.fn(),
				enable: vi.fn(),
				disable: vi.fn(),
				depthFunc: vi.fn(),
				clear: vi.fn(),
				clearColor: vi.fn(),
				clearDepth: vi.fn(),
				viewport: vi.fn(),
				scissor: vi.fn(),
			}
		}

		// Default 2D context mock
		return {
			fillStyle: '',
			strokeStyle: '',
			lineWidth: 1,
			clearRect: vi.fn(),
			fillRect: vi.fn(),
			strokeRect: vi.fn(),
			getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(16) })),
			putImageData: vi.fn(),
			createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(16) })),
			setTransform: vi.fn(),
			drawImage: vi.fn(),
			save: vi.fn(),
			restore: vi.fn(),
			beginPath: vi.fn(),
			moveTo: vi.fn(),
			lineTo: vi.fn(),
			closePath: vi.fn(),
			stroke: vi.fn(),
			fill: vi.fn(),
			measureText: vi.fn(() => ({ width: 10 })),
			transform: vi.fn(),
			translate: vi.fn(),
			scale: vi.fn(),
			rotate: vi.fn(),
			arc: vi.fn(),
			fillText: vi.fn(),
			strokeText: vi.fn(),
		}
	}),
})

// Mock URL methods
Object.defineProperty(globalThis.URL, 'createObjectURL', {
	value: vi.fn(() => 'mocked-url'),
})

Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
	value: vi.fn(),
})

// Mock Worker
Object.defineProperty(globalThis, 'Worker', {
	value: vi.fn().mockImplementation(() => ({
		postMessage: vi.fn(),
		terminate: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
	})),
})

afterEach(() => {
	cleanup()
})
