import eslint from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'
import jestDomEslintPlugin from 'eslint-plugin-jest-dom'
import jsxA11yEslintPlugin from 'eslint-plugin-jsx-a11y'
import reactEslintPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactRefreshPlugin from 'eslint-plugin-react-refresh'
import storybookEslintPlugin from 'eslint-plugin-storybook'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const config = tseslint.config({
	extends: [
		eslint.configs.recommended,
		tseslint.configs.strictTypeChecked,
		eslintPluginUnicorn.configs['flat/recommended'],
		reactEslintPlugin.configs.flat?.recommended,
		jsxA11yEslintPlugin.flatConfigs.strict,
		reactRefreshPlugin.configs.recommended,
		eslintConfigPrettier,
	],
	files: ['src/**/*.ts', 'src/**/*.tsx'],
	ignores: [],
	languageOptions: {
		ecmaVersion: 'latest',
		globals: globals.browser,
		parser: tsParser,
		parserOptions: {
			ecmaVersion: 'latest',
			projectService: true,
			project: './tsconfig.json',
		},
	},
	plugins: {
		'jest-dom': jestDomEslintPlugin,
		'react-hooks': reactHooksPlugin,
		storybook: storybookEslintPlugin,
	},
	rules: {
		...reactHooksPlugin.configs.recommended.rules,
		'unicorn/prevent-abbreviations': 'off',
		'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
		'react/react-in-jsx-scope': 'off',
		'unicorn/numeric-separators-style': 'off',
		'unicorn/no-null': 'off',
		'@typescript-eslint/no-unnecessary-condition': ['error', { allowConstantLoopConditions: true }],
		'no-useless-rename': [
			'error',
			{
				ignoreDestructuring: false,
				ignoreImport: false,
				ignoreExport: false,
			},
		],
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
})

export default config
