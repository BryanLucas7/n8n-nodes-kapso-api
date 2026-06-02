import { describe, expect, it, vi } from 'vitest';
import {
	assertBroadcastDraftForRecipients,
	assertBroadcastReadyToSend,
	assertBroadcastScheduledForCancel,
	fetchBroadcastPreflight,
} from '../../nodes/KapsoApi/actions/broadcastPreflight';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

vi.mock('../../nodes/KapsoApi/transport/request', () => ({
	kapsoApiRequest: vi.fn(),
}));

import { kapsoApiRequest } from '../../nodes/KapsoApi/transport/request';

describe('broadcastPreflight', () => {
	it('loads broadcast status and recipient count', async () => {
		vi.mocked(kapsoApiRequest).mockResolvedValue({
			data: { status: 'draft', total_recipients: 3 },
		});

		await expect(
			fetchBroadcastPreflight(
				createMockExecuteFunctions({
					broadcastId: { mode: 'id', value: 'broadcast-1', __rl: true },
				}),
				'broadcast-1',
				0,
			),
		).resolves.toEqual({ status: 'draft', totalRecipients: 3 });
	});

	it('blocks send when broadcast is not draft', async () => {
		vi.mocked(kapsoApiRequest).mockResolvedValue({
			data: { status: 'scheduled', total_recipients: 2 },
		});

		await expect(
			assertBroadcastReadyToSend(
				createMockExecuteFunctions({
					broadcastId: { mode: 'id', value: 'broadcast-1', __rl: true },
				}),
				0,
			),
		).rejects.toThrow('draft status');
	});

	it('blocks add recipients when broadcast is not draft', async () => {
		vi.mocked(kapsoApiRequest).mockResolvedValue({
			data: { status: 'sent', total_recipients: 2 },
		});

		await expect(
			assertBroadcastDraftForRecipients(
				createMockExecuteFunctions({
					broadcastId: { mode: 'id', value: 'broadcast-1', __rl: true },
				}),
				0,
			),
		).rejects.toThrow('draft status');
	});

	it('blocks cancel when broadcast is not scheduled', async () => {
		vi.mocked(kapsoApiRequest).mockResolvedValue({
			data: { status: 'draft', total_recipients: 2 },
		});

		await expect(
			assertBroadcastScheduledForCancel(
				createMockExecuteFunctions({
					broadcastId: { mode: 'id', value: 'broadcast-1', __rl: true },
				}),
				0,
			),
		).rejects.toThrow('scheduled before cancel');
	});

	it('blocks send when broadcast has no recipients', async () => {
		vi.mocked(kapsoApiRequest).mockResolvedValue({
			data: { status: 'draft', total_recipients: 0 },
		});

		await expect(
			assertBroadcastReadyToSend(
				createMockExecuteFunctions({
					broadcastId: { mode: 'id', value: 'broadcast-1', __rl: true },
				}),
				0,
			),
		).rejects.toThrow('no recipients');
	});
});
