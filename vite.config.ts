import react from '@vitejs/plugin-react-swc'
import { join, resolve } from 'path'
import { preserveDirective } from 'rollup-preserve-directives'
import { defineConfig, mergeConfig } from 'vite'
import cssInjectedByJs from 'vite-plugin-css-injected-by-js'
import dts from 'vite-plugin-dts'
import { defineConfig as testDefineConfig } from 'vitest/config'
import { peerDependencies } from './package.json'

const base = process.env['BASE_URL'] ?? '/'

const basicConfig = defineConfig({
	base,
	plugins: [
		react(),
		dts({
			rollupTypes: false,
			strictOutput: true,
			exclude: ['src/test', '**/*.stories.tsx', '**/*.test.tsx', '**/*.test.ts'],
		}),
		cssInjectedByJs({
			relativeCSSInjection: true,
			topExecutionPriority: false,
		}),
	],
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
		},
	},
	build: {
		cssCodeSplit: true,
		target: 'esnext',
		copyPublicDir: false,
		minify: false,
		lib: {
			entry: resolve(__dirname, join('src/index.ts')),
			fileName: 'index',
			formats: ['es', 'cjs'],
		},
		rollupOptions: {
			// Exclude peer dependencies from the bundle to reduce bundle size
			external: ['react/jsx-runtime', ...Object.keys(peerDependencies)],
			output: {
				format: 'es',
				preserveModules: true,
				exports: 'named',
			},
			plugins: [preserveDirective()],
		},
	},
	css: {
		modules: false,
	},
})

const testConfig = testDefineConfig({
	test: {
		environment: 'jsdom',
		setupFiles: 'src/test/setup.ts',
		coverage: {
			all: false,
			enabled: true,
		},
	},
})

export default mergeConfig(basicConfig, testConfig)
