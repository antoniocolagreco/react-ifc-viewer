import { withoutVitePlugins } from '@storybook/builder-vite'
import { resolve } from 'node:path'
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(ts|tsx)'],
	addons: ['@storybook/addon-essentials', '@storybook/addon-actions'],
	framework: {
		name: '@storybook/react-vite',
		options: {},
	},
	docs: {
		autodocs: 'tag',
	},
	viteFinal: async config => ({
		...config,
		// Prefer VITE_BASE_URL (used in CI) and fall back to BASE_URL or '/'
		base: process.env['VITE_BASE_URL'] ?? process.env['BASE_URL'] ?? '/',
		resolve: {
			alias: {
				'@': resolve(__dirname, '../src'),
			},
		},
		plugins: await withoutVitePlugins(config.plugins, ['vite:dts']), // skip dts plugin
	}),
}
export default config
