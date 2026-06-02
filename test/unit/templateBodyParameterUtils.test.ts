import { describe, expect, it } from 'vitest';
import {
	inferValueTypeFromExample,
	parseCurrencyExample,
	parseDateTimeExample,
} from '../../nodes/KapsoApi/loadOptions/templateBodyParameterUtils';
import { parseTemplateDefinition } from '../../nodes/KapsoApi/loadOptions/templateDefinition';

describe('templateBodyParameterUtils', () => {
	it('infers currency from positional example strings', () => {
		expect(inferValueTypeFromExample('$100.99')).toBe('currency');
		expect(parseCurrencyExample('$100.99')).toEqual({
			code: 'USD',
			amount: 100.99,
			fallback: '$100.99',
		});
	});

	it('rejects bare numeric example strings as date_time during inference', () => {
		expect(inferValueTypeFromExample('12345')).toBe('text');
	});
	it('infers date_time from parseable example strings', () => {
		expect(inferValueTypeFromExample('February 25, 1977')).toBe('date_time');
		expect(parseDateTimeExample('February 25, 1977').fallback).toBe('February 25, 1977');
	});

	it('uses template library body_param_types when present', () => {
		const definition = parseTemplateDefinition({
			name: 'invoice_total',
			language: 'en_US',
			parameter_format: 'positional',
			body_param_types: ['CURRENCY'],
			components: [
				{
					type: 'BODY',
					text: 'Total due: {{1}}',
					example: {
						body_text: [['$250.00']],
					},
				},
			],
		});

		expect(definition.bodyVariables[0].valueType).toBe('currency');
		expect(definition.bodyVariables[0].exampleValue).toBe('$250.00');
	});
});
