import { describe, expect, it, vi } from 'vitest';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';
import {
	assertKapsoLoadOptionsReady,
	businessAccountIdFromEntry,
	extractResponseData,
	fetchAllListData,
	fetchListPage,
	kapsoLoadOptionsRequest,
	requireLoadOptionsDependency,
	resolveBusinessAccountId,
	templateLabel,
	toOptions,
} from '../../nodes/KapsoApi/loadOptions/helpers';

describe('loadOptions helpers', () => {
	it('extracts list data from Kapso and raw array responses', () => {
		expect(extractResponseData({ data: [{ id: '1' }] })).toEqual([{ id: '1' }]);
		expect(extractResponseData([{ id: '2' }])).toEqual([{ id: '2' }]);
		expect(extractResponseData(null)).toEqual([]);
		expect(extractResponseData({ items: [] })).toEqual([]);
	});

	it('maps business account ids from alternate phone number payload keys', () => {
		expect(businessAccountIdFromEntry({ business_account_id: 'ba-1' })).toBe('ba-1');
		expect(businessAccountIdFromEntry({ waba_id: 'waba-1' })).toBe('waba-1');
		expect(
			businessAccountIdFromEntry({
				whatsapp_business_account_id: 'waba-99',
			}),
		).toBe('waba-99');
		expect(businessAccountIdFromEntry({ businessAccountId: 'biz-2' })).toBe('biz-2');
	});

	it('builds template labels and skips empty option values', () => {
		expect(
			templateLabel({
				name: 'hello_world',
				language: 'en_US',
				status: 'APPROVED',
			}),
		).toBe('hello_world · en_US · APPROVED');

		expect(
			toOptions(
				[{ name: 'ok' }, { name: 'skip-me' }],
				(entry) => String(entry.name),
				(entry) => (entry.name === 'ok' ? String(entry.name) : ''),
			),
		).toEqual([{ name: 'ok', value: 'ok' }]);
	});

	it('builds template labels from alternate language and status keys', () => {
		expect(
			templateLabel({
				language_code: 'pt_BR',
			}),
		).toBe('Template · pt_BR · APPROVED');

		expect(templateLabel({ name: 'promo', status: 'PENDING' })).toBe('promo ·  · PENDING');
	});

	it('requires load option dependencies with warning-level errors', () => {
		const node = { name: 'kapsoApi' };
		const context = {
			getNode: () => node,
			getCurrentNodeParameter: vi.fn().mockReturnValue(''),
		} as never;

		expect(() => requireLoadOptionsDependency(context, 'templateName', 'a template')).toThrow(
			NodeOperationError,
		);
		expect(() => requireLoadOptionsDependency(context, 'templateName', 'a template')).toThrow(
			'Select a template first to load options.',
		);
	});

	it('normalizes non-string dependency values', () => {
		const context = {
			getNode: () => ({ name: 'kapsoApi' }),
			getCurrentNodeParameter: vi.fn().mockReturnValue(12345),
		} as never;

		expect(requireLoadOptionsDependency(context, 'phoneNumberId', 'a phone number')).toBe('12345');
	});

	it('treats falsy non-string dependency values as missing', () => {
		const context = {
			getNode: () => ({ name: 'kapsoApi' }),
			getCurrentNodeParameter: vi.fn().mockReturnValue(false),
		} as never;

		expect(() => requireLoadOptionsDependency(context, 'phoneNumberId', 'a phone number')).toThrow(
			'Select a phone number first to load options.',
		);
	});

	it('wraps load option request failures as NodeApiError', async () => {
		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: {
				request: vi.fn().mockRejectedValue({
					statusCode: 401,
					message: 'Invalid API key',
				}),
			},
		} as never;

		await expect(
			kapsoLoadOptionsRequest(context, {
				api: 'platform',
				method: 'GET',
				path: '/whatsapp/phone_numbers',
			}),
		).rejects.toBeInstanceOf(NodeApiError);
	});

	it('fetches paginated list pages and all list data until total pages are exhausted', async () => {
		const listPageContext = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: {
				request: vi.fn().mockResolvedValueOnce({
					data: [{ id: 'page-1' }],
					meta: { total_pages: 2 },
				}),
			},
		} as never;

		await expect(
			fetchListPage(
				listPageContext,
				{ api: 'platform', method: 'GET', path: '/whatsapp/phone_numbers' },
				2,
				50,
			),
		).resolves.toEqual([{ id: 'page-1' }]);

		const allPagesContext = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: {
				request: vi
					.fn()
					.mockResolvedValueOnce({ data: [{ id: 'page-1' }], meta: { total_pages: 2 } })
					.mockResolvedValueOnce({ data: [{ id: 'page-2' }], meta: { total_pages: 2 } }),
			},
		} as never;

		await expect(
			fetchAllListData(allPagesContext, {
				api: 'platform',
				method: 'GET',
				path: '/whatsapp/phone_numbers',
			}),
		).resolves.toEqual([{ id: 'page-1' }, { id: 'page-2' }]);
	});

	it('returns no business account id when phone number is missing', async () => {
		const context = {
			getCurrentNodeParameter: vi.fn().mockReturnValue(undefined),
		} as never;

		await expect(resolveBusinessAccountId(context)).resolves.toBeUndefined();
	});

	it('resolves business account id from wrapped and direct phone payloads', async () => {
		const request = vi
			.fn()
			.mockResolvedValueOnce({ business_account_id: 'ba-direct' })
			.mockResolvedValueOnce({ data: { business_account_id: 'ba-wrapped' } })
			.mockResolvedValueOnce({ whatsapp_business_account_id: 'waba-alt' })
			.mockResolvedValueOnce({ waba_id: 'waba-id-only' });

		const context = {
			getCurrentNodeParameter: vi.fn().mockReturnValue('111'),
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: { request },
		} as never;

		await expect(resolveBusinessAccountId(context)).resolves.toBe('ba-direct');
		await expect(resolveBusinessAccountId(context)).resolves.toBe('ba-wrapped');
		await expect(resolveBusinessAccountId(context)).resolves.toBe('waba-alt');
		await expect(resolveBusinessAccountId(context)).resolves.toBe('waba-id-only');
	});

	it('asserts credentials before load options run', async () => {
		const context = {
			getCredentials: vi.fn().mockRejectedValue(new Error('Node does not have any credentials set')),
		} as never;

		await expect(assertKapsoLoadOptionsReady(context)).rejects.toThrow(
			'Node does not have any credentials set',
		);
	});
});
