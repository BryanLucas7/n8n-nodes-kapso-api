import { describe, expect, it, vi } from 'vitest';
import { searchWhatsappFlows } from '../../nodes/KapsoApi/loadOptions/flowSearch';
import { createLoadOptionsContext } from '../fixtures/loadOptionsContext';

vi.mock('../../nodes/KapsoApi/loadOptions/helpers', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../../nodes/KapsoApi/loadOptions/helpers')>();
	return {
		...actual,
		kapsoLoadOptionsRequest: vi.fn(),
	};
});

vi.mock('../../nodes/KapsoApi/loadOptions/flowAssets', () => ({
	fetchFlowVersionDetail: vi.fn(async () => ({
		defaultScreen: 'WELCOME',
		singleScreen: true,
		flowsEncryptionConfigured: true,
		previewUrl: undefined,
		jsonVersion: '7.2',
		hasDataEndpoint: false,
	})),
	resolvePreferredFlowStatus: vi.fn(() => 'published'),
}));

import { kapsoLoadOptionsRequest } from '../../nodes/KapsoApi/loadOptions/helpers';

describe('searchWhatsappFlows', () => {
	it('finds a meta flow id on a later page', async () => {
		vi.mocked(kapsoLoadOptionsRequest)
			.mockResolvedValueOnce({
				data: [{ id: 'kapso-1', meta_flow_id: '1111111111', name: 'Other', status: 'published' }],
				meta: { total_pages: 2 },
			})
			.mockResolvedValueOnce({
				data: [{ id: 'kapso-2', meta_flow_id: '2222222222', name: 'Target', status: 'published' }],
				meta: { total_pages: 2 },
			});

		const context = createLoadOptionsContext({
			phoneNumberId: '100000000000000',
			flowMode: '',
		});

		const result = await searchWhatsappFlows.call(context, '2222222222');

		expect(result.results).toHaveLength(1);
		expect(result.results[0]?.name).toContain('Target');
		expect(String(result.results[0]?.value)).toContain('2222222222');
	});
});
