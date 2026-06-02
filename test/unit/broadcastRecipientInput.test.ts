import { describe, expect, it, vi } from 'vitest';
import { buildBroadcastRecipientsFromInputItems } from '../../nodes/KapsoApi/actions/broadcastRecipientInput';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

const emptyTemplateDefinition = {
	name: 'plain',
	language: 'en_US',
	parameterFormat: 'named',
	componentMode: 'standard',
	headerFormat: 'none',
	headerTextHasVariable: false,
	bodyVariables: [],
	buttonSlots: [],
	carouselCards: [],
};

vi.mock('../../nodes/KapsoApi/loadOptions/broadcastTemplateFetch', () => ({
	loadBroadcastTemplateDefinition: vi.fn(async () => emptyTemplateDefinition),
}));

describe('buildBroadcastRecipientsFromInputItems', () => {
	it('returns a single recipient from the matching input item index', async () => {
		const ef = createMockExecuteFunctions(
			{
				broadcastRecipientPhoneField: 'phone',
			},
			{
				items: [
					{ json: { phone: '+15551111111', first_name: 'Ada' } },
					{ json: { phone: '+15552222222', first_name: 'Grace' } },
				],
				itemIndex: 0,
			},
		);

		const entries = await buildBroadcastRecipientsFromInputItems(ef, 0);

		expect(entries).toHaveLength(1);
		expect(entries[0].phoneNumber).toBe('+15551111111');
	});
});
