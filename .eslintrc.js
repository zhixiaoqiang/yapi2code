const { defineConfig } = require('eslint-define-config')
const prettierrc = require('./.prettierrc')

module.exports = defineConfig({
	root: true,
	env: {
		browser: true,
		es2021: true,
		node: true
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier'
	],
	parserOptions: {
		ecmaVersion: 'latest',
		parser: '@typescript-eslint/parser',
		sourceType: 'module'
	},

	plugins: ['@typescript-eslint', 'prettier'],
	rules: {
		'prettier/prettier': ['error', prettierrc],
		'arrow-body-style': 'off',
		'prefer-arrow-callback': 'off',
		'@typescript-eslint/no-var-requires': 1,
		'@typescript-eslint/no-explicit-any': 1,
		curly: 'warn',
		eqeqeq: 'warn',
		'no-throw-literal': 'warn',
		semi: 'off'
	},
	ignorePatterns: ['out', 'dist', '**/*.d.ts']
})
