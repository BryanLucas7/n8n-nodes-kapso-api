import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['test/**/*.test.ts'],
		exclude: ['dist/**', 'node_modules/**'],
	},
	coverage: {
		provider: 'v8',
		include: ['nodes/**/*.ts', 'credentials/**/*.ts'],
		exclude: ['dist/**', '**/*.d.ts', '**/types.ts', 'gulpfile.js', 'index.js'],
		thresholds: {
			lines: 90,
		},
		reporter: ['text', 'json-summary'],
	},
});
