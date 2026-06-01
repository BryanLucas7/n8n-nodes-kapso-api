import { defineConfig } from 'vitest/config';

const includeLiveTests = process.env.RUN_KAPSO_LIVE_TESTS === '1';

export default defineConfig({
	test: {
		include: ['test/**/*.test.ts'],
		exclude: [
			'dist/**',
			'node_modules/**',
			...(includeLiveTests ? [] : ['test/live/**']),
		],
		testTimeout: includeLiveTests ? 15_000 : 5_000,
	},
	coverage: {
		provider: 'v8',
		include: ['nodes/**/*.ts', 'credentials/**/*.ts'],
		exclude: [
			'dist/**',
			'**/*.d.ts',
			'**/types.ts',
			'gulpfile.js',
			'index.js',
			'nodes/**/properties/**',
		],
		thresholds: {
			lines: 90,
			branches: 80,
			functions: 90,
			statements: 90,
		},
		reporter: ['text', 'json-summary', 'html'],
	},
});
