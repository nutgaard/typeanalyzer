import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        include: ['src/**/*.test.{ts,mts,cts}'],
        coverage: {
            lines: 90,
            functions: 90,
            branches: 90,
            statements: 90,
        }
    },
})