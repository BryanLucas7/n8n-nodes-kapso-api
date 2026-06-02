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
		).toBe('order_update|en_US');
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
