import { describe, expect, it, vi } from 'vitest';
import { NodeApiError } from 'n8n-workflow';
import { kapsoApiRequest } from '../../nodes/KapsoApi/transport/request';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

describe('kapsoApiRequest', () => {
	it('builds request options from credentials and returns JSON', async () => {
		const requestMock = vi.fn().mockResolvedValue({ data: [{ id: 1 }] });
		const ef = createMockExecuteFunctions();
		ef.helpers.request = requestMock;

		const response = await kapsoApiRequest(
			ef,
			{
				api: 'platform',
				method: 'GET',
				path: '/whatsapp/phone_numbers',
				query: { page: 1 },
			},
			0,
		);

		expect(response).toEqual({ data: [{ id: 1 }] });
		expect(requestMock).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'GET',
				uri: 'https://api.kapso.ai/platform/v1/whatsapp/phone_numbers',
				headers: expect.objectContaining({
					'X-API-Key': 'test-api-key',
				}),
				qs: { page: 1 },
			}),
		);
	});

	it('wraps transport failures in NodeApiError', async () => {
		const ef = createMockExecuteFunctions();
		ef.helpers.request = vi.fn().mockRejectedValue({
			statusCode: 403,
			error: { message: 'Forbidden' },
		});

		await expect(
			kapsoApiRequest(
				ef,
				{
					api: 'platform',
					method: 'GET',
					path: '/whatsapp/phone_numbers',
				},
				0,
			),
		).rejects.toBeInstanceOf(NodeApiError);
	});
});
