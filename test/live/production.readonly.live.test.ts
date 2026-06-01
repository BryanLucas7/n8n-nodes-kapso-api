import { describe, expect, it } from 'vitest';
import { expectListResponse, kapsoLiveRequest, resolveLiveBusinessAccountId } from '../helpers/liveRequest';
import {
	hasProductionReadonlyLiveConfig,
	loadProductionLiveCredentials,
	shouldRunProductionReadonlyLiveTests,
} from '../helpers/liveEnv';

const LIVE_TIMEOUT_MS = 15_000;

if (!shouldRunProductionReadonlyLiveTests() || !hasProductionReadonlyLiveConfig()) {
	describe.skip(
		'Kapso production read-only live tests skipped: set RUN_KAPSO_LIVE_TESTS=1, KAPSO_API_KEY, and KAPSO_PRODUCTION_PHONE_NUMBER_ID',
		() => {
			it('skips production live requests without explicit environment configuration', () => undefined);
		},
	);
} else {
	describe(
		'Kapso production read-only live API',
		() => {
			it('lists conversations for the production phone number', async () => {
				const credentials = loadProductionLiveCredentials();
				const response = await kapsoLiveRequest(credentials, {
					api: 'platform',
					method: 'GET',
					path: '/whatsapp/conversations',
					query: {
						phone_number_id: credentials.phoneNumberId,
						limit: 5,
					},
				});

				expect(Array.isArray(expectListResponse(response))).toBe(true);
			});

			it('lists platform messages for the production phone number', async () => {
				const credentials = loadProductionLiveCredentials();
				const response = await kapsoLiveRequest(credentials, {
					api: 'platform',
					method: 'GET',
					path: '/whatsapp/messages',
					query: {
						phone_number_id: credentials.phoneNumberId,
						limit: 5,
					},
				});

				expect(Array.isArray(expectListResponse(response))).toBe(true);
			});

			it('lists contacts through platform API', async () => {
				const credentials = loadProductionLiveCredentials();
				const response = await kapsoLiveRequest(credentials, {
					api: 'platform',
					method: 'GET',
					path: '/whatsapp/contacts',
					query: { per_page: 5 },
				});

				expect(Array.isArray(expectListResponse(response))).toBe(true);
			});

			it('lists broadcasts through platform API', async () => {
				const credentials = loadProductionLiveCredentials();
				const response = await kapsoLiveRequest(credentials, {
					api: 'platform',
					method: 'GET',
					path: '/whatsapp/broadcasts',
					query: { per_page: 5 },
				});

				expect(Array.isArray(expectListResponse(response))).toBe(true);
			});

			it('resolves WABA id and calls the template list path used by loadOptions', async (context) => {
				const credentials = loadProductionLiveCredentials();
				const wabaId = await resolveLiveBusinessAccountId(credentials);

				expect(wabaId.length).toBeGreaterThan(0);

				try {
					const response = await kapsoLiveRequest(credentials, {
						api: 'whatsapp',
						method: 'GET',
						path: `/${encodeURIComponent(wabaId)}/message_templates`,
						query: {
							status: 'APPROVED',
							limit: 20,
						},
					});

					expect(response).toHaveProperty('data');
					expect(Array.isArray((response as { data?: unknown[] }).data)).toBe(true);
				} catch (error) {
					const statusCode =
						error && typeof error === 'object'
							? (error as { statusCode?: number }).statusCode
							: undefined;

					if (statusCode === 403 || statusCode === 404) {
						context.skip(
							`Template list is not available for WABA ${wabaId} yet (${statusCode}). WABA resolution and request wiring still verified.`,
						);
					}

					throw error;
				}
			});

			it('lists meta messages for the production phone number', async () => {
				const credentials = loadProductionLiveCredentials();
				const response = await kapsoLiveRequest(credentials, {
					api: 'whatsapp',
					method: 'GET',
					path: `/${encodeURIComponent(credentials.phoneNumberId)}/messages`,
					query: { limit: 5 },
				});

				expect(response).toHaveProperty('data');
			});
		},
		{ timeout: LIVE_TIMEOUT_MS },
	);
}
