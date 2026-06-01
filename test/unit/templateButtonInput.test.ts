import { describe, expect, it } from 'vitest';
import { TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY } from '../../nodes/KapsoApi/properties/templateShared.fields';
import { mergeTemplateButtonParameterGroups } from '../../nodes/KapsoApi/actions/templateButtonInput';

describe('mergeTemplateButtonParameterGroups', () => {
	it('auto-assigns button indices in unified add order when index is omitted', () => {
		expect(
			mergeTemplateButtonParameterGroups({
				[TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY]: [
					{ templateButtonKind: 'url', buttonText: 'shop' },
					{ templateButtonKind: 'quick_reply_text', buttonText: 'Yes' },
					{ templateButtonKind: 'quick_reply_payload', buttonPayload: 'TRACK' },
				],
			}),
		).toEqual([
			{
				templateButtonKind: 'url',
				buttonSubType: 'url',
				buttonIndex: 0,
				buttonText: 'shop',
			},
			{
				templateButtonKind: 'quick_reply_text',
				buttonSubType: 'quick_reply',
				buttonParameterType: 'text',
				buttonIndex: 1,
				buttonText: 'Yes',
			},
			{
				templateButtonKind: 'quick_reply_payload',
				buttonSubType: 'quick_reply',
				buttonParameterType: 'payload',
				buttonIndex: 2,
				buttonPayload: 'TRACK',
			},
		]);
	});

	it('respects manual button indices for reordering', () => {
		expect(
			mergeTemplateButtonParameterGroups({
				[TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY]: [
					{ templateButtonKind: 'url', buttonIndex: 2, buttonText: 'shop' },
					{ templateButtonKind: 'quick_reply_text', buttonIndex: 0, buttonText: 'Yes' },
				],
			}),
		).toEqual([
			{
				templateButtonKind: 'quick_reply_text',
				buttonSubType: 'quick_reply',
				buttonParameterType: 'text',
				buttonIndex: 0,
				buttonText: 'Yes',
			},
			{
				templateButtonKind: 'url',
				buttonSubType: 'url',
				buttonIndex: 2,
				buttonText: 'shop',
			},
		]);
	});

	it('returns empty array when collection is missing or empty', () => {
		expect(mergeTemplateButtonParameterGroups(undefined)).toEqual([]);
		expect(mergeTemplateButtonParameterGroups({})).toEqual([]);
		expect(
			mergeTemplateButtonParameterGroups({ [TEMPLATE_BUTTON_PARAMETER_ENTRY_KEY]: [] }),
		).toEqual([]);
	});
});
