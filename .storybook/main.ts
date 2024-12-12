import { withoutVitePlugins } from '@storybook/builder-vite'
import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
	stories: ['../src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
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
		base: process.env['VITE_BASE_URL'],
		plugins: await withoutVitePlugins(config.plugins, ['vite:dts']), // skip dts plugin
	}),
}
export default config
