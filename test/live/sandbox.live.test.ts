import { describe, expect, it } from 'vitest';
import { buildTextMessage } from '../../nodes/KapsoApi/actions/messagePayloads';
import {
	expectListResponse,
	kapsoLiveRequest,
	resolveLiveBusinessAccountId,
} from '../helpers/liveRequest';
import {
	hasSandboxLiveConfig,
	isSandboxSendEnabled,
	isSandboxSessionWindowError,
	loadSandboxLiveCredentials,
	sandboxRecipient,
	shouldRunSandboxLiveTests,
} from '../helpers/liveEnv';

const LIVE_TIMEOUT_MS = 15_000;

if (!shouldRunSandboxLiveTests() || !hasSandboxLiveConfig()) {
	describe.skip(
		'Kapso sandbox live tests skipped: set RUN_KAPSO_LIVE_TESTS=1, KAPSO_API_KEY, KAPSO_SANDBOX_PHONE_NUMBER_ID, and KAPSO_TEST_RECIPIENT',
		() => {
			it('skips sandbox live requests without explicit environment configuration', () => undefined);
		},
	);
} else {
	describe(
		'Kapso sandbox live API',
		() => {
			it('lists conversations for the sandbox phone number', async () => {
				const credentials = loadSandboxLiveCredentials();
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

			it('lists platform messages for the sandbox phone number', async () => {
				const credentials = loadSandboxLiveCredentials();
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

			it('lists meta messages for the sandbox phone number', async () => {
				const credentials = loadSandboxLiveCredentials();
				const response = await kapsoLiveRequest(credentials, {
					api: 'whatsapp',
					method: 'GET',
					path: `/${encodeURIComponent(credentials.phoneNumberId)}/messages`,
					query: { limit: 5 },
				});

				expect(response).toHaveProperty('data');
			});

			it('rejects template list on sandbox (messaging-only number)', async () => {
				const credentials = loadSandboxLiveCredentials();
				const wabaId = await resolveLiveBusinessAccountId(credentials);

				await expect(
					kapsoLiveRequest(credentials, {
						api: 'whatsapp',
						method: 'GET',
						path: `/${encodeURIComponent(wabaId)}/message_templates`,
						query: { limit: 5 },
					}),
				).rejects.toMatchObject({
					statusCode: expect.any(Number),
				});
			});

			if (!isSandboxSendEnabled()) {
				it.skip(
					'skips sandbox send: enabled automatically in test:live:sandbox or set RUN_KAPSO_LIVE_SEND_MESSAGE=1',
					() => undefined,
				);
			} else {
				it('sends a text message to the registered sandbox session recipient', async (context) => {
					const credentials = loadSandboxLiveCredentials();

					try {
						const response = await kapsoLiveRequest(credentials, {
							api: 'whatsapp',
							method: 'POST',
							path: `/${encodeURIComponent(credentials.phoneNumberId)}/messages`,
							body: buildTextMessage(
								sandboxRecipient(),
								'Kapso n8n sandbox live test',
								false,
							),
						});

						expect(response).toHaveProperty('messages');
					} catch (error) {
						const statusCode =
							error && typeof error === 'object'
								? (error as { statusCode?: number }).statusCode
								: undefined;

						if (isSandboxSessionWindowError(error) || statusCode === 422) {
							context.skip(
								'Sandbox 24-hour session window is closed. Open WhatsApp, message the sandbox number, then rerun.',
							);
						}

						throw error;
					}
				});
			}
		},
		{ timeout: LIVE_TIMEOUT_MS },
	);
}
