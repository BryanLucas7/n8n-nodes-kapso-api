import { describe, expect, it, vi } from 'vitest';
import { fetchAllListData } from '../../nodes/KapsoApi/loadOptions/helpers';
import {
	searchBroadcasts,
	searchContacts,
	searchConversations,
} from '../../nodes/KapsoApi/loadOptions/listSearch';
import { getPhoneNumbers } from '../../nodes/KapsoApi/loadOptions/phoneNumbers';
import { getMessageTemplates, getBroadcastTemplates } from '../../nodes/KapsoApi/loadOptions/templates';
import { TEST_PHONE_NUMBER_ID } from '../helpers/kapsoCredentials';

function createLoadOptionsContext(
	response: unknown,
	parameters: Record<string, unknown> = {},
) {
	return {
		getCredentials: vi.fn().mockResolvedValue({
			baseUrl: 'https://api.kapso.ai',
			apiKey: 'test-key',
		}),
		getCurrentNodeParameter: vi.fn((name: string) => parameters[name]),
		getNode: vi.fn().mockReturnValue({ name: 'kapsoApi', type: 'n8n-nodes-kapso-api.kapsoApi' }),
		helpers: {
			request: vi.fn().mockResolvedValue(response),
		},
	} as never;
}

describe('loadOptions getPhoneNumbers', () => {
	it('maps phone numbers to dropdown options', async () => {
		const context = createLoadOptionsContext({
			data: [
				{
					phone_number_id: TEST_PHONE_NUMBER_ID,
					display_name: 'Sandbox',
					kind: 'sandbox',
				},
			],
			meta: { page: 1, total_pages: 1 },
		});

		expect(await getPhoneNumbers.call(context)).toEqual([
			{
				name: `Sandbox · sandbox (${TEST_PHONE_NUMBER_ID})`,
				value: TEST_PHONE_NUMBER_ID,
			},
		]);
	});
});

describe('loadOptions getMessageTemplates', () => {
	it('loads approved template names from the selected phone number WABA', async () => {
		const request = vi
			.fn()
			.mockResolvedValueOnce({
				data: {
					phone_number_id: '111',
					business_account_id: 'waba-1',
				},
			})
			.mockResolvedValueOnce({
				data: [
					{
						id: 'tpl-1',
						name: 'hello_world',
						language: 'en_US',
						status: 'APPROVED',
					},
				],
			});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn((name: string) => {
				if (name === 'phoneNumberId') return '111';
				return undefined;
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: { request },
		} as never;

		expect(await getMessageTemplates.call(context)).toEqual([
			{
				name: 'hello_world · en_US · APPROVED',
				value: 'hello_world',
			},
		]);
	});
});

describe('loadOptions getBroadcastTemplates', () => {
	it('loads approved template Meta IDs from the selected broadcast phone number', async () => {
		const request = vi
			.fn()
			.mockResolvedValueOnce({
				data: {
					phone_number_id: '111',
					business_account_id: 'waba-1',
				},
			})
			.mockResolvedValueOnce({
				data: [
					{
						id: '784203120908608',
						name: 'weekend_sale',
						language: 'en_US',
						status: 'APPROVED',
					},
				],
			});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn((name: string) => {
				if (name === 'broadcastPhoneNumberId') return '111';
				return undefined;
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: { request },
		} as never;

		expect(await getBroadcastTemplates.call(context)).toEqual([
			{
				name: 'weekend_sale · en_US · APPROVED (784203120908608)',
				value: '784203120908608',
			},
		]);
	});
});

describe('listSearch', () => {
	it('returns conversations with cursor pagination', async () => {
		const request = vi.fn().mockResolvedValue({
			data: [
				{ id: 'conv-1', phone_number: '5511999999999', status: 'open' },
				{ id: 'conv-2', phone_number: '5511888888888', status: 'closed' },
			],
			paging: { cursors: { after: 'cursor-page-2' } },
		});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn((name: string) => (name === 'phoneNumberId' ? '111' : undefined)),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi', type: 'n8n-nodes-kapso-api.kapsoApi' }),
			helpers: { request },
		} as never;

		const result = await searchConversations.call(context);

		expect(result.results).toHaveLength(2);
		expect(result.results[0].value).toBe('conv-1');
		expect(result.paginationToken).toBe('cursor-page-2');
		expect(request).toHaveBeenCalledWith(
			expect.objectContaining({
				qs: expect.objectContaining({
					limit: 5,
					phone_number_id: '111',
				}),
			}),
		);
	});

	it('searches contacts through the API profile filter', async () => {
		const request = vi.fn().mockResolvedValue({
			data: [{ id: 'c-1', name: 'Alice', phone_number: '551111' }],
			paging: { cursors: {} },
		});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn(),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi', type: 'n8n-nodes-kapso-api.kapsoApi' }),
			helpers: { request },
		} as never;

		const result = await searchContacts.call(context, 'alice');

		expect(result.results).toEqual([
			{
				name: 'Alice · 551111 (c-1)',
				value: 'c-1',
			},
		]);
		expect(request).toHaveBeenCalledWith(
			expect.objectContaining({
				qs: expect.objectContaining({
					limit: 5,
					profile_name_contains: 'alice',
				}),
			}),
		);
	});

	it('searches contacts by phone digits via wa_id_contains', async () => {
		const request = vi.fn().mockResolvedValue({
			data: [{ id: 'c-2', name: 'Bob', phone_number: '5511999999999' }],
			paging: { cursors: {} },
		});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn(),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi', type: 'n8n-nodes-kapso-api.kapsoApi' }),
			helpers: { request },
		} as never;

		await searchContacts.call(context, '5511999999999');

		expect(request).toHaveBeenCalledWith(
			expect.objectContaining({
				qs: expect.objectContaining({
					wa_id_contains: '5511999999999',
				}),
			}),
		);
	});

	it('omits contacts without a platform id from locator results', async () => {
		const request = vi.fn().mockResolvedValue({
			data: [{ name: 'No Id', phone_number: '551111' }],
			paging: { cursors: {} },
		});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn(),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi', type: 'n8n-nodes-kapso-api.kapsoApi' }),
			helpers: { request },
		} as never;

		const result = await searchContacts.call(context);

		expect(result.results).toEqual([]);
	});

	it('searches broadcasts without requiring a phone number', async () => {
		const context = createLoadOptionsContext({
			data: [{ id: 'bc-1', name: 'Promo', status: 'draft' }],
			meta: { page: 1, total_pages: 1 },
		});

		const result = await searchBroadcasts.call(context);

		expect(result.results).toEqual([
			{
				name: 'Promo · draft (bc-1)',
				value: 'bc-1',
			},
		]);
	});
});

describe('loadOptions pagination', () => {
	it('paginates through all phone number pages', async () => {
		const request = vi
			.fn()
			.mockResolvedValueOnce({
				data: [{ phone_number_id: '111', display_name: 'First page' }],
				meta: { page: 1, total_pages: 2 },
			})
			.mockResolvedValueOnce({
				data: [{ phone_number_id: '222', display_name: 'Second page' }],
				meta: { page: 2, total_pages: 2 },
			});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: { request },
		} as never;

		const entries = await fetchAllListData(context, {
			api: 'platform',
			method: 'GET',
			path: '/whatsapp/phone_numbers',
		});

		expect(entries).toHaveLength(2);
		expect(request).toHaveBeenCalledTimes(2);
	});
});
