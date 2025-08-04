import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  typescript: true,
  ignores: ['out', 'dist', '**/*.d.ts'],
}, {
  rules: {
    '@typescript-eslint/no-explicit-any': 1,
    'style/no-tabs': 1,
    'ts/prefer-literal-enum-member': 1,
    'regexp/no-unused-capturing-group': 0,
    'array-callback-return': 1,
    'ts/no-use-before-define': 1,
    'style/no-mixed-spaces-and-tabs': 1,
    'no-console': 0,
  },
})
