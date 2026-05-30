import { describe, expect, it } from 'vitest';
import { buildTextMessage } from '../../nodes/KapsoApi/actions/messagePayloads';
import { buildKapsoRequestOptions } from '../../nodes/KapsoApi/transport/request';
import { loadLiveCredentials } from '../helpers/kapsoCredentials';
import { requestWithNodeHttps } from '../helpers/http';

const runLiveTests = process.env.RUN_KAPSO_LIVE_TESTS === '1';

if (!runLiveTests) {
	describe.skip(
		'Kapso live tests skipped: set RUN_KAPSO_LIVE_TESTS=1, KAPSO_API_KEY, and KAPSO_PHONE_NUMBER_ID',
		() => {
			it('skips live requests without explicit environment configuration', () => undefined);
		},
	);
} else {
	describe('Kapso live API', () => {
		it('lists phone numbers and includes the configured number', async () => {
			const credentials = loadLiveCredentials();
			const response = (await requestWithNodeHttps(
				buildKapsoRequestOptions(
					{ baseUrl: credentials.baseUrl, apiKey: credentials.apiKey },
					{
						api: 'platform',
						method: 'GET',
						path: '/whatsapp/phone_numbers',
						query: { per_page: 50 },
					},
				),
			)) as { data?: Array<{ phone_number_id?: string; kind?: string }> };

			const numbers = response.data ?? [];
			const configuredNumber = numbers.find(
				(entry) => entry.phone_number_id === credentials.phoneNumberId,
			);

			expect(configuredNumber).toBeDefined();
		});

		it('gets configured phone number detail', async () => {
			const credentials = loadLiveCredentials();
			const response = await requestWithNodeHttps(
				buildKapsoRequestOptions(
					{ baseUrl: credentials.baseUrl, apiKey: credentials.apiKey },
					{
						api: 'platform',
						method: 'GET',
						path: `/whatsapp/phone_numbers/${encodeURIComponent(credentials.phoneNumberId)}`,
					},
				),
			);

			expect(response).toHaveProperty('data');
		});

		it('lists api logs (read-only)', async () => {
			const credentials = loadLiveCredentials();
			const response = await requestWithNodeHttps(
				buildKapsoRequestOptions(
					{ baseUrl: credentials.baseUrl, apiKey: credentials.apiKey },
					{
						api: 'platform',
						method: 'GET',
						path: '/api_logs',
						query: { per_page: 5 },
					},
				),
			);

			expect(response).toHaveProperty('data');
		});

		const canSendMessage =
			process.env.RUN_KAPSO_LIVE_SEND_MESSAGE === '1' &&
			Boolean(process.env.KAPSO_TEST_RECIPIENT);

		if (!canSendMessage) {
			it.skip(
				'skips real message send: set RUN_KAPSO_LIVE_SEND_MESSAGE=1 and KAPSO_TEST_RECIPIENT',
				() => undefined,
			);
		} else {
			it('sends a real opt-in text message', async () => {
				const credentials = loadLiveCredentials();
				const response = await requestWithNodeHttps(
					buildKapsoRequestOptions(
						{ baseUrl: credentials.baseUrl, apiKey: credentials.apiKey },
						{
							api: 'whatsapp',
							method: 'POST',
							path: `/${encodeURIComponent(credentials.phoneNumberId)}/messages`,
							body: buildTextMessage(
								process.env.KAPSO_TEST_RECIPIENT as string,
								'Kapso n8n live test',
								false,
							),
						},
					),
				);

				expect(response).toHaveProperty('messages');
			});
		}
	});
}
