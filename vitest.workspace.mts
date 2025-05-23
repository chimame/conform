import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
	{
		test: {
			name: 'browser',
			browser: {
				enabled: true,
				provider: 'playwright',
				name: 'chromium',
			},
			include: ['tests/*.spec.ts'],
		},
	},
	{
		test: {
			name: 'node',
			include: [
				'tests/conform-yup.spec.ts',
				'tests/conform-zod.spec.ts',
			],
			environment: 'node',
		},
	},
	'packages/conform-valibot',
]);
