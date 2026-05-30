import { describe, expect, it, vi } from 'vitest';
import {
	businessAccountIdFromEntry,
	extractResponseData,
	resolveBusinessAccountId,
	templateLabel,
	toOptions,
} from '../../nodes/KapsoApi/loadOptions/helpers';

describe('loadOptions helpers', () => {
	it('extracts list data from Kapso and raw array responses', () => {
		expect(extractResponseData({ data: [{ id: '1' }] })).toEqual([{ id: '1' }]);
		expect(extractResponseData([{ id: '2' }])).toEqual([{ id: '2' }]);
		expect(extractResponseData(null)).toEqual([]);
	});

	it('maps business account ids from phone number payloads', () => {
		expect(
			businessAccountIdFromEntry({
				whatsapp_business_account_id: 'waba-99',
			}),
		).toBe('waba-99');
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

	it('returns no templates when phone number is missing', async () => {
		const context = {
			getCurrentNodeParameter: vi.fn().mockReturnValue(undefined),
		} as never;

		await expect(resolveBusinessAccountId(context)).resolves.toBeUndefined();
	});
});
