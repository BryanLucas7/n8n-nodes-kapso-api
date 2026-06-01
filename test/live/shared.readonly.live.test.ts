import { describe, expect, it } from 'vitest';
import { kapsoLiveRequest } from '../helpers/liveRequest';
import {
	hasProductionReadonlyLiveConfig,
	hasSandboxLiveConfig,
	loadProductionLiveCredentials,
	loadSandboxLiveCredentials,
	shouldRunSharedLiveTests,
} from '../helpers/liveEnv';

const LIVE_TIMEOUT_MS = 15_000;

if (!shouldRunSharedLiveTests() || !hasSandboxLiveConfig() || !hasProductionReadonlyLiveConfig()) {
	describe.skip(
		'Kapso shared live tests skipped: set RUN_KAPSO_LIVE_TESTS=1, KAPSO_API_KEY, KAPSO_SANDBOX_PHONE_NUMBER_ID, KAPSO_PRODUCTION_PHONE_NUMBER_ID, and KAPSO_TEST_RECIPIENT',
		() => {
			it('skips live requests without explicit environment configuration', () => undefined);
		},
	);
} else {
	describe(
		'Kapso shared live API (read-only)',
		() => {
			it('lists phone numbers and includes sandbox and production entries', async () => {
				const credentials = loadSandboxLiveCredentials();
				const response = (await kapsoLiveRequest(credentials, {
					api: 'platform',
					method: 'GET',
					path: '/whatsapp/phone_numbers',
					query: { per_page: 50 },
				})) as { data?: Array<{ phone_number_id?: string; kind?: string }> };

				const numbers = response.data ?? [];
				const sandbox = numbers.find((entry) => entry.kind === 'sandbox');
				const production = numbers.find((entry) => entry.kind === 'production');

				expect(sandbox).toBeDefined();
				expect(production).toBeDefined();
			});

			it('gets sandbox phone number detail through platform API', async () => {
				const credentials = loadSandboxLiveCredentials();
				const response = await kapsoLiveRequest(credentials, {
					api: 'platform',
					method: 'GET',
					path: `/whatsapp/phone_numbers/${encodeURIComponent(credentials.phoneNumberId)}`,
				});

				expect(response).toHaveProperty('data');
			});

			it('gets production phone number detail through platform API', async () => {
				const credentials = loadProductionLiveCredentials();
				const response = await kapsoLiveRequest(credentials, {
					api: 'platform',
					method: 'GET',
					path: `/whatsapp/phone_numbers/${encodeURIComponent(credentials.phoneNumberId)}`,
				});

				expect(response).toHaveProperty('data');
			});

			it('lists api logs (read-only)', async () => {
				const credentials = loadSandboxLiveCredentials();
				const response = await kapsoLiveRequest(credentials, {
					api: 'platform',
					method: 'GET',
					path: '/api_logs',
					query: { per_page: 5 },
				});

				expect(response).toHaveProperty('data');
			});
		},
		{ timeout: LIVE_TIMEOUT_MS },
	);
}
