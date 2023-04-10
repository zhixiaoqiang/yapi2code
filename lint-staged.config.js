module.exports = {
	'./**/*.md': 'pnpm markdownlint-fix',
	'package.json': 'sort-package-json',
	'./**/*.{js?(x),ts?(x),mjs}': 'eslint --fix --cache'
}
