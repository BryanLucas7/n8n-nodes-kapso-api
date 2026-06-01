import { describe, expect, it, vi } from 'vitest';
import { NodeApiError } from 'n8n-workflow';
import { getPhoneNumbers } from '../../nodes/KapsoApi/loadOptions/phoneNumbers';

describe('getPhoneNumbers', () => {
	it('maps fallback phone labels and skips entries without ids', async () => {
		const request = vi
			.fn()
			.mockResolvedValueOnce({
				data: [
					{
						phone_number: '+15551234567',
						id: 'phone-1',
					},
					{
						display_phone_number: '+15559876543',
						phone_number_id: 'phone-2',
						kind: 'sandbox',
					},
					{
						display_name: 'Support',
					},
				],
				meta: { total_pages: 1 },
			});

		const context = {
			getCredentials: vi.fn().mockResolvedValue({
				baseUrl: 'https://api.kapso.ai',
				apiKey: 'test-key',
			}),
			getCurrentNodeParameter: vi.fn(),
			getNode: vi.fn().mockReturnValue({ name: 'kapsoApi' }),
			helpers: { request },
		} as never;

		expect(await getPhoneNumbers.call(context)).toEqual([
			{ name: '+15551234567 (phone-1)', value: 'phone-1' },
			{ name: '+15559876543 · sandbox (phone-2)', value: 'phone-2' },
		]);
	});
});
