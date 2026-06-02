import { describe, expect, it, vi } from 'vitest';
import { fetchAllListData } from '../../nodes/KapsoApi/loadOptions/helpers';
import {
	searchBroadcasts,
	searchContacts,
	searchConversations,
} from '../../nodes/KapsoApi/loadOptions/listSearch';
import { getPhoneNumbers } from '../../nodes/KapsoApi/loadOptions/phoneNumbers';
import { getMessageTemplates, getBroadcastTemplates, getTemplateLanguages } from '../../nodes/KapsoApi/loadOptions/templates';
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
	it('requires credentials before loading templates', async () => {
		const context = {
			getCredentials: vi.fn().mockRejectedValue(new Error('Node does not have any credentials set')),
			getCurrentNodeParameter: vi.fn(),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
		} as never;

		await expect(getMessageTemplates.call(context)).rejects.toThrow('Node does not have any credentials set');
	});

	it('requires a phone number before loading templates', async () => {
		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn().mockReturnValue(''),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
		} as never;

		await expect(getMessageTemplates.call(context)).rejects.toThrow(
			'Select a phone number first to load options.',
		);
	});

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
     value: 'hello_world|en_US',
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

describe('loadOptions getTemplateLanguages', () => {
	it('requires a template before loading languages', async () => {
		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn((name: string) => {
				if (name === 'phoneNumberId') return '111';
				return '';
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
		} as never;

		await expect(getTemplateLanguages.call(context)).rejects.toThrow(
			'Select a template first to load options.',
		);
	});

	it('loads approved language codes for the selected template name', async () => {
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
					{ name: 'hello_world', language: 'en_US', status: 'APPROVED' },
					{ name: 'hello_world', language: 'pt_BR', status: 'APPROVED' },
					{ name: 'other_template', language: 'es', status: 'APPROVED' },
				],
			});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn((name: string) => {
				if (name === 'phoneNumberId') return '111';
				if (name === 'templateName') return 'hello_world';
				return undefined;
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: { request },
		} as never;

		expect(await getTemplateLanguages.call(context)).toEqual([
			{ name: 'en_US', value: 'en_US' },
			{ name: 'pt_BR', value: 'pt_BR' },
		]);
	});

	it('loads language codes from language_code template entries', async () => {
		const request = vi
			.fn()
			.mockResolvedValueOnce({ data: { business_account_id: 'waba-1' } })
			.mockResolvedValueOnce({
				data: [{ name: 'hello_world', language_code: 'es_ES', status: 'APPROVED' }],
			});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn((name: string) => {
				if (name === 'phoneNumberId') return '111';
				if (name === 'templateName') return 'hello_world';
				return undefined;
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: { request },
		} as never;

		expect(await getTemplateLanguages.call(context)).toEqual([{ name: 'es_ES', value: 'es_ES' }]);
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

describe('loadOptions listSearch edge cases', () => {
	it('labels conversations without phone numbers by id only', async () => {
		const request = vi.fn().mockResolvedValue({
			data: [{ id: 'conv-only' }],
			paging: { cursors: {} },
		});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn().mockReturnValue(undefined),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi', type: 'n8n-nodes-kapso-api.kapsoApi' }),
			helpers: { request },
		} as never;

		const result = await searchConversations.call(context);

		expect(result.results[0].name).toBe('conv-only');
	});

	it('labels conversations from alternate phone fields', async () => {
		const request = vi.fn().mockResolvedValue({
			data: [{ id: 'conv-3', contact_phone_number: '5511777777777', status: 'open' }],
			paging: { cursors: {} },
		});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn().mockReturnValue(undefined),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi', type: 'n8n-nodes-kapso-api.kapsoApi' }),
			helpers: { request },
		} as never;

		expect((await searchConversations.call(context)).results[0].name).toBe(
			'5511777777777 · open (conv-3)',
		);
	});

	it('paginates broadcasts with page tokens', async () => {
		const request = vi
			.fn()
			.mockResolvedValueOnce({
				data: [{ id: 'bc-1', name: 'Promo', status: 'draft' }],
				meta: { total_pages: 2 },
			})
			.mockResolvedValueOnce({
				data: [{ id: 'bc-2', name: 'Promo 2', status: 'sent' }],
				meta: { total_pages: 2 },
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

		const firstPage = await searchBroadcasts.call(context);
		const secondPage = await searchBroadcasts.call(context, undefined, firstPage.paginationToken);

		expect(firstPage.results).toHaveLength(1);
		expect(secondPage.results[0].value).toBe('bc-2');
	});

	it('labels contacts without phone numbers and filters broadcasts locally', async () => {
		const contactRequest = vi.fn().mockResolvedValue({
			data: [{ uuid: 'c-1', full_name: 'Alice' }],
			paging: { cursors: {} },
		});

		const contactContext = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn(),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi', type: 'n8n-nodes-kapso-api.kapsoApi' }),
			helpers: { request: contactRequest },
		} as never;

		expect((await searchContacts.call(contactContext)).results[0].name).toBe('Alice (c-1)');

		const waIdRequest = vi.fn().mockResolvedValue({
			data: [{ contact_id: 'c-9', full_name: 'Bob', wa_id: '5511222333444' }],
			paging: { cursors: {} },
		});
		const waIdContext = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn(),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi', type: 'n8n-nodes-kapso-api.kapsoApi' }),
			helpers: { request: waIdRequest },
		} as never;

		expect((await searchContacts.call(waIdContext)).results[0].name).toBe('Bob · 5511222333444 (c-9)');

		const broadcastContext = createLoadOptionsContext({
			data: [
				{ id: 'bc-1', title: 'Launch', status: 'draft' },
				{ id: 'bc-2', title: 'Other', status: 'sent' },
			],
			meta: { page: 1, total_pages: 1 },
		});

		expect((await searchBroadcasts.call(broadcastContext, 'launch')).results).toHaveLength(1);
	});

	it('searches conversations by phone-like filters through the API', async () => {
		const request = vi.fn().mockResolvedValue({
			data: [{ id: 'conv-5', phone_number: '5511999999999' }],
			paging: { cursors: {} },
		});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn().mockReturnValue(undefined),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi', type: 'n8n-nodes-kapso-api.kapsoApi' }),
			helpers: { request },
		} as never;

		await searchConversations.call(context, '+55 11 99999-9999');

		expect(request).toHaveBeenCalledWith(
			expect.objectContaining({
				qs: expect.objectContaining({
					phone_number: '5511999999999',
				}),
			}),
		);
	});

	it('paginates broadcasts with invalid page tokens from the first page', async () => {
		const request = vi.fn().mockResolvedValue({
			data: [{ id: 'bc-1', name: 'Promo', status: 'draft' }],
			meta: { total_pages: 1 },
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

		const result = await searchBroadcasts.call(context, undefined, 'not-a-page');

		expect(result.results).toHaveLength(1);
		expect(request).toHaveBeenCalledWith(
			expect.objectContaining({
				qs: expect.objectContaining({ page: 1 }),
			}),
		);
	});
});

describe('loadOptions templates edge cases', () => {
	it('returns no templates when WABA id cannot be resolved', async () => {
		const request = vi.fn().mockResolvedValueOnce({ data: { phone_number_id: '111' } });
		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn((name: string) => (name === 'phoneNumberId' ? '111' : undefined)),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: { request },
		} as never;

		expect(await getMessageTemplates.call(context)).toEqual([]);
	});

	it('builds broadcast template labels without meta ids', async () => {
		const request = vi
			.fn()
			.mockResolvedValueOnce({ data: { business_account_id: 'waba-1' } })
			.mockResolvedValueOnce({
				data: [{ name: 'weekend_sale', language: 'en_US', status: 'APPROVED' }],
			});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn((name: string) =>
				name === 'broadcastPhoneNumberId' ? '111' : undefined,
			),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: { request },
		} as never;

		expect(await getBroadcastTemplates.call(context)).toEqual([]);
	});

	it('builds broadcast template labels with meta template ids', async () => {
		const request = vi
			.fn()
			.mockResolvedValueOnce({ data: { business_account_id: 'waba-1' } })
			.mockResolvedValueOnce({
				data: [{ id: '784203120908608', meta_template_id: 'meta-99', name: 'weekend_sale', language: 'en_US', status: 'APPROVED' }],
			});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn((name: string) =>
				name === 'broadcastPhoneNumberId' ? '111' : undefined,
			),
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

	it('labels phone numbers from alternate payload keys', async () => {
		const context = createLoadOptionsContext({
			data: [
				{
					id: '222',
					display_phone_number: '+15551234567',
					kind: 'production',
				},
				{
					phone_number_id: '333',
					phone_number: '+15559876543',
				},
				{
					id: '444',
					display_name: 'Support line',
				},
			],
			meta: { page: 1, total_pages: 1 },
		});

		expect(await getPhoneNumbers.call(context)).toEqual([
			{
				name: '+15551234567 · production (222)',
				value: '222',
			},
			{
				name: '+15559876543 (333)',
				value: '333',
			},
			{
				name: 'Support line (444)',
				value: '444',
			},
		]);
	});
});
