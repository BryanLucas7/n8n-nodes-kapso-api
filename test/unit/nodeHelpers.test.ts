import { describe, expect, it } from 'vitest';
import {
	asJsonItems,
	advancedBodyJson,
	bodyJson,
	getBoolean,
	getFixedCollectionItems,
	getNumber,
	getReplyToMessageId,
	getResourceParameter,
	getString,
	itemPair,
	queryJson,
} from '../../nodes/KapsoApi/actions/nodeHelpers';
import { createMockExecuteFunctions } from '../helpers/mockExecuteFunctions';

describe('nodeHelpers', () => {
	it('reads typed node parameters', () => {
		const ef = createMockExecuteFunctions({
			textBody: 'hello',
			page: 3,
		});

		expect(getString(ef, 'textBody', 0)).toBe('hello');
		expect(getNumber(ef, 'page', 0, 1)).toBe(3);
	});

	it('extracts resource locator values', () => {
		const ef = createMockExecuteFunctions({
			conversationId: { mode: 'list', value: 'conv-rlc' },
		});

		expect(getResourceParameter(ef, 'conversationId', 0)).toBe('conv-rlc');
		expect(getString(ef, 'conversationId', 0)).toBe('conv-rlc');
	});

	it('reads fixed collection items', () => {
		const ef = createMockExecuteFunctions();

		expect(
			getFixedCollectionItems(ef, 'buttons', 'buttonValues', 0),
		).toEqual([{ buttonId: 'btn_yes', buttonTitle: 'Yes' }]);
	});

	it('parses advanced query and body JSON parameters', () => {
		const ef = createMockExecuteFunctions({
			advancedOptions: {
				queryJson: '{"page":2,"status":"open"}',
				bodyJson: '{"type":"text","text":{"body":"Hi"}}',
				replyToMessageId: 'wamid.parent',
				linkPreview: true,
			},
		});

		expect(queryJson(ef, 0)).toEqual({ page: 2, status: 'open' });
		expect(advancedBodyJson(ef, 0)).toEqual({
			type: 'text',
			text: { body: 'Hi' },
		});
		expect(getReplyToMessageId(ef, 0)).toBe('wamid.parent');
		expect(getBoolean(ef, 'typingIndicator', 0)).toBe(false);
	});

	it('supports legacy nested advanced options shape', () => {
		const ef = createMockExecuteFunctions({
			advancedOptions: {
				options: [
					{
						replyToMessageId: 'wamid.legacy',
						linkPreview: false,
					},
				],
			},
		});

		expect(getReplyToMessageId(ef, 0)).toBe('wamid.legacy');
	});

	it('parses top-level body JSON for admin operations', () => {
		const ef = createMockExecuteFunctions({
			bodyJson: '{"name":"Kapso"}',
		});

		expect(bodyJson(ef, 0)).toEqual({ name: 'Kapso' });
	});

	it('rejects invalid advanced query JSON', () => {
		const ef = createMockExecuteFunctions({
			advancedOptions: {
				options: [{ queryJson: 'not-json' }],
			},
		});

		expect(() => queryJson(ef, 0)).toThrow(/Additional Query Parameters must be valid JSON object syntax/);
	});

	it('maps array and object responses to n8n items', () => {
		expect(itemPair(2)).toEqual({ item: 2 });

		const arrayItems = asJsonItems([{ id: 1 }, { id: 2 }], 0);
		expect(arrayItems).toHaveLength(2);
		expect(arrayItems[0]).toEqual({
			json: { id: 1 },
			pairedItem: { item: 0 },
		});

		const scalarItems = asJsonItems('ok', 1);
		expect(scalarItems).toEqual([
			{
				json: { data: 'ok' },
				pairedItem: { item: 1 },
			},
		]);

		const objectItems = asJsonItems({ success: true }, 3);
		expect(objectItems[0].json).toEqual({ success: true });
	});
});
