import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  typescript: true,
  ignores: ['out', 'dist', '**/*.d.ts'],
}, {
  rules: {
    '@typescript-eslint/no-explicit-any': 1,
    'style/no-tabs': 1,
  },
})
