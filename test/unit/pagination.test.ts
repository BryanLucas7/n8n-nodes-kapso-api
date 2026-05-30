import { beforeEach, describe, expect, it, vi } from 'vitest';
import { requestPaginated } from '../../nodes/KapsoApi/transport/pagination';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

const kapsoApiRequestMock = vi.fn();

vi.mock('../../nodes/KapsoApi/transport/request', () => ({
	kapsoApiRequest: (...args: unknown[]) => kapsoApiRequestMock(...args),
}));

describe('requestPaginated', () => {
	beforeEach(() => {
		kapsoApiRequestMock.mockReset();
	});

	it('delegates to kapsoApiRequest when returnAll is false', async () => {
		const ef = createMockExecuteFunctions();
		const response = { data: [{ id: 1 }], meta: { page: 1, total_pages: 1 } };
		kapsoApiRequestMock.mockResolvedValue(response);

		const result = await requestPaginated(
			ef,
			{
				api: 'platform',
				method: 'GET',
				path: '/whatsapp/phone_numbers',
				query: { page: 1, per_page: 20 },
			},
			false,
			20,
			0,
		);

		expect(result).toEqual(response);
		expect(kapsoApiRequestMock).toHaveBeenCalledTimes(1);
	});

	it('aggregates all pages when returnAll is true', async () => {
		const ef = createMockExecuteFunctions();
		kapsoApiRequestMock
			.mockResolvedValueOnce({
				data: [{ id: 1 }],
				meta: { page: 1, total_pages: 2 },
			})
			.mockResolvedValueOnce({
				data: [{ id: 2 }],
				meta: { page: 2, total_pages: 2 },
			});

		const result = (await requestPaginated(
			ef,
			{
				api: 'platform',
				method: 'GET',
				path: '/whatsapp/phone_numbers',
				query: { status: 'connected' },
			},
			true,
			20,
			0,
		)) as { data: Array<{ id: number }>; meta: { returned: number; paginated: boolean } };

		expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
		expect(result.meta).toEqual({ returned: 2, paginated: true });
		expect(kapsoApiRequestMock).toHaveBeenCalledTimes(2);
	});
});
