import react from '@vitejs/plugin-react-swc'
import { join, resolve } from 'path'
import { defineConfig, mergeConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { defineConfig as testDefineConfig } from 'vitest/config'
import { peerDependencies } from './package.json'

const basicConfig = defineConfig({
	plugins: [
		react(),
		dts({ rollupTypes: true }), // Output .d.ts files
	],
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
		},
	},
	build: {
		target: 'esnext',
		minify: false,
		lib: {
			entry: resolve(__dirname, join('src', 'index.ts')),
			fileName: 'index',
			formats: ['es', 'cjs'],
		},
		rollupOptions: {
			// Exclude peer dependencies from the bundle to reduce bundle size
			external: ['react/jsx-runtime', ...Object.keys(peerDependencies)],
		},
	},
})

const testConfig = testDefineConfig({
	test: {
		environment: 'jsdom',
		setupFiles: './src/test/setup.ts',
		coverage: {
			all: false,
			enabled: true,
		},
	},
})

export default mergeConfig(basicConfig, testConfig)
