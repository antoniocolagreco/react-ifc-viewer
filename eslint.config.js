import eslint from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import eslintConfigPrettier from 'eslint-config-prettier'
import jsxA11yEslintPlugin from 'eslint-plugin-jsx-a11y'
import reactEslintPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const config = tseslint.config({
	extends: [
		eslint.configs.recommended,
		tseslint.configs.strictTypeChecked,
		reactEslintPlugin.configs.flat?.recommended,
		jsxA11yEslintPlugin.flatConfigs.strict,
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
		'react-hooks': reactHooksPlugin,
		unicorn: eslintPluginUnicorn,
	},
	rules: {
		...reactHooksPlugin.configs.recommended.rules,
		'unicorn/filename-case': ['error', { case: 'kebabCase' }],
		'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
		'react/react-in-jsx-scope': 'off',
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
