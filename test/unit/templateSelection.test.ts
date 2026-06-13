import { describe, expect, it } from 'vitest';
import {
	encodeMessageTemplateValue,
	findTemplateEntryBySelection,
	parseTemplateSelection,
} from '../../nodes/KapsoApi/loadOptions/templateSelection';

describe('templateSelection', () => {
	it('encodes template name and language in one value', () => {
		expect(
			encodeMessageTemplateValue({
				name: 'order_update',
				language: 'en_US',
			}),
		).toBe('order_update|en_US|standard|none|n|n|n|n');
	});

	it('encodes detected metadata when entry has parameter format and body text', () => {
		const value = encodeMessageTemplateValue({
			name: 'order_update',
			language: 'en_US',
			parameter_format: 'NAMED',
			components: [
				{ type: 'BODY', text: 'Hello {{customer_name}}, your order {{order_id}} is ready.' },
				{
					type: 'BUTTONS',
					buttons: [{ type: 'URL', text: 'Track', url: 'https://example.com/{{1}}' }],
				},
			],
		});
		expect(value).toBe('order_update|en_US|standard|none|y|y|n|n');
	});

	it('parses composite template selection values', () => {
		expect(parseTemplateSelection('order_update|en_US')).toEqual({
			name: 'order_update',
			language: 'en_US',
		});
	});

	it('supports legacy separate language parameter values', () => {
		expect(parseTemplateSelection('order_update', 'en_US')).toEqual({
			name: 'order_update',
			language: 'en_US',
		});
	});

	it('finds templates by composite selection', () => {
		const entries = [
			{ name: 'order_update', language: 'en_US' },
			{ name: 'order_update', language: 'pt_BR' },
		];

		expect(findTemplateEntryBySelection(entries, 'order_update|pt_BR')).toEqual(entries[1]);
	});
});
