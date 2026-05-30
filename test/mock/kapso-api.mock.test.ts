import nock from 'nock';
import { afterEach, describe, expect, it } from 'vitest';
import { buildTextMessage } from '../../nodes/KapsoApi/actions/messagePayloads';
import { buildKapsoRequestOptions } from '../../nodes/KapsoApi/transport/request';
import { requestWithNodeHttps } from '../helpers/http';

const credentials = {
	baseUrl: 'https://api.kapso.ai',
	apiKey: 'mock-api-key',
};

describe('Kapso mock API integration', () => {
	afterEach(() => {
		nock.cleanAll();
	});

	it('lists phone numbers with X-API-Key and pagination query', async () => {
		const scope = nock('https://api.kapso.ai', {
			reqheaders: {
				'X-API-Key': 'mock-api-key',
			},
		})
			.get('/platform/v1/whatsapp/phone_numbers')
			.query({
				page: '1',
				per_page: '20',
			})
			.reply(200, {
				data: [
					{
						phone_number_id: '1234567890',
						display_name: 'Support',
					},
				],
				meta: {
					page: 1,
					per_page: 20,
					total_pages: 1,
					total_count: 1,
				},
			});

		const response = await requestWithNodeHttps(
			buildKapsoRequestOptions(credentials, {
				api: 'platform',
				method: 'GET',
				path: '/whatsapp/phone_numbers',
				query: {
					page: 1,
					per_page: 20,
				},
			}),
		);

		expect(response).toEqual({
			data: [
				{
					phone_number_id: '1234567890',
					display_name: 'Support',
				},
			],
			meta: {
				page: 1,
				per_page: 20,
				total_pages: 1,
				total_count: 1,
			},
		});
		expect(scope.isDone()).toBe(true);
	});

	it('lists webhooks, conversations, flows, and broadcasts', async () => {
		const listCases = [
			{
				path: '/whatsapp/webhooks',
				payload: { data: [{ id: 'wh-1' }], meta: { page: 1, total_pages: 1 } },
			},
			{
				path: '/whatsapp/conversations',
				payload: { data: [{ id: 'conv-1' }], meta: { page: 1, total_pages: 1 } },
			},
			{
				path: '/whatsapp/flows',
				payload: { data: [{ id: 'flow-1' }], meta: { page: 1, total_pages: 1 } },
			},
			{
				path: '/whatsapp/broadcasts',
				payload: { data: [{ id: 'bc-1' }], meta: { page: 1, total_pages: 1 } },
			},
		];

		for (const listCase of listCases) {
			const scope = nock('https://api.kapso.ai')
				.get(`/platform/v1${listCase.path}`)
				.query({ page: '1', per_page: '20' })
				.reply(200, listCase.payload);

			const response = await requestWithNodeHttps(
				buildKapsoRequestOptions(credentials, {
					api: 'platform',
					method: 'GET',
					path: listCase.path,
					query: { page: 1, per_page: 20 },
				}),
			);

			expect(response).toEqual(listCase.payload);
			expect(scope.isDone()).toBe(true);
		}
	});

	it('sends a Meta-compatible text message', async () => {
		const body = buildTextMessage('15551234567', 'Hello from n8n', false);
		const scope = nock('https://api.kapso.ai', {
			reqheaders: {
				'X-API-Key': 'mock-api-key',
				'Content-Type': 'application/json',
			},
		})
			.post('/meta/whatsapp/v24.0/123/messages', body)
			.reply(200, {
				messaging_product: 'whatsapp',
				messages: [
					{
						id: 'wamid.mock',
					},
				],
			});

		const response = await requestWithNodeHttps(
			buildKapsoRequestOptions(credentials, {
				api: 'whatsapp',
				method: 'POST',
				path: '/123/messages',
				body,
			}),
		);

		expect(response).toEqual({
			messaging_product: 'whatsapp',
			messages: [
				{
					id: 'wamid.mock',
				},
			],
		});
		expect(scope.isDone()).toBe(true);
	});

	it.each([
		[403, 'Forbidden'],
		[404, 'Not found'],
		[429, 'Rate limited'],
	])('surfaces HTTP %s errors for callers to normalize', async (statusCode, message) => {
		nock('https://api.kapso.ai')
			.get('/platform/v1/whatsapp/phone_numbers')
			.reply(statusCode, { message });

		await expect(
			requestWithNodeHttps(
				buildKapsoRequestOptions(credentials, {
					api: 'platform',
					method: 'GET',
					path: '/whatsapp/phone_numbers',
				}),
			),
		).rejects.toMatchObject({
			statusCode,
			error: { message },
		});
	});

	it('surfaces authenticated API errors for callers to normalize', async () => {
		nock('https://api.kapso.ai')
			.get('/platform/v1/whatsapp/phone_numbers')
			.reply(401, {
				message: 'Invalid API key',
			});

		await expect(
			requestWithNodeHttps(
				buildKapsoRequestOptions(credentials, {
					api: 'platform',
					method: 'GET',
					path: '/whatsapp/phone_numbers',
				}),
			),
		).rejects.toMatchObject({
			statusCode: 401,
			error: {
				message: 'Invalid API key',
			},
		});
	});
});
