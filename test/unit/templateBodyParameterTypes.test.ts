import { describe, expect, it } from 'vitest';
import { buildMetaTemplateComponents } from '../../nodes/KapsoApi/actions/templateComponents';

describe('template body parameter types', () => {
	it('builds currency and date_time body parameters', () => {
		const components = buildMetaTemplateComponents({
			componentMode: 'standard',
			bodyParameters: [
				{
					parameterName: 'total',
					valueType: 'currency',
					currency: {
						code: 'USD',
						fallback_value: '$100.99',
						amount_1000: 100990,
					},
				},
				{
					valueType: 'date_time',
					dateTime: {
						fallback_value: 'February 25, 1977',
						timestamp: 1485470276,
					},
				},
				{
					valueType: 'text',
					parameterText: 'Jessica',
				},
			],
		});

		expect(components).toEqual([
			{
				type: 'body',
				parameters: [
					{
						type: 'currency',
						parameter_name: 'total',
						currency: {
							code: 'USD',
							fallback_value: '$100.99',
							amount_1000: 100990,
						},
					},
					{
						type: 'date_time',
						date_time: {
							fallback_value: 'February 25, 1977',
							timestamp: 1485470276,
						},
					},
					{
						type: 'text',
						text: 'Jessica',
					},
				],
			},
		]);
	});
});
